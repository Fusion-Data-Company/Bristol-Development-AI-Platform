import express from 'express';
import { getCache, setCache } from '../../tools/cache';
import { safeParseNumber, calculateCAGR, calculateYoYChange } from '../../tools/util';

const router = express.Router();

// BEA API endpoint for GDP and Personal Income data
router.get('/', async (req, res) => {
  try {
    const { 
      geo = "msa", 
      msa, 
      state, 
      county, 
      startYear = "2015", 
      endYear = "2023" 
    } = req.query;

    // Validate required parameters
    if (geo === "county" && (!state || !county)) {
      return res.status(400).json({ error: "state and county required for county level data" });
    }
    if (geo === "msa" && !msa) {
      return res.status(400).json({ error: "msa (CBSA code) required for MSA level data" });
    }

    // Create cache key
    const key = `bea:${geo}:${msa}:${state}:${county}:${startYear}:${endYear}`;
    const cached = getCache(key);
    if (cached) {
      return res.json(cached);
    }

    const beaKey = process.env.BEA_API_KEY!;
    
    // Determine table and geography
    const tableName = geo === "msa" ? "CAGDP1" : "CAINC1"; // GDP by MSA or Personal Income by County
    const lineCode = geo === "msa" ? "1" : "3"; // All industry GDP or Personal Income
    
    let geoFIPS: string;
    if (geo === "msa") {
      geoFIPS = (msa || "").toString();
    } else {
      const stateCode = (state || "").toString().padStart(2, '0');
      const countyCode = (county || "").toString().padStart(3, '0');
      geoFIPS = `${stateCode}${countyCode}`;
    }

    // Build BEA API URL
    const params = new URLSearchParams({
      UserID: beaKey,
      Method: "GetData",
      DataSetName: "Regional",
      TableName: tableName,
      LineCode: lineCode,
      GeoFIPS: geoFIPS,
      Year: Array.from({length: parseInt(endYear.toString()) - parseInt(startYear.toString()) + 1}, (_, i) => (parseInt(startYear.toString()) + i).toString()).join(','),
      ResultFormat: "JSON"
    });

    console.log('BEA API request:', `https://apps.bea.gov/api/data?${params.toString()}`);

    const response = await fetch(`https://apps.bea.gov/api/data?${params.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BEA API error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    console.log('BEA API response:', json);

    const beaData = json?.BEAAPI?.Results;
    if (!beaData || beaData.length === 0) {
      throw new Error("No data returned from BEA API");
    }

    const data = beaData[0]?.Data || [];
    
    // Process the data
    const rows = data
      .filter((d: any) => d.DataValue && d.DataValue !== "(NA)")
      .map((d: any) => ({
        year: parseInt(d.TimePeriod),
        value: safeParseNumber(d.DataValue),
        unit: d.UNIT_MULT || "Thousands of Dollars"
      }))
      .sort((a: any, b: any) => a.year - b.year);

    if (rows.length === 0) {
      throw new Error("No valid data points found");
    }

    // Calculate derived metrics
    const latest = rows[rows.length - 1];
    const yearAgo = rows.find((r: any) => r.year === latest.year - 1);
    const fiveYearsAgo = rows.find((r: any) => r.year === latest.year - 5);

    const metrics = {
      latest: latest?.value || 0,
      change1Yr: yearAgo ? latest.value - yearAgo.value : null,
      changePercent1Yr: yearAgo ? calculateYoYChange(latest.value, yearAgo.value) : null,
      cagr5Yr: fiveYearsAgo ? calculateCAGR(fiveYearsAgo.value, latest.value, 5) : null,
      unit: latest?.unit || "Thousands of Dollars"
    };

    const result = {
      label: geo === "msa" ? "GDP (Thousands of Dollars)" : "Personal Income (Thousands of Dollars)",
      geo,
      msa,
      state,
      county,
      startYear: parseInt(startYear.toString()),
      endYear: parseInt(endYear.toString()),
      rows,
      metrics,
      dataSource: "Bureau of Economic Analysis",
      lastUpdated: new Date().toISOString()
    };

    // Cache for 12 hours
    setCache(key, result, 12 * 60 * 60 * 1000);
    res.json(result);

  } catch (error: any) {
    console.error("BEA API error:", error);
    res.status(500).json({ 
      error: "Failed to fetch BEA data",
      details: error.message
    });
  }
});

export default router;