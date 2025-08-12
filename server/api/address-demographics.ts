import { Request, Response } from 'express';

const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
const MAPBOX_TOKEN = process.env.VITE_MAPBOX_ACCESS_TOKEN;
const YEAR = '2021';

// Comprehensive ACS variables for complete demographic analysis
const ACS_VARIABLES = {
  // Core Demographics
  total_population: 'B01003_001E',
  median_age: 'B01002_001E',
  male_population: 'B01001_002E',
  female_population: 'B01001_026E',
  
  // Age Groups (detailed)
  age_under_5: 'B01001_003E',
  age_5_to_17: 'B01001_004E',
  age_18_to_24: 'B01001_007E',
  age_25_to_34: 'B01001_009E',
  age_35_to_44: 'B01001_011E',
  age_45_to_54: 'B01001_013E',
  age_55_to_64: 'B01001_015E',
  age_65_to_74: 'B01001_017E',
  age_75_plus: 'B01001_019E',
  
  // Race/Ethnicity (complete)
  white_alone: 'B02001_002E',
  black_alone: 'B02001_003E',
  american_indian_alone: 'B02001_004E',
  asian_alone: 'B02001_005E',
  pacific_islander_alone: 'B02001_006E',
  other_race_alone: 'B02001_007E',
  two_or_more_races: 'B02001_008E',
  hispanic_latino: 'B03003_003E',
  
  // Education (complete levels)
  less_than_9th_grade: 'B15003_002E',
  grade_9_to_12: 'B15003_003E',
  high_school_graduate: 'B15003_017E',
  some_college: 'B15003_019E',
  associates_degree: 'B15003_021E',
  bachelors_degree: 'B15003_022E',
  masters_degree: 'B15003_023E',
  professional_degree: 'B15003_024E',
  doctorate_degree: 'B15003_025E',
  total_education_pop: 'B15003_001E',
  
  // Economics (comprehensive)
  median_household_income: 'B19013_001E',
  per_capita_income: 'B19301_001E',
  mean_household_income: 'B19025_001E',
  poverty_total: 'B17001_001E',
  poverty_below: 'B17001_002E',
  gini_index: 'B19083_001E',
  
  // Employment
  labor_force: 'B23025_002E',
  employed: 'B23025_004E',
  unemployed: 'B23025_005E',
  not_in_labor_force: 'B23025_007E',
  
  // Income Brackets
  income_under_10k: 'B19001_002E',
  income_10k_to_15k: 'B19001_003E',
  income_15k_to_20k: 'B19001_004E',
  income_20k_to_25k: 'B19001_005E',
  income_25k_to_30k: 'B19001_006E',
  income_30k_to_35k: 'B19001_007E',
  income_35k_to_40k: 'B19001_008E',
  income_40k_to_45k: 'B19001_009E',
  income_45k_to_50k: 'B19001_010E',
  income_50k_to_60k: 'B19001_011E',
  income_60k_to_75k: 'B19001_012E',
  income_75k_to_100k: 'B19001_013E',
  income_100k_to_125k: 'B19001_014E',
  income_125k_to_150k: 'B19001_015E',
  income_150k_to_200k: 'B19001_016E',
  income_200k_plus: 'B19001_017E',
  total_income_households: 'B19001_001E',
  
  // Housing (complete)
  total_housing_units: 'B25001_001E',
  occupied_housing_units: 'B25003_001E',
  owner_occupied_units: 'B25003_002E',
  renter_occupied_units: 'B25003_003E',
  vacant_housing_units: 'B25002_003E',
  median_home_value: 'B25077_001E',
  median_gross_rent: 'B25064_001E',
  median_rooms: 'B25018_001E',
  
  // Housing Costs
  housing_cost_30_percent_plus: 'B25070_007E',
  housing_cost_50_percent_plus: 'B25070_010E',
  rent_under_500: 'B25063_002E',
  rent_500_to_999: 'B25063_003E',
  rent_1000_to_1499: 'B25063_004E',
  rent_1500_to_1999: 'B25063_005E',
  rent_2000_plus: 'B25063_006E',
  
  // Transportation (detailed)
  total_commuters: 'B08301_001E',
  commute_drive_alone: 'B08301_010E',
  commute_carpool: 'B08301_011E',
  commute_public_transit: 'B08301_021E',
  commute_walk: 'B08301_019E',
  commute_bicycle: 'B08301_018E',
  commute_work_from_home: 'B08301_021E',
  commute_other: 'B08301_020E',
  median_commute_time: 'B08013_001E',
  no_vehicle_households: 'B08201_002E',
  total_vehicle_households: 'B08201_001E',
  
  // Family Structure
  total_households: 'B11001_001E',
  family_households: 'B11001_002E',
  married_couple_families: 'B11001_003E',
  single_parent_families: 'B11001_006E',
  nonfamily_households: 'B11001_007E',
  households_with_children: 'B11005_002E',
  average_household_size: 'B25010_001E',
  average_family_size: 'B25010_002E',
  
  // Technology/Broadband
  total_broadband_households: 'B28002_001E',
  broadband_with_subscription: 'B28002_004E',
  no_internet_access: 'B28002_013E',
  
  // Veterans
  total_veterans: 'B21001_002E',
  
  // Disability
  total_disability_pop: 'B18101_001E',
  with_disability: 'B18101_004E'
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

// Get ACS demographic data with robust error handling
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

// Calculate comprehensive derived metrics and percentages
function calculateDerivedMetrics(demographics: Record<string, number | null>) {
  const total_pop = demographics.total_population || 0;
  const education_pop = demographics.total_education_pop || 0;
  const labor_force = demographics.labor_force || 0;
  const total_housing = demographics.total_housing_units || 0;
  const occupied = demographics.occupied_housing_units || 0;
  const total_households = demographics.total_households || 0;
  const total_commuters = demographics.total_commuters || 0;
  const income_households = demographics.total_income_households || 0;
  const broadband_households = demographics.total_broadband_households || 0;
  const disability_pop = demographics.total_disability_pop || 0;
  const vehicle_households = demographics.total_vehicle_households || 0;
  
  return {
    // Demographics Percentages
    percent_male: total_pop ? (demographics.male_population || 0) / total_pop * 100 : null,
    percent_female: total_pop ? (demographics.female_population || 0) / total_pop * 100 : null,
    
    // Age Distribution
    percent_under_18: total_pop ? ((demographics.age_under_5 || 0) + (demographics.age_5_to_17 || 0)) / total_pop * 100 : null,
    percent_18_to_64: total_pop ? ((demographics.age_18_to_24 || 0) + (demographics.age_25_to_34 || 0) + (demographics.age_35_to_44 || 0) + (demographics.age_45_to_54 || 0) + (demographics.age_55_to_64 || 0)) / total_pop * 100 : null,
    percent_65_plus: total_pop ? ((demographics.age_65_to_74 || 0) + (demographics.age_75_plus || 0)) / total_pop * 100 : null,
    
    // Race/Ethnicity Percentages
    percent_white: total_pop ? (demographics.white_alone || 0) / total_pop * 100 : null,
    percent_black: total_pop ? (demographics.black_alone || 0) / total_pop * 100 : null,
    percent_asian: total_pop ? (demographics.asian_alone || 0) / total_pop * 100 : null,
    percent_hispanic: total_pop ? (demographics.hispanic_latino || 0) / total_pop * 100 : null,
    percent_other_races: total_pop ? ((demographics.american_indian_alone || 0) + (demographics.pacific_islander_alone || 0) + (demographics.other_race_alone || 0) + (demographics.two_or_more_races || 0)) / total_pop * 100 : null,
    
    // Education Percentages
    percent_less_than_high_school: education_pop ? ((demographics.less_than_9th_grade || 0) + (demographics.grade_9_to_12 || 0)) / education_pop * 100 : null,
    percent_high_school: education_pop ? (demographics.high_school_graduate || 0) / education_pop * 100 : null,
    percent_some_college: education_pop ? ((demographics.some_college || 0) + (demographics.associates_degree || 0)) / education_pop * 100 : null,
    percent_bachelors_plus: education_pop ? ((demographics.bachelors_degree || 0) + (demographics.masters_degree || 0) + (demographics.professional_degree || 0) + (demographics.doctorate_degree || 0)) / education_pop * 100 : null,
    percent_graduate_degree: education_pop ? ((demographics.masters_degree || 0) + (demographics.professional_degree || 0) + (demographics.doctorate_degree || 0)) / education_pop * 100 : null,
    
    // Employment Rates
    employment_rate: labor_force ? (demographics.employed || 0) / labor_force * 100 : null,
    unemployment_rate: labor_force ? (demographics.unemployed || 0) / labor_force * 100 : null,
    labor_force_participation: total_pop > 16 ? labor_force / total_pop * 100 : null,
    
    // Income Distribution
    percent_income_under_25k: income_households ? ((demographics.income_under_10k || 0) + (demographics.income_10k_to_15k || 0) + (demographics.income_15k_to_20k || 0) + (demographics.income_20k_to_25k || 0)) / income_households * 100 : null,
    percent_income_25k_to_50k: income_households ? ((demographics.income_25k_to_30k || 0) + (demographics.income_30k_to_35k || 0) + (demographics.income_35k_to_40k || 0) + (demographics.income_40k_to_45k || 0) + (demographics.income_45k_to_50k || 0)) / income_households * 100 : null,
    percent_income_50k_to_100k: income_households ? ((demographics.income_50k_to_60k || 0) + (demographics.income_60k_to_75k || 0) + (demographics.income_75k_to_100k || 0)) / income_households * 100 : null,
    percent_income_100k_plus: income_households ? ((demographics.income_100k_to_125k || 0) + (demographics.income_125k_to_150k || 0) + (demographics.income_150k_to_200k || 0) + (demographics.income_200k_plus || 0)) / income_households * 100 : null,
    
    // Poverty
    poverty_rate: demographics.poverty_total ? (demographics.poverty_below || 0) / demographics.poverty_total * 100 : null,
    
    // Housing Metrics
    homeownership_rate: occupied ? (demographics.owner_occupied_units || 0) / occupied * 100 : null,
    rental_rate: occupied ? (demographics.renter_occupied_units || 0) / occupied * 100 : null,
    vacancy_rate: total_housing ? (demographics.vacant_housing_units || 0) / total_housing * 100 : null,
    housing_cost_burden_30_percent: occupied ? (demographics.housing_cost_30_percent_plus || 0) / occupied * 100 : null,
    housing_cost_burden_50_percent: occupied ? (demographics.housing_cost_50_percent_plus || 0) / occupied * 100 : null,
    
    // Transportation
    percent_drive_alone: total_commuters ? (demographics.commute_drive_alone || 0) / total_commuters * 100 : null,
    percent_carpool: total_commuters ? (demographics.commute_carpool || 0) / total_commuters * 100 : null,
    percent_public_transit: total_commuters ? (demographics.commute_public_transit || 0) / total_commuters * 100 : null,
    percent_walk: total_commuters ? (demographics.commute_walk || 0) / total_commuters * 100 : null,
    percent_work_from_home: total_commuters ? (demographics.commute_work_from_home || 0) / total_commuters * 100 : null,
    percent_no_vehicle: vehicle_households ? (demographics.no_vehicle_households || 0) / vehicle_households * 100 : null,
    
    // Family Structure
    percent_family_households: total_households ? (demographics.family_households || 0) / total_households * 100 : null,
    percent_married_couples: total_households ? (demographics.married_couple_families || 0) / total_households * 100 : null,
    percent_single_parent: total_households ? (demographics.single_parent_families || 0) / total_households * 100 : null,
    percent_households_with_children: total_households ? (demographics.households_with_children || 0) / total_households * 100 : null,
    
    // Technology
    percent_broadband: broadband_households ? (demographics.broadband_with_subscription || 0) / broadband_households * 100 : null,
    percent_no_internet: broadband_households ? (demographics.no_internet_access || 0) / broadband_households * 100 : null,
    
    // Health/Disability
    percent_with_disability: disability_pop ? (demographics.with_disability || 0) / disability_pop * 100 : null,
    
    // Veterans
    percent_veterans: total_pop ? (demographics.total_veterans || 0) / total_pop * 100 : null
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