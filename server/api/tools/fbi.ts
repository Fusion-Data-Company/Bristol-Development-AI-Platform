import express from 'express';
import { getCache, setCache } from '../../tools/cache';

const router = express.Router();

// FBI API endpoint for state summarized offenses
router.get('/:geo/:state/:offense/:from/:to', async (req, res) => {
  try {
    const { geo = "state", state = "NC", offense = "violent-crime", from = "2014", to = "2023" } = req.params;
    const stateUpper = String(state).toUpperCase();

    const key = `fbi:${geo}:${stateUpper}:${offense}:${from}:${to}`;
    const cached = getCache(key);
    if (cached) return res.json(cached);

    const base = "https://api.usa.gov/crime/fbi/sapi/api";
    const url = `${base}/summarized/${geo}/${stateUpper}/${offense}/${from}/${to}?api_key=${process.env.FBI_CRIME_API_KEY}`;

    const r = await fetch(url);
    const text = await r.text();
    if (!r.ok) {
      console.error("[FBI] fetch failed", { url, status: r.status, text });
      return res.status(r.status).json({ ok: false, error: `FBI ${r.status}`, details: text });
    }

    const j = JSON.parse(text);
    const rows = (j?.results || [])
      .map((d: any) => ({ year: Number(d.data_year), actual: Number(d.actual), cleared: Number(d.cleared) }))
      .sort((a: any, b: any) => a.year - b.year);

    const out = { 
      ok: true, 
      params: { geo, state: stateUpper, offense, from, to }, 
      rows, 
      meta: { label: `${stateUpper} ${offense}`, source: "FBI CDE API" } 
    };
    setCache(key, out, 12 * 60 * 60 * 1000);
    return res.json(out);
  } catch (e: any) {
    console.error("[FBI] error", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;