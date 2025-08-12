import express from 'express';
import { getCache, setCache } from '../../tools/cache';

const router = express.Router();

function bboxAround(lat: number, lng: number, d = 0.2) {
  // Returns bbox as N,W,S,E
  return `${(lat + d).toFixed(3)},${(lng - d).toFixed(3)},${(lat - d).toFixed(3)},${(lng + d).toFixed(3)}`;
}

// NOAA Climate API endpoint
router.get('/', async (req, res) => {
  try {
    const { 
      lat, 
      lng, 
      dataset = "daily-summaries", 
      bbox, 
      startDate, 
      endDate 
    } = req.query;

    if ((!lat || !lng) && !bbox) {
      return res.status(400).json({ error: "lat,lng or bbox required" });
    }

    const _bbox = bbox ? String(bbox) : bboxAround(Number(lat), Number(lng));
    const _end = endDate ? String(endDate) : new Date().toISOString().slice(0, 10);
    const d = new Date(_end);
    d.setFullYear(d.getFullYear() - 1); // Use setFullYear instead of setDate to avoid date issues
    const _start = startDate ? String(startDate) : d.toISOString().slice(0, 10);

    // Create cache key
    const key = `noaa:${dataset}:${_bbox}:${_start}:${_end}`;
    const cached = getCache(key);
    if (cached) {
      return res.json(cached);
    }

    // Step 1: Discover stations using Search Service
    const searchBase = "https://www.ncei.noaa.gov/access/services/search/v1/data";
    const searchUrl = `${searchBase}?dataset=daily-summaries&bbox=${encodeURIComponent(_bbox)}&startDate=${_start}&endDate=${_end}&available=true`;
    
    console.log('NOAA Search API request:', searchUrl);
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('[tools/noaa] search failed', { url: searchUrl, status: searchResponse.status, txt: errorText });
      throw new Error(`NOAA Search API error: ${searchResponse.status} - ${errorText}`);
    }
    
    const searchJson = await searchResponse.json();
    console.log('NOAA Search API response:', searchJson);
    
    // Step 2: Get actual data using Access Data Service
    const stations = (searchJson?.results || []).slice(0, 1); // Take first station
    let json: any = { results: [] };
    
    if (stations.length > 0) {
      const station = stations[0];
      const stationId = station?.id || station?.stationId;
      
      if (stationId) {
        const dataUrl = `https://www.ncei.noaa.gov/access/services/data/v1?dataset=daily-summaries&stations=${stationId}&startDate=${_start}&endDate=${_end}&dataTypes=TMIN,TMAX,PRCP&format=json`;
        console.log('NOAA Data API request:', dataUrl);
        
        const dataResponse = await fetch(dataUrl);
        if (dataResponse.ok) {
          const dataJson = await dataResponse.json();
          json = { results: Array.isArray(dataJson) ? dataJson : [dataJson], stations: [station] };
        }
      }
    }
    console.log('NOAA API response:', json);

    // Normalize results
    const items = (json?.results || []).map((item: any) => ({
      id: item.id,
      name: item.name || item.title || item.dataType || "Climate Data Item",
      summary: item.summary || item.description || null,
      station: item.stations?.[0] || null,
      stationId: item.stations?.[0]?.id || null,
      dataTypes: Array.isArray(item.dataTypes) ? item.dataTypes.slice(0, 5) : [],
      startDate: item.startDate || null,
      endDate: item.endDate || null,
      bbox: item.bbox || null,
      links: Array.isArray(item.links) ? item.links.slice(0, 3) : []
    }));

    // Calculate some basic metrics
    const hasTemp = items.some((item: any) => 
      item.dataTypes.some((dt: any) => 
        dt.id && (dt.id.includes('TEMP') || dt.id.includes('TMAX') || dt.id.includes('TMIN'))
      )
    );

    const hasPrecip = items.some((item: any) => 
      item.dataTypes.some((dt: any) => 
        dt.id && (dt.id.includes('PRCP') || dt.id.includes('RAIN'))
      )
    );

    const uniqueStations = Array.from(new Set(items.map((item: any) => item.stationId).filter(Boolean)));

    const result = {
      params: { lat, lng, dataset, bbox: _bbox, startDate: _start, endDate: _end },
      count: items.length,
      items: items.slice(0, 100), // Limit for UI
      metrics: {
        totalItems: items.length,
        uniqueStations: uniqueStations.length,
        hasTemperature: hasTemp,
        hasPrecipitation: hasPrecip,
        dateRange: `${_start} to ${_end}`
      },
      dataSource: "NOAA Climate Data Archive",
      lastUpdated: new Date().toISOString()
    };

    // Cache for 6 hours
    setCache(key, result, 6 * 60 * 60 * 1000);
    res.json(result);

  } catch (error: any) {
    console.error("NOAA API error:", error);
    res.status(500).json({ 
      error: "Failed to fetch NOAA climate data",
      details: error.message
    });
  }
});

export default router;