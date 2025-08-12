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

function bboxAround(lat: number, lng: number, d = 0.1) {
  // W,S,E,N format for NOAA API
  return `${(lng - d).toFixed(3)},${(lat - d).toFixed(3)},${(lng + d).toFixed(3)},${(lat + d).toFixed(3)}`;
}

// NOAA API endpoint for climate data
router.get('/', async (req, res) => {
  try {
    const q = req.query;
    const lat = q.lat ? Number(q.lat) : undefined;
    const lng = q.lng ? Number(q.lng) : undefined;
    const dataset = String(q.dataset ?? "daily-summaries");
    const startDate = String(q.startDate ?? "2024-01-01");
    const endDate = String(q.endDate ?? new Date().toISOString().slice(0, 10));
    const station = q.station ? String(q.station) : null; // optional, to fetch ADS data

    if ((!lat || !lng) && !q.bbox) {
      return respondErr(res, 400, "lat,lng or bbox required");
    }
    const bbox = String(q.bbox ?? bboxAround(Number(lat), Number(lng)));

    // Step 1: Get stations using NOAA CDO Web Services API
    // Use North Carolina state location instead of bounding box for more reliable results
    const locationid = 'FIPS:37'; // North Carolina FIPS code
    const key1 = `noaa:stations:${locationid}:${startDate}:${endDate}`;
    let discovered = getCache(key1);
    if (!discovered) {
      const stationsUrl = `https://www.ncei.noaa.gov/cdo-web/api/v2/stations?locationid=${locationid}&startdate=${startDate}&enddate=${endDate}&limit=50&datasetid=GHCND`;
      const headers = { 'token': process.env.NOAA_API_KEY || '' };
      
      const r = await fetch(stationsUrl, { headers });
      const text = await r.text();
      if (!r.ok) {
        console.error("[NOAA stations] failed", { stationsUrl, status: r.status, text });
        return respondErr(res, r.status, `NOAA stations ${r.status}: ${text}`, text);
      }
      const j = JSON.parse(text);
      let items = (j?.results || []).map((it: any) => ({
        id: it.id,
        name: it.name || "Weather Station",
        latitude: it.latitude,
        longitude: it.longitude,
        elevation: it.elevation,
        mindate: it.mindate,
        maxdate: it.maxdate,
        datacoverage: it.datacoverage
      }));


      discovered = { params: { locationid, startDate, endDate }, rows: items, meta: { source: "NOAA CDO Web Services", count: items.length } };
      setCache(key1, discovered, 6 * 60 * 60 * 1000);
    }

    // Step 2: if a station is provided, get weather data for that station
    if (station) {
      const key2 = `noaa:data:${dataset}:${station}:${startDate}:${endDate}`;
      const cached2 = getCache(key2);
      if (cached2) return res.json(cached2);

      const dataUrl = `https://www.ncei.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&stationid=${encodeURIComponent(station)}&startdate=${startDate}&enddate=${endDate}&datatypeid=TMIN,TMAX,PRCP&limit=1000&units=standard`;
      const headers = { 'token': process.env.NOAA_API_KEY || '' };
      
      const r2 = await fetch(dataUrl, { headers });
      const text2 = await r2.text();
      if (!r2.ok) {
        console.error("[NOAA data] failed", { dataUrl, status: r2.status, text: text2 });
        return respondErr(res, r2.status, `NOAA data ${r2.status}`, text2);
      }
      const j2 = JSON.parse(text2);
      
      // Group data by date and aggregate temperature/precipitation
      const dataByDate: Record<string, any> = {};
      (j2?.results || []).forEach((item: any) => {
        const date = item.date?.substring(0, 10); // Extract YYYY-MM-DD
        if (!date) return;
        
        if (!dataByDate[date]) {
          dataByDate[date] = { date, tmin: null, tmax: null, prcp: null };
        }
        
        if (item.datatype === 'TMIN') dataByDate[date].tmin = item.value;
        if (item.datatype === 'TMAX') dataByDate[date].tmax = item.value;
        if (item.datatype === 'PRCP') dataByDate[date].prcp = item.value;
      });
      
      const rows = Object.values(dataByDate).sort((a: any, b: any) => a.date.localeCompare(b.date));

      const out2 = { params: { dataset, station, startDate, endDate }, rows, meta: { source: "NOAA CDO Web Services", station } };
      setCache(key2, out2, 6 * 60 * 60 * 1000);
      return respondOk(res, out2);
    }

    // If no station specified, return discovery list
    return respondOk(res, discovered);
  } catch (e: any) {
    console.error("[NOAA] error", e);
    return respondErr(res, 500, e.message);
  }
});

export default router;