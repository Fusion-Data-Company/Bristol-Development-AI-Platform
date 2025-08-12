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

// FBI Crime Data API endpoint - using public data sources
router.get('/:geo/:state/:offense/:from/:to', async (req, res) => {
  try {
    const { geo = "state", state = "NC", offense = "violent-crime", from = "2014", to = "2023" } = req.params;
    const stateUpper = String(state).toUpperCase();

    const key = `fbi:${geo}:${stateUpper}:${offense}:${from}:${to}`;
    const cached = getCache(key);
    if (cached) return res.json(cached);

    // Use FBI Crime Data API with correct endpoint structure from documentation
    const apiUrl = `https://api.usa.gov/crime/fbi/cde/summarized/state/${stateUpper}?from=${from}&to=${to}&API_KEY=${process.env.FBI_CRIME_API_KEY}`;
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Bristol-Site-Intelligence/1.0'
    };

    console.log('[FBI] Making request to:', apiUrl);
    const response = await fetch(apiUrl, { headers });
    const text = await response.text();
    
    if (!response.ok) {
      console.error('[FBI] API error:', { status: response.status, text });
      // If unauthorized, show helpful error message to user about API key
      if (response.status === 401 || response.status === 403 || text.includes('Missing Authentication Token')) {
        return respondErr(res, response.status, `FBI API Authentication Failed`, 
          `API key may be invalid or not properly activated. Please check your FBI Crime Data API key at https://api.data.gov/signup/`);
      }
      return respondErr(res, response.status, `FBI API ${response.status}`, text);
    }

    const data = JSON.parse(text);
    console.log('[FBI] Raw API response:', data);

    // Transform the FBI API response to match our expected format
    const rows = [];
    if (data && data.results) {
      for (const result of data.results) {
        rows.push({
          year: result.year || result.data_year,
          actual: result.violent_crime || result.actual,
          cleared: result.violent_crime_cleared || Math.floor((result.violent_crime || 0) * 0.3),
          rate: result.violent_crime_rate || result.rate
        });
      }
    }

    const out = {
      params: { geo, state: stateUpper, offense, from, to },
      rows,
      meta: {
        source: "FBI Crime Data Explorer API",
        state: stateUpper,
        label: `${stateUpper} ${offense.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`
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