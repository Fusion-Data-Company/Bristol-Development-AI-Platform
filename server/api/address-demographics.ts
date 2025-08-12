import { Request, Response } from 'express';

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const YEAR = '2023';

// Comprehensive ACS variables for address analysis
const ACS_VARIABLES = {
  // Basic Demographics
  total_population: 'B01003_001E',
  median_age: 'B01002_001E',
  male_population: 'B01001_002E',
  female_population: 'B01001_026E',
  
  // Race/Ethnicity
  white_alone: 'B02001_002E',
  black_alone: 'B02001_003E',
  asian_alone: 'B02001_005E',
  hispanic_latino: 'B03003_003E',
  
  // Education
  bachelor_degree_or_higher: 'B15003_022E',
  graduate_degree: 'B15003_023E',
  high_school_or_higher: 'B15003_017E',
  
  // Economics
  median_household_income: 'B19013_001E',
  per_capita_income: 'B19301_001E',
  poverty_rate: 'B17001_002E',
  unemployment_rate: 'B23025_005E',
  labor_force: 'B23025_002E',
  
  // Housing
  median_home_value: 'B25077_001E',
  median_gross_rent: 'B25064_001E',
  owner_occupied_units: 'B25003_002E',
  renter_occupied_units: 'B25003_003E',
  total_housing_units: 'B25001_001E',
  
  // Transportation
  commute_drive_alone: 'B08301_010E',
  commute_carpool: 'B08301_011E',
  commute_public_transit: 'B08301_021E',
  commute_walk: 'B08301_019E',
  commute_work_from_home: 'B08301_021E',
  median_commute_time: 'B08013_001E',
  
  // Family Structure
  married_couple_families: 'B11001_003E',
  single_parent_families: 'B11001_006E',
  households_with_children: 'B11005_002E',
  average_household_size: 'B25010_001E'
};

// Geocode address using Mapbox
async function geocodeAddress(address: string) {
  if (!MAPBOX_TOKEN) {
    throw new Error('Mapbox token not configured');
  }
  
  const encodedAddress = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&country=US&types=address,poi`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data.features || data.features.length === 0) {
    throw new Error('Address not found');
  }
  
  const feature = data.features[0];
  const [longitude, latitude] = feature.center;
  
  return {
    latitude,
    longitude,
    formatted_address: feature.place_name,
    confidence: feature.relevance || 1
  };
}

// Get census tract from coordinates
async function getCensusTract(latitude: number, longitude: number) {
  const url = `https://geo.fcc.gov/api/census/area?lat=${latitude}&lon=${longitude}&format=json`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Census tract lookup failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  const block = data.results?.[0]?.block_fips;
  
  if (!block) {
    throw new Error('Census tract not found for this location');
  }
  
  return {
    state: block.substring(0, 2),
    county: block.substring(2, 5),
    tract: block.substring(5, 11),
    block: block.substring(11),
    geoid: block.substring(0, 11)
  };
}

// Get ACS demographic data
async function getAcsData(state: string, county: string, tract: string) {
  if (!CENSUS_API_KEY) {
    throw new Error('Census API key not configured');
  }
  
  const variables = Object.values(ACS_VARIABLES).join(',');
  const url = `https://api.census.gov/data/${YEAR}/acs/acs5?get=${variables}&for=tract:${tract}&in=state:${state}%20county:${county}&key=${CENSUS_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Census API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data || data.length < 2) {
    throw new Error('No demographic data available for this location');
  }
  
  const headers = data[0];
  const values = data[1];
  
  const demographics: Record<string, number | null> = {};
  Object.entries(ACS_VARIABLES).forEach(([key, variable]) => {
    const index = headers.indexOf(variable);
    if (index !== -1) {
      const value = parseFloat(values[index]);
      demographics[key] = isNaN(value) || value < 0 ? null : value;
    }
  });
  
  return demographics;
}

// Calculate derived metrics
function calculateDerivedMetrics(demographics: Record<string, number | null>) {
  const total_pop = demographics.total_population || 0;
  const labor_force = demographics.labor_force || 0;
  const total_housing = demographics.total_housing_units || 0;
  const occupied = (demographics.owner_occupied_units || 0) + (demographics.renter_occupied_units || 0);
  
  return {
    // Percentages
    percent_male: total_pop ? (demographics.male_population || 0) / total_pop * 100 : null,
    percent_female: total_pop ? (demographics.female_population || 0) / total_pop * 100 : null,
    percent_white: total_pop ? (demographics.white_alone || 0) / total_pop * 100 : null,
    percent_black: total_pop ? (demographics.black_alone || 0) / total_pop * 100 : null,
    percent_asian: total_pop ? (demographics.asian_alone || 0) / total_pop * 100 : null,
    percent_hispanic: total_pop ? (demographics.hispanic_latino || 0) / total_pop * 100 : null,
    percent_bachelor_plus: total_pop ? (demographics.bachelor_degree_or_higher || 0) / total_pop * 100 : null,
    
    // Employment
    employment_rate: labor_force ? ((labor_force - (demographics.unemployment_rate || 0)) / labor_force) * 100 : null,
    
    // Housing
    homeownership_rate: occupied ? (demographics.owner_occupied_units || 0) / occupied * 100 : null,
    vacancy_rate: total_housing ? ((total_housing - occupied) / total_housing) * 100 : null
  };
}

export async function getAddressDemographics(req: Request, res: Response) {
  try {
    const { address, latitude, longitude } = req.body;
    
    let coords;
    let formatted_address;
    
    if (address) {
      // Geocode the address
      const geocoded = await geocodeAddress(address);
      coords = { latitude: geocoded.latitude, longitude: geocoded.longitude };
      formatted_address = geocoded.formatted_address;
    } else if (latitude && longitude) {
      // Use provided coordinates
      coords = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
      formatted_address = `${latitude}, ${longitude}`;
    } else {
      return res.status(400).json({ 
        error: 'Either address or coordinates (latitude, longitude) required' 
      });
    }
    
    // Get census tract
    const tract = await getCensusTract(coords.latitude, coords.longitude);
    
    // Get demographic data
    const demographics = await getAcsData(tract.state, tract.county, tract.tract);
    
    // Calculate derived metrics
    const derived = calculateDerivedMetrics(demographics);
    
    // Combine all data
    const result = {
      location: {
        address: formatted_address,
        coordinates: [coords.longitude, coords.latitude],
        census_tract: {
          state: tract.state,
          county: tract.county,
          tract: tract.tract,
          geoid: tract.geoid,
          block: tract.block
        }
      },
      demographics: {
        ...demographics,
        ...derived
      },
      metadata: {
        acs_year: YEAR,
        analysis_date: new Date().toISOString(),
        data_source: 'US Census Bureau ACS 5-Year Estimates'
      }
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('Address demographics error:', error);
    res.status(500).json({
      error: 'Failed to analyze demographics for this location',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}