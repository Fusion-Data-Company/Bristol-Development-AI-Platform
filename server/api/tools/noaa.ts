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

function bboxAround(lat: number, lng: number, d = 0.1) {
  // W,S,E,N format for NOAA API
  return `${(lng - d).toFixed(3)},${(lat - d).toFixed(3)},${(lng + d).toFixed(3)},${(lat + d).toFixed(3)}`;
}

// NOAA API endpoint for climate data
router.get('/', async (req, res) => {
  try {
    const q = req.query;
    const lat = q.lat ? Number(q.lat) : undefined;
    const lng = q.lng ? Number(q.lng) : undefined;
    const dataset = String(q.dataset ?? "daily-summaries");
    const startDate = String(q.startDate ?? "2024-01-01");
    const endDate = String(q.endDate ?? new Date().toISOString().slice(0, 10));
    const station = q.station ? String(q.station) : null; // optional, to fetch ADS data

    if ((!lat || !lng) && !q.bbox) {
      return respondErr(res, 400, "lat,lng or bbox required");
    }
    const bbox = String(q.bbox ?? bboxAround(Number(lat), Number(lng)));

    // Step 1: discover stations/datasets via Search Service
    const key1 = `noaa:search:${dataset}:${bbox}:${startDate}:${endDate}`;
    let discovered = getCache(key1);
    if (!discovered) {
      const searchUrl = `https://www.ncei.noaa.gov/access/services/search/v1/data?dataset=${encodeURIComponent(dataset)}&bbox=${encodeURIComponent(bbox)}&startDate=${startDate}&endDate=${endDate}&available=true`;
      const r = await fetch(searchUrl);
      const text = await r.text();
      if (!r.ok) {
        console.error("[NOAA search] failed", { searchUrl, status: r.status, text });
        return respondErr(res, r.status, `NOAA search ${r.status}`, text);
      }
      const j = JSON.parse(text);
      const items = (j?.results || []).map((it: any) => ({
        id: it.id,
        name: it.name || it.title || it.dataType || "Item",
        station: it.stations?.[0] || null,
        start: it.startDate || null,
        end: it.endDate || null,
        dataTypes: it.dataTypes || [],
        links: it.links || []
      }));
      discovered = { params: { dataset, bbox, startDate, endDate }, rows: items, meta: { source: "NOAA NCEI Search" } };
      setCache(key1, discovered, 6 * 60 * 60 * 1000);
    }

    // Step 2: if a station is provided (or auto-pick first with station), call ADS for time-series
    if (station) {
      const key2 = `noaa:ads:${dataset}:${station}:${startDate}:${endDate}`;
      const cached2 = getCache(key2);
      if (cached2) return res.json(cached2);

      const adsUrl = `https://www.ncei.noaa.gov/access/services/data/v1?dataset=${encodeURIComponent(dataset)}&stations=${encodeURIComponent(station)}&startDate=${startDate}&endDate=${endDate}&dataTypes=TMIN,TMAX,PRCP&format=json&includeStationName=true&units=standard`;
      const r2 = await fetch(adsUrl);
      const text2 = await r2.text();
      if (!r2.ok) {
        console.error("[NOAA ADS] failed", { adsUrl, status: r2.status, text: text2 });
        return respondErr(res, r2.status, `NOAA ADS ${r2.status}`, text2);
      }
      const j2 = JSON.parse(text2);
      // Normalize: date, tmin, tmax, prcp
      const rows = (Array.isArray(j2) ? j2 : []).map((d: any) => ({
        date: d.DATE,
        tmin: d.TMIN != null ? Number(d.TMIN) : null,
        tmax: d.TMAX != null ? Number(d.TMAX) : null,
        prcp: d.PRCP != null ? Number(d.PRCP) : null
      }));

      const out2 = { params: { dataset, station, startDate, endDate }, rows, meta: { source: "NOAA ADS daily-summaries" } };
      setCache(key2, out2, 6 * 60 * 60 * 1000);
      return respondOk(res, out2);
    }

    // If no station specified, return discovery list
    return respondOk(res, discovered);
  } catch (e: any) {
    console.error("[NOAA] error", e);
    return respondErr(res, 500, e.message);
  }
});

export default router;