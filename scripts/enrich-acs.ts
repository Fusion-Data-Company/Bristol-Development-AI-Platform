// scripts/enrich-acs.ts
import fetch from "node-fetch";
import { eq, isNotNull } from "drizzle-orm";
import { db } from "../server/db.js";
import { sites } from "../shared/schema.js";

/** ACS metrics to load */
const YEAR = "2023";
const DATASET = "acs/acs5";
const VARS = [
  "B01003_001E", // Total population
  "B19013_001E", // Median household income
  "B25064_001E"  // Median gross rent
];

type DbRow = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  fipsState: string | null;
  fipsCounty: string | null;
  geoidTract: string | null;
};

async function sleep(ms: number) { 
  return new Promise(r => setTimeout(r, ms)); 
}

async function fccBlockFind(lat: number, lon: number) {
  const url = `https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lon}&format=json`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`FCC ${r.status}`);
  const j: any = await r.json();
  
  // FIPS: state (2), county (3), tract (6), block (4)
  const state = j?.State?.FIPS;
  const county = j?.County?.FIPS?.slice(2); // last 3
  const tract = j?.Block?.FIPS?.slice(5, 11); // positions per full 15-digit (SSCCCTTTTTTBBBB)
  
  if (!state || !county || !tract) return null;
  return { state, county, tract, geoid: `${state}${county}${tract}` };
}

async function getAcsCounty(year: string, state: string, county: string, vars: string[]) {
  const url = `https://api.census.gov/data/${year}/${DATASET}?get=NAME,${vars.join(",")}&for=tract:*&in=state:${state}&in=county:${county}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`ACS ${r.status} for state:${state} county:${county}`);
  
  const json: any[] = await r.json() as any[];
  const header = json[0];
  const rows = json.slice(1);
  const out = new Map<string, any>();
  
  for (const arr of rows) {
    const obj: any = {};
    header.forEach((h: string, i: number) => obj[h] = arr[i]);
    const geoid = `${obj.state}${obj.county}${obj.tract}`;
    const rec: any = { GEOID: geoid };
    for (const v of vars) rec[v] = obj[v] == null ? null : Number(obj[v]);
    out.set(geoid, rec);
  }
  return out;
}

export default async function run() {
  console.log("🚀 Starting ACS enrichment process...");
  
  // 1) Read all sites that have coordinates
  const siteList = await db.select({
    id: sites.id,
    name: sites.name,
    latitude: sites.latitude,
    longitude: sites.longitude,
    fipsState: sites.fipsState,
    fipsCounty: sites.fipsCounty,
    geoidTract: sites.geoidTract,
  }).from(sites);

  console.log(`Found ${siteList.length} sites to process`);

  // 2) Pass A: ensure each site has GEOID
  for (const site of siteList) {
    if (site.latitude == null || site.longitude == null) continue;
    if (site.geoidTract) continue;
    
    try {
      const hit = await fccBlockFind(site.latitude, site.longitude);
      if (!hit) { 
        console.warn("No FIPS for", site.name); 
        continue; 
      }
      
      await db.update(sites)
        .set({ 
          fipsState: hit.state, 
          fipsCounty: hit.county, 
          geoidTract: hit.geoid 
        })
        .where(eq(sites.id, site.id));
        
      console.log("GEOID ok:", site.name, hit.geoid);
    } catch (e: any) {
      console.error("FCC error:", site.name, e.message);
    }
    await sleep(300);
  }

  // 3) Pass B: pull ACS by county and update acs_profile
  const withGeo = await db.select({
    id: sites.id,
    name: sites.name,
    fipsState: sites.fipsState,
    fipsCounty: sites.fipsCounty,
    geoidTract: sites.geoidTract,
  }).from(sites).where(isNotNull(sites.geoidTract));

  // group by (state,county)
  const buckets = new Map<string, typeof withGeo>();
  for (const site of withGeo) {
    const key = `${site.fipsState}-${site.fipsCounty}`;
    const list = buckets.get(key) || [];
    list.push(site);
    buckets.set(key, list);
  }

  for (const [key, list] of Array.from(buckets.entries())) {
    const [state, county] = key.split("-");
    try {
      const acsMap = await getAcsCounty(YEAR, state, county, VARS);
      
      for (const site of list) {
        const rec = site.geoidTract ? acsMap.get(site.geoidTract) : null;
        if (!rec) continue;
        
        const profile = {
          population: rec["B01003_001E"] ?? null,
          median_income: rec["B19013_001E"] ?? null,
          median_rent: rec["B25064_001E"] ?? null
        };
        
        await db.update(sites)
          .set({ 
            acsYear: YEAR, 
            acsProfile: profile 
          })
          .where(eq(sites.id, site.id));
          
        console.log("ACS ok:", site.name, profile);
      }
    } catch (e: any) {
      console.error("ACS error for county:", key, e.message);
    }
    await sleep(500);
  }

  console.log("✅ Enrichment complete.");
}