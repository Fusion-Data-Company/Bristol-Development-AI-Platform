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

// BLS API endpoint for employment data
router.get('/', async (req, res) => {
  try {
    const q = req.query;
    const level = (q.level ?? "county") as string;
    const state = pad(String(q.state ?? ""), 2);
    const county = pad(String(q.county ?? ""), 3);
    const start = String(q.start ?? "2020-01");
    const end = String(q.end ?? "2025-12");
    
    if (level !== "county") {
      return respondErr(res, 400, "Only level=county supported in this route.");
    }
    if (!state || !county) {
      return respondErr(res, 400, "state (2-digit FIPS) and county (3-digit FIPS) required");
    }

    // Create cache key
    const key = `bls:${level}:${state}:${county}:${start}:${end}`;
    const cached = getCache(key);
    if (cached) {
      return respondOk(res, cached);
    }

    // Correct LAUS county unemployment rate series id:
    const seriesId = `LAUCN${state}${county}0000000003`;

    const payload = {
      seriesid: [seriesId],
      startyear: start.slice(0, 4),
      endyear: end.slice(0, 4),
      registrationKey: process.env.BLS_API_KEY
    };

    const r = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await r.text();
    if (!r.ok) {
      console.error("[BLS] fetch failed", { status: r.status, text });
      return respondErr(res, r.status, `BLS ${r.status}`, text);
    }

    const j = JSON.parse(text);
    const s = j?.Results?.series?.[0]?.data ?? [];
    const rows = s
      .filter((d: any) => /^M\d{2}$/.test(d.period))
      .map((d: any) => ({
        date: `${d.year}-${d.period.substring(1)}`,
        value: Number(d.value)
      }))
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    const result = {
      params: { level, state, county, start, end, seriesId },
      rows,
      meta: { label: "Unemployment rate (%)", source: "BLS LAUS" }
    };

    // Cache for 10 minutes
    setCache(key, result, 10 * 60 * 1000);
    return respondOk(res, result);

  } catch (e: any) {
    console.error("[BLS] error", e);
    return respondErr(res, 500, e.message);
  }
});

export default router;