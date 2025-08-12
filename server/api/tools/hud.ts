import express from 'express';
import { getCache, setCache } from '../../tools/cache';
import { safeParseNumber } from '../../tools/util';

const router = express.Router();

// HUD API endpoint for USPS vacancy data
router.get('/', async (req, res) => {
  try {
    const { 
      mode = "usps", 
      zip, 
      lookbackQ = "8" 
    } = req.query;

    // Validate required parameters
    if (mode === "usps" && !zip) {
      return res.status(400).json({ error: "zip required for USPS vacancy data" });
    }

    // Create cache key
    const key = `hud:${mode}:${zip}:${lookbackQ}`;
    const cached = getCache(key);
    if (cached) {
      return res.json(cached);
    }

    const token = process.env.HUD_API_TOKEN!;
    
    // Build HUD API URL for USPS vacancy data
    const url = `https://www.huduser.gov/hudapi/public/usps?type=3&query=${zip}&year=0`;
    
    console.log('HUD API request:', url);

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HUD API error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    console.log('HUD API response:', json);

    const data = json?.data;
    if (!data || !Array.isArray(data)) {
      throw new Error("No data returned from HUD API");
    }

    // Process the USPS vacancy data
    const rows = data
      .slice(0, parseInt(lookbackQ.toString())) // Take most recent quarters
      .map((d: any) => {
        const total = safeParseNumber(d.total);
        const vacant = safeParseNumber(d.vacant);
        const occupied = safeParseNumber(d.occupied);
        const no_stat = safeParseNumber(d.no_stat);
        
        return {
          quarter: `${d.year}Q${d.quarter}`,
          year: parseInt(d.year),
          quarter_num: parseInt(d.quarter),
          zip: d.zip,
          total: total,
          vacant: vacant,
          occupied: occupied,
          no_stat: no_stat,
          vacancy_rate: total > 0 ? (vacant / total) * 100 : null,
          occupancy_rate: total > 0 ? (occupied / total) * 100 : null
        };
      })
      .sort((a: any, b: any) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.quarter_num - b.quarter_num;
      });

    if (rows.length === 0) {
      throw new Error("No valid data points found for the specified ZIP code");
    }

    // Calculate derived metrics
    const latest = rows[rows.length - 1];
    const yearAgo = rows.find((r: any) => 
      r.year === latest.year - 1 && r.quarter_num === latest.quarter_num
    );

    const metrics = {
      latest_vacancy_rate: latest?.vacancy_rate || 0,
      latest_occupancy_rate: latest?.occupancy_rate || 0,
      total_addresses: latest?.total || 0,
      vacant_addresses: latest?.vacant || 0,
      occupied_addresses: latest?.occupied || 0,
      change_vacancy_rate_1yr: yearAgo ? 
        (latest.vacancy_rate || 0) - (yearAgo.vacancy_rate || 0) : null,
      zip_code: latest?.zip || zip
    };

    const result = {
      label: `USPS Vacancy Rate - ZIP ${zip}`,
      mode,
      zip,
      lookbackQuarters: parseInt(lookbackQ.toString()),
      rows,
      metrics,
      dataSource: "HUD USPS Vacancy Data",
      lastUpdated: new Date().toISOString()
    };

    // Cache for 6 hours
    setCache(key, result, 6 * 60 * 60 * 1000);
    res.json(result);

  } catch (error: any) {
    console.error("HUD API error:", error);
    res.status(500).json({ 
      error: "Failed to fetch HUD data",
      details: error.message
    });
  }
});

export default router;