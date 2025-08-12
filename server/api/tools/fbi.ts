import express from 'express';
import { getCache, setCache } from '../../tools/cache';

const router = express.Router();

// FBI Crime API endpoint
router.get('/', async (req, res) => {
  try {
    const { 
      geo = "state", 
      state = "NC", 
      offense = "violent-crime", 
      from = "2014", 
      to = "2023" 
    } = req.query;

    // Create cache key
    const key = `fbi:${geo}:${state}:${offense}:${from}:${to}`;
    const cached = getCache(key);
    if (cached) {
      return res.json(cached);
    }

    const apiKey = process.env.FBI_CRIME_API_KEY!;
    const base = "https://api.usa.gov/crime/fbi/sapi/api";
    const url = `${base}/summarized/${geo}/${state}/${offense}/${from}/${to}?api_key=${apiKey}`;

    console.log('FBI API request:', url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[tools/fbi] fetch failed', { url, status: response.status, txt: errorText });
      throw new Error(`FBI API error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    console.log('FBI API response:', json);

    const rows = (json?.results || []).map((data: any) => ({
      year: parseInt(data.data_year),
      offense: offense,
      actual: Number(data.actual || 0),
      cleared: Number(data.cleared || 0),
      clearance_rate: data.actual > 0 ? ((data.cleared / data.actual) * 100).toFixed(1) : 0
    })).sort((a: any, b: any) => a.year - b.year);

    // Calculate metrics
    const latest = rows[rows.length - 1];
    const previous = rows[rows.length - 2];
    const yoy = previous ? latest.actual - previous.actual : null;
    const yoyPercent = previous && previous.actual > 0 ? 
      ((latest.actual - previous.actual) / previous.actual * 100).toFixed(1) : null;

    // Calculate trend (simple linear regression slope)
    const n = rows.length;
    let trend = 0;
    if (n >= 3) {
      const avgYear = rows.reduce((sum, r) => sum + r.year, 0) / n;
      const avgActual = rows.reduce((sum, r) => sum + r.actual, 0) / n;
      
      const numerator = rows.reduce((sum, r) => sum + (r.year - avgYear) * (r.actual - avgActual), 0);
      const denominator = rows.reduce((sum, r) => sum + Math.pow(r.year - avgYear, 2), 0);
      
      trend = denominator !== 0 ? numerator / denominator : 0;
    }

    const result = {
      params: { geo, state, offense, from, to },
      rows,
      metrics: {
        latest: latest?.actual || 0,
        latestYear: latest?.year || 0,
        yoy,
        yoyPercent,
        trend: Math.round(trend * 100) / 100,
        avgClearanceRate: rows.length > 0 ? 
          (rows.reduce((sum, r) => sum + parseFloat(r.clearance_rate), 0) / rows.length).toFixed(1) : 0
      },
      dataSource: "FBI Crime Data API",
      lastUpdated: new Date().toISOString()
    };

    // Cache for 12 hours
    setCache(key, result, 12 * 60 * 60 * 1000);
    res.json(result);

  } catch (error: any) {
    console.error("FBI API error:", error);
    res.status(500).json({ 
      error: "Failed to fetch FBI crime data",
      details: error.message
    });
  }
});

export default router;