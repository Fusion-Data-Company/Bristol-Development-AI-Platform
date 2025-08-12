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

    // Use FBI Crime Data API with correct endpoint structure and MM-YYYY date format
    // FBI API expects dates in MM-YYYY format, not just year
    const fromFormatted = `01-${from}`; // January of start year
    const toFormatted = `12-${to}`;     // December of end year
    const apiUrl = `https://api.usa.gov/crime/fbi/cde/summarized/state/${stateUpper}/${offense}?from=${fromFormatted}&to=${toFormatted}&API_KEY=${process.env.FBI_CRIME_API_KEY}`;
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
    console.log('[FBI] Raw API response:', JSON.stringify(data, null, 2));

    // Transform the FBI API response to match our expected format
    const rows = [];
    
    // FBI API returns nested structure with state-specific data
    if (data && data.offenses && data.offenses.actuals) {
      console.log('[FBI] Available keys in actuals:', Object.keys(data.offenses.actuals));
      
      const stateData = data.offenses.actuals['North Carolina'];
      const clearanceData = data.offenses.actuals['North Carolina Clearances'];
      
      console.log('[FBI] State data:', stateData);
      console.log('[FBI] Clearance data:', clearanceData);
      
      if (stateData && typeof stateData === 'object') {
        // Extract years and values from the state data object
        for (const [year, value] of Object.entries(stateData)) {
          const yearNum = Number(year);
          if (!isNaN(yearNum) && yearNum >= 2000) { // Only valid years
            const actualValue = Number(value) || 0;
            const clearedValue = clearanceData && clearanceData[year] ? Number(clearanceData[year]) : 0;
            const rateValue = data.offenses.rates && data.offenses.rates['North Carolina'] && data.offenses.rates['North Carolina'][year] ? 
                             Number(data.offenses.rates['North Carolina'][year]) : 0;
            
            console.log(`[FBI] Year ${year}: actual=${actualValue}, cleared=${clearedValue}, rate=${rateValue}`);
            
            rows.push({
              year: yearNum,
              actual: actualValue,
              cleared: clearedValue,
              rate: rateValue
            });
          }
        }
      }
    }

    console.log('[FBI] Final rows:', rows);

    // Sort by year
    rows.sort((a, b) => a.year - b.year);

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