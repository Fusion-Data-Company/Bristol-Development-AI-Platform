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
    if (cached) return respondOk(res, cached);

    // Use FBI Crime Data API with correct endpoint structure and MM-YYYY date format
    // FBI API expects dates in MM-YYYY format, not just year
    const fromFormatted = `01-${from}`; // January of start year
    const toFormatted = `12-${to}`;     // December of end year
    const apiUrl = `https://api.usa.gov/crime/fbi/cde/summarized/state/${stateUpper}/${offense}?from=${fromFormatted}&to=${toFormatted}&API_KEY=${process.env.FBI_CRIME_API_KEY}`;
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Company-Site-Intelligence/1.0'
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
      
      // Map state codes to full state names as used by FBI API
      const stateNameMap: Record<string, string> = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
        'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
        'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
        'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
        'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
        'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
        'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
        'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
      };
      
      const fullStateName = stateNameMap[stateUpper] || stateUpper;
      const stateData = data.offenses.actuals[fullStateName];
      const clearanceData = data.offenses.actuals[`${fullStateName} Clearances`];
      
      console.log(`[FBI] Looking for state: ${fullStateName}`);
      console.log('[FBI] State data:', stateData);
      console.log('[FBI] Clearance data:', clearanceData);
      
      if (stateData && typeof stateData === 'object') {
        // Extract years from month-year keys (MM-YYYY format)
        const yearlyData: Record<string, { actual: number; cleared: number; rate: number }> = {};
        
        for (const [monthYear, value] of Object.entries(stateData)) {
          const match = monthYear.match(/^\d{2}-(\d{4})$/);
          if (match) {
            const year = match[1];
            const actualValue = Number(value) || 0;
            
            if (!yearlyData[year]) {
              yearlyData[year] = { actual: 0, cleared: 0, rate: 0 };
            }
            yearlyData[year].actual += actualValue;
          }
        }
        
        // Add clearance data
        if (clearanceData && typeof clearanceData === 'object') {
          for (const [monthYear, value] of Object.entries(clearanceData)) {
            const match = monthYear.match(/^\d{2}-(\d{4})$/);
            if (match) {
              const year = match[1];
              const clearedValue = Number(value) || 0;
              
              if (yearlyData[year]) {
                yearlyData[year].cleared += clearedValue;
              }
            }
          }
        }
        
        // Add rate data
        if (data.offenses.rates && data.offenses.rates[fullStateName]) {
          for (const [monthYear, rate] of Object.entries(data.offenses.rates[fullStateName])) {
            const match = monthYear.match(/^\d{2}-(\d{4})$/);
            if (match) {
              const year = match[1];
              if (yearlyData[year]) {
                yearlyData[year].rate = Number(rate) || 0;
              }
            }
          }
        }
        
        // Convert to final format
        for (const [year, data] of Object.entries(yearlyData)) {
          const yearNum = Number(year);
          if (yearNum >= 2000) {
            console.log(`[FBI] Year ${year}: actual=${data.actual}, cleared=${data.cleared}, rate=${data.rate}`);
            rows.push({
              year: yearNum,
              actual: data.actual,
              cleared: data.cleared,
              rate: data.rate
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