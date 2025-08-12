import express from 'express';
import { getCache, setCache } from '../../tools/cache';
import { safeParseNumber, calculateYoYChange } from '../../tools/util';

const router = express.Router();

// BLS API endpoint for employment data
router.get('/', async (req, res) => {
  try {
    const { 
      level = "county", 
      state, 
      county, 
      msa, 
      start = "2018-01", 
      end = "2025-01" 
    } = req.query;

    // Validate required parameters
    if (level === "county" && (!state || !county)) {
      return res.status(400).json({ error: "state and county required for county level data" });
    }
    if (level === "msa" && !msa) {
      return res.status(400).json({ error: "msa (CBSA code) required for MSA level data" });
    }

    // Create cache key
    const key = `bls:${level}:${state}:${county}:${msa}:${start}:${end}`;
    const cached = getCache(key);
    if (cached) {
      return res.json(cached);
    }

    const apiKey = process.env.BLS_API_KEY!;
    const startYear = start.toString().slice(0, 4);
    const endYear = end.toString().slice(0, 4);

    let seriesIds: string[] = [];
    
    if (level === "county") {
      // LAUS county unemployment rate: LAUCNSSCCC03 (SS=state, CCC=county, 03=unemployment rate)
      const stateCode = (state || "").toString().padStart(2, '0');
      const countyCode = (county || "").toString().padStart(3, '0');
      seriesIds.push(`LAUCN${stateCode}${countyCode}03`);
    } else if (level === "msa") {
      // MSA unemployment rate: LAUMT + MSA code + 03
      seriesIds.push(`LAUMT${(msa || "").toString()}03`);
    }

    // BLS API payload
    const payload = {
      seriesid: seriesIds,
      startyear: startYear,
      endyear: endYear,
      registrationkey: apiKey
    };

    console.log('BLS API request:', payload);

    const response = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BLS API error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    console.log('BLS API response:', json);

    if (json.status !== "REQUEST_SUCCEEDED") {
      throw new Error(`BLS API error: ${json.message || 'Request failed'}`);
    }

    // Process the data
    const series = (json.Results?.series || [])[0];
    if (!series) {
      throw new Error("No data returned from BLS API");
    }

    const monthMap: { [key: string]: number } = {
      'M01': 1, 'M02': 2, 'M03': 3, 'M04': 4, 'M05': 5, 'M06': 6,
      'M07': 7, 'M08': 8, 'M09': 9, 'M10': 10, 'M11': 11, 'M12': 12
    };

    const rows = (series.data || []).map((d: any) => ({
      date: `${d.year}-${monthMap[d.period]?.toString().padStart(2, '0') || '01'}`,
      value: safeParseNumber(d.value),
      year: parseInt(d.year),
      month: monthMap[d.period] || 1
    })).sort((a: any, b: any) => a.date.localeCompare(b.date));

    // Calculate derived metrics
    const latest = rows[rows.length - 1];
    const yearAgo = rows.find((r: any) => 
      r.year === latest.year - 1 && r.month === latest.month
    );
    const twoYearsAgo = rows.find((r: any) => 
      r.year === latest.year - 2 && r.month === latest.month
    );

    const metrics = {
      latest: latest?.value || 0,
      change12Mo: yearAgo ? latest.value - yearAgo.value : null,
      change24Mo: twoYearsAgo ? latest.value - twoYearsAgo.value : null,
      changePercent12Mo: yearAgo ? calculateYoYChange(latest.value, yearAgo.value) : null,
      changePercent24Mo: twoYearsAgo ? calculateYoYChange(latest.value, twoYearsAgo.value) : null
    };

    const result = {
      label: "Unemployment Rate (%)",
      level,
      state,
      county,
      msa,
      start,
      end,
      rows,
      metrics,
      dataSource: "Bureau of Labor Statistics",
      lastUpdated: new Date().toISOString()
    };

    // Cache for 10 minutes
    setCache(key, result, 10 * 60 * 1000);
    res.json(result);

  } catch (error: any) {
    console.error("BLS API error:", error);
    res.status(500).json({ 
      error: "Failed to fetch BLS data",
      details: error.message
    });
  }
});

export default router;