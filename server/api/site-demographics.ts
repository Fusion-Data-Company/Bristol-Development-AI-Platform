import { Request, Response } from 'express';
import { db } from '../db';
import { sites } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
const YEAR = '2023';

// Detailed ACS variables for in-depth analysis
const DETAILED_ACS_VARS = {
  // Population characteristics
  total_population: 'B01003_001E',
  median_age: 'B01002_001E',
  male_population: 'B01001_002E',
  female_population: 'B01001_026E',
  
  // Race and ethnicity
  white_alone: 'B02001_002E',
  black_alone: 'B02001_003E',
  asian_alone: 'B02001_005E',
  hispanic_latino: 'B03003_003E',
  
  // Education
  bachelor_degree_or_higher: 'B15003_022E',
  graduate_degree: 'B15003_023E',
  
  // Employment and income
  median_household_income: 'B19013_001E',
  per_capita_income: 'B19301_001E',
  unemployment_rate: 'B23025_005E',
  labor_force: 'B23025_002E',
  
  // Housing
  median_home_value: 'B25077_001E',
  median_gross_rent: 'B25064_001E',
  owner_occupied_units: 'B25003_002E',
  renter_occupied_units: 'B25003_003E',
  
  // Commuting
  commute_less_than_15_min: 'B08303_003E',
  commute_15_to_29_min: 'B08303_004E',
  commute_30_to_44_min: 'B08303_005E',
  commute_45_plus_min: 'B08303_008E',
  
  // Family characteristics
  married_couple_families: 'B11001_003E',
  single_parent_families: 'B11001_006E',
  households_with_children: 'B11005_002E'
};

// Get FIPS codes from coordinates using FCC API
async function getFipsFromCoords(lat: number, lng: number) {
  const url = `https://geo.fcc.gov/api/census/area?lat=${lat}&lon=${lng}&format=json`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`FCC API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const block = data.results?.[0]?.block_fips;
  
  if (!block) {
    throw new Error('No census block found');
  }
  
  return {
    state: block.substring(0, 2),
    county: block.substring(2, 5),
    tract: block.substring(5, 11),
    geoid: block.substring(0, 11) // state + county + tract
  };
}

// Get detailed ACS data for a tract
async function getDetailedAcsData(state: string, county: string, tract: string) {
  if (!CENSUS_API_KEY) {
    throw new Error('Census API key not configured');
  }
  
  const variables = Object.values(DETAILED_ACS_VARS).join(',');
  const url = `https://api.census.gov/data/${YEAR}/acs/acs5?get=${variables}&for=tract:${tract}&in=state:${state}%20county:${county}&key=${CENSUS_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Census API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data || data.length < 2) {
    throw new Error('No census data found');
  }
  
  const headers = data[0];
  const values = data[1];
  
  const result: Record<string, number> = {};
  Object.entries(DETAILED_ACS_VARS).forEach(([key, variable]) => {
    const index = headers.indexOf(variable);
    if (index !== -1) {
      const value = parseFloat(values[index]);
      result[key] = isNaN(value) || value < 0 ? null : value;
    }
  });
  
  return result;
}

// Get surrounding tracts within radius (simplified - just get adjacent tracts)
async function getSurroundingTracts(state: string, county: string, tract: string) {
  if (!CENSUS_API_KEY) {
    return [];
  }
  
  try {
    // Get all tracts in the county
    const url = `https://api.census.gov/data/${YEAR}/acs/acs5?get=NAME,${Object.values(DETAILED_ACS_VARS).join(',')}&for=tract:*&in=state:${state}%20county:${county}&key=${CENSUS_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!data || data.length < 2) return [];
    
    const headers = data[0];
    const rows = data.slice(1);
    
    // Get adjacent tracts (simple numeric proximity)
    const targetTractNum = parseInt(tract);
    const adjacentTracts = rows
      .filter((row: any[]) => {
        const tractNum = parseInt(row[row.length - 1]);
        return Math.abs(tractNum - targetTractNum) <= 200 && tractNum !== targetTractNum; // Within ~2 tract numbers
      })
      .slice(0, 5) // Limit to 5 surrounding tracts
      .map((row: any[]) => {
        const result: Record<string, any> = { tract: row[row.length - 1] };
        Object.entries(DETAILED_ACS_VARS).forEach(([key, variable]) => {
          const index = headers.indexOf(variable);
          if (index !== -1) {
            const value = parseFloat(row[index]);
            result[key] = isNaN(value) || value < 0 ? null : value;
          }
        });
        return result;
      });
    
    return adjacentTracts;
  } catch (error) {
    console.error('Error getting surrounding tracts:', error);
    return [];
  }
}

export async function getSiteDemographics(req: Request, res: Response) {
  try {
    const { siteId } = req.params;
    
    if (!siteId) {
      return res.status(400).json({ error: 'Site ID required' });
    }
    
    // Get site from database
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
    
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    if (!site.latitude || !site.longitude) {
      return res.status(400).json({ error: 'Site coordinates not available' });
    }
    
    // Get FIPS codes
    const fips = await getFipsFromCoords(site.latitude, site.longitude);
    
    // Get detailed demographics for the site's tract
    const siteData = await getDetailedAcsData(fips.state, fips.county, fips.tract);
    
    // Get surrounding tracts data
    const surroundingData = await getSurroundingTracts(fips.state, fips.county, fips.tract);
    
    // Calculate area averages for comparison
    const allTracts = [siteData, ...surroundingData];
    const areaAverages: Record<string, number> = {};
    
    Object.keys(DETAILED_ACS_VARS).forEach(key => {
      const values = allTracts
        .map(tract => tract[key])
        .filter(val => val !== null && !isNaN(val));
      
      if (values.length > 0) {
        areaAverages[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
      } else {
        areaAverages[key] = 0;
      }
    });
    
    // Update site in database with basic demographic info
    await db.update(sites)
      .set({
        fipsState: fips.state,
        fipsCounty: fips.county,
        geoidTract: fips.geoid,
        acsYear: YEAR,
        acsProfile: {
          population: siteData.total_population,
          median_income: siteData.median_household_income,
          median_rent: siteData.median_gross_rent
        }
      })
      .where(eq(sites.id, siteId));
    
    res.json({
      site: {
        id: site.id,
        name: site.name,
        coordinates: [site.longitude, site.latitude],
        fips,
        demographics: siteData
      },
      area: {
        averages: areaAverages,
        surrounding_tracts: surroundingData,
        tract_count: allTracts.length
      },
      metadata: {
        acs_year: YEAR,
        analysis_date: new Date().toISOString(),
        variables_analyzed: Object.keys(DETAILED_ACS_VARS).length
      }
    });
    
  } catch (error) {
    console.error('Site demographics error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze site demographics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}