import express from 'express';
import { getCache, setCache } from '../../tools/cache';

const router = express.Router();

function respondOk(res: express.Response, payload: any) {
  const rows = payload.rows || [];
  return res.status(200).json({
    ...payload,
    ok: true,
    hasData: rows.length > 0,
    data: rows
  });
}

function respondErr(res: express.Response, status: number, error: string, details?: string) {
  return res.status(status).json({
    ok: false,
    hasData: false,
    data: [],
    error,
    details
  });
}

const DEFAULT_CATS = "17069,13032,13000,13003,18021,16032,17014,19046";
const WEIGHTS: Record<string, number> = {
  "17069": 2.0, "13032": 1.5, "13000": 1.0, "13003": 0.8,
  "18021": 1.5, "16032": 1.2, "17014": 1.2, "19046": 1.3
};

// Foursquare API endpoint for places data
router.get('/:lat/:lng/:radius', async (req, res) => {
  try {
    const { lat, lng, radius = "1600" } = req.params;
    const { categories = DEFAULT_CATS, limit = "50" } = req.query;
    
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const limitNum = Math.min(Number(limit), 50);
    
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return respondErr(res, 400, "lat,lng required");
    }

    const key = `fsq:${lat}:${lng}:${radius}:${categories}:${limit}`;
    const cached = getCache(key);
    if (cached) return respondOk(res, cached);

    const url = new URL("https://places-api.foursquare.com/places/search");
    url.searchParams.set("ll", `${lat},${lng}`);
    url.searchParams.set("radius", String(radius));
    url.searchParams.set("categories", String(categories));
    url.searchParams.set("limit", String(limitNum));
    url.searchParams.set("sort", "RELEVANCE");

    const r = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.FOURSQUARE_API_KEY}`,
        Accept: "application/json",
        "X-Places-Api-Version": "2025-06-17"
      }
    });

    const text = await r.text();
    if (!r.ok) {
      console.error("[FSQ] fetch failed", { url: url.toString(), status: r.status, text });
      return respondErr(res, r.status, `Foursquare ${r.status}`, text);
    }

    const j = JSON.parse(text);
    const places = (j.results || []).map((p: any) => ({
      fsq_id: p.fsq_place_id,
      name: p.name,
      category_id: p.categories?.[0]?.fsq_category_id ?? null,
      category: p.categories?.[0]?.name ?? null,
      distance_m: p.distance ?? null,
      lat: p.latitude ?? null,
      lng: p.longitude ?? null
    }));

    const byCategory: Record<string, { id: number | null; name: string; count: number; weight: number }> = {};
    for (const pl of places) {
      const id = String(pl.category_id ?? "other");
      const name = pl.category ?? "Other";
      const weight = WEIGHTS[id] ?? 0.5;
      byCategory[id] = byCategory[id] || { id: pl.category_id, name, count: 0, weight };
      byCategory[id].count++;
    }
    const score = Object.values(byCategory).reduce((acc, c) => acc + c.count * c.weight, 0);

    const out = {
      params: { lat: latNum, lng: lngNum, radius: Number(radius), categories: String(categories), limit: limitNum },
      rows: places,
      meta: { score, byCategory: Object.values(byCategory), source: "Foursquare Places API 2025" }
    };
    setCache(key, out, 60 * 60 * 1000);
    return respondOk(res, out);
  } catch (e: any) {
    console.error("[FSQ] error", e);
    return respondErr(res, 500, e.message);
  }
});

export default router;