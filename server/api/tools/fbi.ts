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

// FBI Crime Data Explorer API endpoint for state agencies and offense data
router.get('/:state/:offense', async (req, res) => {
  try {
    const { state = "NC", offense = "violent-crime" } = req.params;
    const stateUpper = String(state).toUpperCase();

    const key = `fbi:${stateUpper}:${offense}`;
    const cached = getCache(key);
    if (cached) return res.json(cached);

    // First, get agencies for the state
    const agenciesUrl = `https://api.usa.gov/crime/fbi/sapi/api/agencies/byStateAbbr/${stateUpper}?api_key=${process.env.FBI_CRIME_API_KEY}`;
    
    const agenciesRes = await fetch(agenciesUrl);
    const agenciesText = await agenciesRes.text();
    if (!agenciesRes.ok) {
      console.error("[FBI] agencies fetch failed", { url: agenciesUrl, status: agenciesRes.status, text: agenciesText });
      return respondErr(res, agenciesRes.status, `FBI Agencies ${agenciesRes.status}`, agenciesText);
    }

    const agenciesData = JSON.parse(agenciesText);
    const agencies = agenciesData.results || [];
    
    if (agencies.length === 0) {
      return respondErr(res, 404, "No agencies found for state", stateUpper);
    }

    // Get data for the largest agency (usually state police or major city)
    const mainAgency = agencies.sort((a: any, b: any) => (b.population || 0) - (a.population || 0))[0];
    const ori = mainAgency.ori;

    const dataUrl = `https://api.usa.gov/crime/fbi/sapi/api/summarized/agencies/${ori}/${offense}?api_key=${process.env.FBI_CRIME_API_KEY}`;
    
    const r = await fetch(dataUrl);
    const text = await r.text();
    if (!r.ok) {
      console.error("[FBI] data fetch failed", { url: dataUrl, status: r.status, text });
      return respondErr(res, r.status, `FBI Data ${r.status}`, text);
    }

    const j = JSON.parse(text);
    const rows = (j?.results || [])
      .map((d: any) => ({ 
        year: Number(d.data_year), 
        actual: Number(d.actual || 0), 
        cleared: Number(d.cleared || 0),
        rate: Number(d.rate || 0)
      }))
      .sort((a: any, b: any) => a.year - b.year);

    const out = { 
      params: { state: stateUpper, offense, agency: mainAgency.agency_name, ori }, 
      rows, 
      meta: { 
        label: `${mainAgency.agency_name} - ${offense}`, 
        source: "FBI Crime Data Explorer",
        population: mainAgency.population,
        state: stateUpper
      } 
    };
    setCache(key, out, 12 * 60 * 60 * 1000);
    return respondOk(res, out);
  } catch (e: any) {
    console.error("[FBI] error", e);
    return respondErr(res, 500, e.message);
  }
});

export default router;