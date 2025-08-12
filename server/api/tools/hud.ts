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

const HUD_BASE = "https://www.huduser.gov";
const CROSSWALK = `${HUD_BASE}/hudapi/public/usps`;

async function fetchText(url: string, headers: Record<string, string> = {}) {
  const r = await fetch(url, { headers });
  const text = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${text}`);
  return text;
}

// HUD API endpoint for USPS vacancy data
router.get('/:mode/:zip/:lookbackQ', async (req, res) => {
  try {
    const { mode = "crosswalk", zip, lookbackQ = "8" } = req.params;
    if (!zip) {
      return respondErr(res, 400, "zip required");
    }

    if (mode === "crosswalk") {
      const key = `hud:crosswalk:${zip}`;
      const cached = getCache(key);
      if (cached) return res.json(cached);

      const token = process.env.HUD_API_TOKEN!;
      const url = `${CROSSWALK}?type=1&query=${encodeURIComponent(zip)}`;
      const text = await fetchText(url, { Authorization: `Bearer ${token}` });
      const j = JSON.parse(text);

      const rows = (j?.data || j?.results || []).map((r: any) => ({
        zip: r.zip ?? zip,
        state: r.usps_zip_pref_state ?? r.state ?? null,
        county: r.county ?? r.county_fips ?? null,
        cbsa: r.cbsa ?? r.cbsa_code ?? null,
        tract: r.census_tract ?? null,
        res_ratio: r.res_ratio ?? null
      }));

      const out = { params: { mode, zip }, rows, meta: { source: "HUD USPS Crosswalk" } };
      setCache(key, out, 12 * 60 * 60 * 1000);
      return respondOk(res, out);
    }

    if (mode === "vacancy") {
      // Download the most recent quarterly USPS vacancy CSV for ZIPs
      // Example path (builder: update if HUD changes): the "Latest" ZIP CSV link from USPS dataset page.
      // For demonstration, we assume a URL pattern; in production, store the latest CSV URL in config.
      const latestUrl = `${HUD_BASE}/portal/sites/default/files/zip_by_quarter/latest_zip_usps.csv`;
      const key = `hud:vacancy:${latestUrl}:${zip}:${lookbackQ}`;
      const cached = getCache(key);
      if (cached) return res.json(cached);

      const csv = await fetchText(latestUrl);
      // very simple CSV parse (no commas in fields in this dataset)
      const lines = csv.trim().split(/\r?\n/);
      const header = lines.shift()?.split(",") ?? [];
      const idx = (name: string) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());

      const zipIdx = idx("ZIP") !== -1 ? idx("ZIP") : idx("zip");
      const qIdx = idx("QUARTER") !== -1 ? idx("QUARTER") : idx("quarter");
      const vacIdx = idx("RESIDENTIAL_VACANT") !== -1 ? idx("RESIDENTIAL_VACANT") : idx("vacant");
      const totIdx = idx("RESIDENTIAL_TOTAL") !== -1 ? idx("RESIDENTIAL_TOTAL") : idx("total");

      if (zipIdx === -1 || qIdx === -1 || vacIdx === -1 || totIdx === -1) {
        return respondErr(res, 500, "HUD CSV columns not found (schema changed)");
      }

      const allRows = lines.map(line => line.split(",")).filter(cols => cols[zipIdx] === zip);
      const rows = allRows
        .map(cols => ({
          quarter: cols[qIdx],
          vacant: Number(cols[vacIdx] || 0),
          total: Number(cols[totIdx] || 0)
        }))
        .filter(r => r.total > 0)
        .sort((a, b) => String(a.quarter).localeCompare(String(b.quarter)))
        .slice(-Number(lookbackQ))
        .map(r => ({ ...r, vacancy_rate: r.vacant / r.total }));

      const out = { params: { mode, zip, lookbackQ }, rows, meta: { source: "HUD USPS Vacancy CSV (latest)" } };
      setCache(key, out, 24 * 60 * 60 * 1000);
      return respondOk(res, out);
    }

    return respondErr(res, 400, `Unsupported mode: ${mode}`);
  } catch (e: any) {
    console.error("[HUD] error", e);
    return respondErr(res, 500, e.message);
  }
});

export default router;