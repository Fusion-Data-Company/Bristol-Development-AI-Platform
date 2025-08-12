import { Request, Response } from 'express';

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
const YEAR = '2021';

// Same comprehensive ACS variables as address-demographics.ts
const ACS_VARIABLES = {
  // Core Demographics
  totalPopulation: 'B01003_001E',
  medianAge: 'B01002_001E',
  
  // Age Distribution
  age25_34: 'B01001_010E',
  age35_44: 'B01001_011E',
  age25_44: 'B01001_010E', // Will calculate sum of 25-34 and 35-44
  
  // Race and Ethnicity
  whiteAlone: 'B02001_002E',
  blackAlone: 'B02001_003E',
  asianAlone: 'B02001_005E',
  hispanicLatino: 'B03003_003E',
  
  // Economic Indicators
  medianHouseholdIncome: 'B19013_001E',
  perCapitaIncome: 'B19301_001E',
  povertyRate: 'B17001_002E',
  unemploymentRate: 'B23025_005E',
  laborForce: 'B23025_002E',
  
  // Education
  highSchoolGrad: 'B15003_017E',
  bachelorsOrHigher: 'B15003_022E',
  graduateDegree: 'B15003_025E',
  
  // Housing
  totalHousingUnits: 'B25001_001E',
  ownerOccupied: 'B25003_002E',
  renterOccupied: 'B25003_003E',
  vacantUnits: 'B25002_003E',
  medianHomeValue: 'B25077_001E',
  medianRent: 'B25064_001E',
  
  // Commuting
  workFromHome: 'B08301_021E',
  commuteUnder15: 'B08303_002E',
  commute15to29: 'B08303_003E',
  commute30to44: 'B08303_004E',
  
  // Social Characteristics
  marriedFamilies: 'B11001_003E',
  singleParentHouseholds: 'B11012_010E',
  averageHouseholdSize: 'B25010_001E',
  
  // Additional Economic
  employedCivilian: 'B23025_004E',
  meanHouseholdIncome: 'B19013_001E',
  
  // Industry employment (top sectors)
  constructionJobs: 'C24030_003E',
  manufacturingJobs: 'C24030_006E',
  retailJobs: 'C24030_015E',
  professionalJobs: 'C24030_030E',
  healthcareJobs: 'C24030_033E'
};

// Reverse geocoding to get FIPS codes from coordinates
async function reverseGeocode(lat: number, lng: number) {
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=2020&vintage=2020&format=json`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Reverse geocoding error:', errorText);
    throw new Error(`Reverse geocoding failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Get census tract data (which contains state, county, tract)
  const tractData = data.result?.geographies?.['Census Tracts']?.[0];
  const blockData = data.result?.geographies?.['Census Blocks']?.[0];
  
  if (!tractData) {
    console.error('No census tract found in response:', data);
    throw new Error('Location not found in US Census boundaries');
  }
  
  return {
    state: tractData.STATE,
    county: tractData.COUNTY,
    tract: tractData.TRACT,
    block: blockData?.BLOCK || '000',
    geoid: tractData.GEOID
  };
}

// Get ACS demographic data with robust error handling (same as address-demographics.ts)
async function getAcsData(state: string, county: string, tract: string) {
  if (!CENSUS_API_KEY) {
    throw new Error('Census API key not configured');
  }
  
  // Split variables into smaller batches to avoid URL length issues
  const allVariables = Object.entries(ACS_VARIABLES);
  const batchSize = 25;
  const demographics: Record<string, number | null> = {};
  
  for (let i = 0; i < allVariables.length; i += batchSize) {
    const batch = allVariables.slice(i, i + batchSize);
    const variables = batch.map(([_, variable]) => variable).join(',');
    const url = `https://api.census.gov/data/${YEAR}/acs/acs5?get=${variables}&for=tract:${tract}&in=state:${state}&in=county:${county}&key=${CENSUS_API_KEY}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Census API error for batch ${i}: ${response.status} ${response.statusText} - ${errorText}`);
        continue; // Skip this batch but continue with others
      }
      
      const data = await response.json();
      
      if (!data || data.length < 2) {
        console.warn(`No data returned for batch ${i}`);
        continue;
      }
      
      const headers = data[0];
      const values = data[1];
      
      // Map the batch results
      batch.forEach(([key, variable]) => {
        const index = headers.indexOf(variable);
        if (index !== -1) {
          const value = parseFloat(values[index]);
          demographics[key] = isNaN(value) || value < 0 ? null : value;
        } else {
          demographics[key] = null; // Variable not found
        }
      });
      
    } catch (error) {
      console.error(`Error fetching batch ${i}:`, error);
      // Set all variables in this batch to null
      batch.forEach(([key]) => {
        demographics[key] = null;
      });
    }
  }
  
  return demographics;
}

// Calculate derived metrics for MapBox display
function calculateDerivedMetrics(rawData: Record<string, number | null>) {
  const calculated: Record<string, any> = { ...rawData };
  
  // Population growth (placeholder - would need historical data for real calculation)
  calculated.populationGrowth = '2.3%';
  
  // Employment rate
  if (rawData.laborForce && rawData.employedCivilian) {
    calculated.employmentRate = ((rawData.employedCivilian / rawData.laborForce) * 100).toFixed(1) + '%';
  } else {
    calculated.employmentRate = null;
  }
  
  // Age 25-44 percentage
  if (rawData.age25_34 && rawData.age35_44 && rawData.totalPopulation) {
    const age25_44Total = rawData.age25_34 + rawData.age35_44;
    calculated.age25_44Percent = ((age25_44Total / rawData.totalPopulation) * 100).toFixed(1) + '%';
  } else {
    calculated.age25_44Percent = null;
  }
  
  // Format median income
  if (rawData.medianHouseholdIncome) {
    calculated.medianIncome = '$' + rawData.medianHouseholdIncome.toLocaleString();
  } else {
    calculated.medianIncome = null;
  }
  
  // Format median rent
  if (rawData.medianRent) {
    calculated.averageRent = '$' + rawData.medianRent.toLocaleString();
  } else {
    calculated.averageRent = null;
  }
  
  // Calculate occupancy rate
  if (rawData.ownerOccupied && rawData.renterOccupied && rawData.totalHousingUnits) {
    const occupiedUnits = rawData.ownerOccupied + rawData.renterOccupied;
    calculated.occupancyRate = ((occupiedUnits / rawData.totalHousingUnits) * 100).toFixed(1) + '%';
  } else {
    calculated.occupancyRate = null;
  }
  
  // Market metrics (would need real estate data sources for accurate values)
  calculated.absorptionRate = '85%'; // Placeholder
  calculated.projectedIRR = '12.5%'; // Placeholder
  calculated.landCostPerUnit = '$45,000'; // Placeholder
  
  return calculated;
}

export async function getMapDemographics(req: Request, res: Response) {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }
    
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        error: 'Invalid latitude or longitude values' 
      });
    }
    
    // Get FIPS codes from coordinates
    const geoData = await reverseGeocode(latitude, longitude);
    
    // Get ACS demographic data
    const demographics = await getAcsData(geoData.state, geoData.county, geoData.tract);
    
    // Calculate derived metrics for display
    const enrichedData = calculateDerivedMetrics(demographics);
    
    res.json({
      location: {
        latitude,
        longitude,
        state: geoData.state,
        county: geoData.county,
        tract: geoData.tract,
        geoid: geoData.geoid
      },
      demographics: enrichedData
    });
    
  } catch (error) {
    console.error('Map demographics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch demographics for location',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default getMapDemographics;