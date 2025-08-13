import express from 'express';
import { getCache, setCache } from '../../tools/cache';

const router = express.Router();

function pad(n: string | number, len: number) {
  return String(n).padStart(len, "0");
}

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

// BEA API endpoint for GDP and Personal Income data
router.get('/', async (req, res) => {
  try {
    const q = req.query;
    const geo = (q.geo ?? "msa") as "msa" | "county";
    const state = pad(String(q.state ?? ""), 2);
    const county = pad(String(q.county ?? ""), 3);
    const msa = String(q.msa ?? "");
    const startYear = String(q.startYear ?? "2015");
    const endYear = String(q.endYear ?? new Date().getFullYear());

    const userID = process.env.BEA_API_KEY!;
    if (geo === "msa" && !msa) {
      return res.status(400).json({ ok: false, error: "msa (CBSA) required for geo=msa" });
    }
    if (geo === "county" && (!state || !county)) {
      return res.status(400).json({ ok: false, error: "state+county required for geo=county" });
    }

    // Create cache key
    const key = `bea:${geo}:${msa}:${state}:${county}:${startYear}:${endYear}`;
    const cached = getCache(key);
    if (cached) {
      return respondOk(res, cached);
    }

    // Known-good tables:
    const table = geo === "msa" ? "CAGDP2" : "CAINC1";
    const geoFips = geo === "msa" ? `MSA${msa}` : `${state}${county}`;
    const params = new URLSearchParams({
      UserID: userID,
      Method: "GetData",
      DataSetName: "Regional",
      TableName: table,
      LineCode: "1",
      GeoFIPS: geoFips,
      Year: `${startYear}-${endYear}`,
      ResultFormat: "JSON"
    });

    const url = `https://apps.bea.gov/api/data?${params.toString()}`;
    const r = await fetch(url);
    const text = await r.text();
    if (!r.ok) {
      console.error("[BEA] fetch failed", { url, status: r.status, text });
      return respondErr(res, r.status, `BEA ${r.status}`, text);
    }

    const j = JSON.parse(text);
    const data = j?.BEAAPI?.Results?.Data ?? [];
    const rows = data
      .map((d: any) => ({ year: Number(d.Year), value: Number(String(d.DataValue || "0").replace(/,/g, "")) }))
      .filter((x: any) => Number.isFinite(x.value))
      .sort((a: any, b: any) => a.year - b.year);

    const result = {
      params: { geo, msa, state, county, startYear, endYear, table, geoFips },
      rows,
      meta: { label: geo === "msa" ? "MSA Real GDP (chained $)" : "County Personal Income ($)", source: "BEA Regional" }
    };

    // Cache for 12 hours
    setCache(key, result, 12 * 60 * 60 * 1000);
    return respondOk(res, result);

  } catch (e: any) {
    console.error("[BEA] error", e);
    return respondErr(res, 500, e.message);
  }
});

export default router;