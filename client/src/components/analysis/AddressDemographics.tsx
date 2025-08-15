import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { MapPin, Search, Users, DollarSign, Home, Briefcase, GraduationCap, Car, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

interface AddressDemographicsProps {
  className?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
}

interface LocationData {
  location: {
    address: string;
    coordinates: [number, number];
    census_tract: {
      state: string;
      county: string;
      tract: string;
      geoid: string;
      block: string;
    };
  };
  demographics: Record<string, number | null>;
  metadata: {
    acs_year: string;
    analysis_date: string;
    data_source: string;
  };
}

// Circuit breaker for address demographics API
let addressApiFailureCount = 0;
let lastAddressApiFailure = 0;
const ADDRESS_API_FAILURE_THRESHOLD = 5;
const ADDRESS_API_TIMEOUT = 300000; // 5 minutes
const ADDRESS_API_MAX_RETRIES = 3;

export function AddressDemographics({ className, onLocationSelect }: AddressDemographicsProps) {
  const [address, setAddress] = useState('');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const retryCountRef = useRef(0);

  const analyzeMutation = useMutation({
    mutationFn: async (params: { address?: string; latitude?: number; longitude?: number }) => {
      // Check circuit breaker
      if (addressApiFailureCount >= ADDRESS_API_FAILURE_THRESHOLD) {
        const timeSinceLastFailure = Date.now() - lastAddressApiFailure;
        if (timeSinceLastFailure < ADDRESS_API_TIMEOUT) {
          throw new Error('Address analysis temporarily disabled due to repeated failures. Please try again later.');
        } else {
          // Reset circuit breaker
          addressApiFailureCount = 0;
          console.log('Address API circuit breaker reset');
        }
      }

      const fetchWithRetry = async (retryCount = 0): Promise<any> => {
        if (retryCount >= ADDRESS_API_MAX_RETRIES) {
          throw new Error(`Address analysis failed after ${ADDRESS_API_MAX_RETRIES} attempts`);
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

          const response = await fetch('/api/address/demographics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.details || error.error || `HTTP ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          
          // Reset failure count on success
          if (addressApiFailureCount > 0) {
            console.log('Address API request succeeded - resetting failure count');
            addressApiFailureCount = 0;
          }
          
          return result;
        } catch (err: any) {
          console.error(`Address API attempt ${retryCount + 1}/${ADDRESS_API_MAX_RETRIES} failed:`, err.message);
          
          if (err.name === 'AbortError') {
            console.error('Address API request timed out');
          }
          
          if (retryCount < ADDRESS_API_MAX_RETRIES - 1) {
            // Exponential backoff
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`Retrying address API in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(retryCount + 1);
          } else {
            // Record failure for circuit breaker
            addressApiFailureCount++;
            lastAddressApiFailure = Date.now();
            console.warn(`Address API failure count: ${addressApiFailureCount}/${ADDRESS_API_FAILURE_THRESHOLD}`);
            throw err;
          }
        }
      };

      return fetchWithRetry();
    },
    onSuccess: (data: LocationData) => {
      setLocationData(data);
      retryCountRef.current = 0; // Reset retry count on success
      if (onLocationSelect && data.location?.coordinates) {
        onLocationSelect(data.location.coordinates[1], data.location.coordinates[0]);
      }
    },
    onError: (error: Error) => {
      console.error('Address demographics analysis failed:', error.message);
      // Error is already handled by the circuit breaker and retry logic
    }
  });

  const handleAddressSearch = () => {
    if (!address.trim()) return;
    analyzeMutation.mutate({ address: address.trim() });
  };

  // Expose this function for potential map integration
  const handleCoordinatesLookup = (lat: number, lng: number) => {
    analyzeMutation.mutate({ latitude: lat, longitude: lng });
  };

  const formatValue = (value: number | null, type: 'currency' | 'percent' | 'number' = 'number'): string => {
    if (value == null) return '—';
    
    switch (type) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percent':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Address Input */}
      <Card className="bg-white border-bristol-stone/20">
        <CardHeader>
          <CardTitle className="text-bristol-ink font-serif flex items-center gap-2">
            <Target className="h-5 w-5" />
            Address Demographics Lookup
          </CardTitle>
          <p className="text-bristol-stone text-sm">
            Enter any US address or click on the map to get comprehensive demographic data
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter address (e.g., 123 Main St, Nashville, TN)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleAddressSearch}
              disabled={analyzeMutation.isPending || !address.trim()}
              className="bg-bristol-maroon hover:bg-bristol-maroon/90"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Search className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
          
          {analyzeMutation.error && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {analyzeMutation.error instanceof Error ? analyzeMutation.error.message : 'Analysis failed'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {locationData && (
        <div className="space-y-6">
          {/* Location Header */}
          <Card className="bg-gradient-to-br from-cyan-100/90 via-cyan-50 to-white border-cyan-400 border-2 hover:border-cyan-500 hover:shadow-2xl hover:shadow-cyan-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-cyan-300/40">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/30 via-transparent to-cyan-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/50 via-cyan-500/50 to-cyan-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
            <div className="absolute -top-1 -left-1 w-8 h-8 bg-cyan-400/50 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-bristol-ink font-serif group-hover:text-cyan-800 transition-colors duration-300">
                    {locationData.location.address}
                  </CardTitle>
                  <p className="text-bristol-stone text-sm mt-1 group-hover:text-cyan-700 transition-colors duration-300">
                    Census Tract {locationData.location.census_tract.geoid} • {locationData.metadata.acs_year} ACS Data
                  </p>
                </div>
                <Badge variant="outline" className="border-cyan-500 text-cyan-600 group-hover:bg-cyan-100 transition-colors duration-300">
                  Live Data
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Demographics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-emerald-200/90 via-emerald-50 to-white border-emerald-400 border-2 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-emerald-300/40">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-300/30 via-transparent to-emerald-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400/50 via-emerald-500/50 to-emerald-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-emerald-400/50 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
              <CardHeader className="pb-3 relative z-10">
                <CardTitle className="text-sm font-medium text-emerald-800 group-hover:text-emerald-900 transition-colors duration-300 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Population
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-emerald-600 group-hover:text-emerald-700 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] group-hover:scale-105 transition-all duration-300">
                  {formatValue(locationData.demographics.total_population)}
                </div>
                <div className="text-xs text-emerald-700 mt-1">
                  Median age: {formatValue(locationData.demographics.median_age)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-200/90 via-amber-50 to-white border-amber-400 border-2 hover:border-amber-500 hover:shadow-2xl hover:shadow-amber-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-amber-300/40">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-300/30 via-transparent to-amber-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-400/50 via-amber-500/50 to-amber-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-amber-400/50 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
              <CardHeader className="pb-3 relative z-10">
                <CardTitle className="text-sm font-medium text-amber-800 group-hover:text-amber-900 transition-colors duration-300 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Median Income
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-amber-600 group-hover:text-amber-700 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] group-hover:scale-105 transition-all duration-300">
                  {formatValue(locationData.demographics.median_household_income, 'currency')}
                </div>
                <div className="text-xs text-amber-700 mt-1">
                  Per capita: {formatValue(locationData.demographics.per_capita_income, 'currency')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-bristol-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-bristol-stone flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Housing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-bristol-ink">
                  {formatValue(locationData.demographics.median_home_value, 'currency')}
                </div>
                <div className="text-xs text-bristol-stone mt-1">
                  Rent: {formatValue(locationData.demographics.median_gross_rent, 'currency')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-200/90 via-violet-50 to-white border-violet-400 border-2 hover:border-violet-500 hover:shadow-2xl hover:shadow-violet-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-violet-300/40">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-300/30 via-transparent to-violet-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
              <div className="absolute -inset-2 bg-gradient-to-r from-violet-400/50 via-violet-500/50 to-violet-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-violet-400/50 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
              <CardHeader className="pb-3 relative z-10">
                <CardTitle className="text-sm font-medium text-violet-800 group-hover:text-violet-900 transition-colors duration-300 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-violet-600 group-hover:text-violet-700 group-hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.8)] group-hover:scale-105 transition-all duration-300">
                  {formatValue(locationData.demographics.percent_bachelor_plus, 'percent')}
                </div>
                <div className="text-xs text-violet-700 mt-1">
                  Bachelor's degree or higher
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comprehensive Data Tabs */}
          <Tabs defaultValue="population" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="population">Population</TabsTrigger>
              <TabsTrigger value="economics">Economics</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="housing">Housing</TabsTrigger>
              <TabsTrigger value="transportation">Transportation</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
            </TabsList>

            <TabsContent value="population" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Demographics */}
                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader>
                    <CardTitle className="text-bristol-ink font-serif">Basic Demographics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Population</span>
                        <span className="font-medium">{formatValue(locationData.demographics.total_population)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Median Age</span>
                        <span className="font-medium">{formatValue(locationData.demographics.median_age)} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Male</span>
                        <span>{formatValue(locationData.demographics.percent_male, 'percent')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Female</span>
                        <span>{formatValue(locationData.demographics.percent_female, 'percent')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Age Distribution */}
                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader>
                    <CardTitle className="text-bristol-ink font-serif">Age Groups</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Under 18</span>
                        <span>{formatValue(locationData.demographics.percent_under_18, 'percent')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>18-64 (Working Age)</span>
                        <span>{formatValue(locationData.demographics.percent_18_to_64, 'percent')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>65+ (Seniors)</span>
                        <span>{formatValue(locationData.demographics.percent_65_plus, 'percent')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Race & Ethnicity */}
                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader>
                    <CardTitle className="text-bristol-ink font-serif">Race & Ethnicity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>White Alone</span>
                        <span>{formatValue(locationData.demographics.percent_white, 'percent')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Black/African American</span>
                        <span>{formatValue(locationData.demographics.percent_black, 'percent')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Asian</span>
                        <span>{formatValue(locationData.demographics.percent_asian, 'percent')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hispanic/Latino</span>
                        <span>{formatValue(locationData.demographics.percent_hispanic, 'percent')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other/Mixed Race</span>
                        <span>{formatValue(locationData.demographics.percent_other_races, 'percent')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Age Breakdown */}
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-bristol-ink font-serif">Detailed Age Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Under 5</span>
                      <span>{formatValue(locationData.demographics.age_under_5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>5-17</span>
                      <span>{formatValue(locationData.demographics.age_5_to_17)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>18-24</span>
                      <span>{formatValue(locationData.demographics.age_18_to_24)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>25-34</span>
                      <span>{formatValue(locationData.demographics.age_25_to_34)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>35-44</span>
                      <span>{formatValue(locationData.demographics.age_35_to_44)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>45-54</span>
                      <span>{formatValue(locationData.demographics.age_45_to_54)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>55-64</span>
                      <span>{formatValue(locationData.demographics.age_55_to_64)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>65-74</span>
                      <span>{formatValue(locationData.demographics.age_65_to_74)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>75+</span>
                      <span>{formatValue(locationData.demographics.age_75_plus)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="economics" className="space-y-4">
              {/* Income Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Median Household Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.median_household_income, 'currency')}
                    </div>
                    <div className="text-xs text-bristol-stone mt-1">
                      Per capita: {formatValue(locationData.demographics.per_capita_income, 'currency')}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-200/90 via-green-50 to-white border-green-400 border-2 hover:border-green-500 hover:shadow-2xl hover:shadow-green-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-green-300/40">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-300/30 via-transparent to-green-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-green-400/50 via-green-500/50 to-green-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                  <div className="absolute -top-1 -left-1 w-8 h-8 bg-green-400/50 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
                  <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-sm font-medium text-green-800 group-hover:text-green-900 transition-colors duration-300">Employment Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold text-green-600 group-hover:text-green-700 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] group-hover:scale-105 transition-all duration-300">
                      {formatValue(locationData.demographics.employment_rate, 'percent')}
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      Of labor force
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-200/90 via-orange-50 to-white border-orange-400 border-2 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-orange-300/40">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-300/30 via-transparent to-orange-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/50 via-orange-500/50 to-orange-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-400/50 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
                  <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-sm font-medium text-orange-800 group-hover:text-orange-900 transition-colors duration-300">Unemployment Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold text-orange-600 group-hover:text-orange-700 group-hover:drop-shadow-[0_0_8px_rgba(251,146,60,0.8)] group-hover:scale-105 transition-all duration-300">
                      {formatValue(locationData.demographics.unemployment_rate, 'percent')}
                    </div>
                    <div className="text-xs text-orange-700 mt-1">
                      Unemployed: {formatValue(locationData.demographics.unemployed)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-200/90 via-red-50 to-white border-red-400 border-2 hover:border-red-500 hover:shadow-2xl hover:shadow-red-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-red-300/40">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-300/30 via-transparent to-red-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-red-400/50 via-red-500/50 to-red-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-red-400/40 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
                  <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-sm font-medium text-red-800 group-hover:text-red-900 transition-colors duration-300">Poverty Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold text-red-600 group-hover:text-red-700 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] group-hover:scale-105 transition-all duration-300">
                      {formatValue(locationData.demographics.poverty_rate, 'percent')}
                    </div>
                    <div className="text-xs text-red-700 mt-1">
                      Below poverty line
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Income Distribution */}
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-bristol-ink font-serif">Household Income Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Under $25k</span>
                        <span className="font-medium">{formatValue(locationData.demographics.percent_income_under_25k, 'percent')}</span>
                      </div>
                      <Progress value={locationData.demographics.percent_income_under_25k || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>$25k - $50k</span>
                        <span className="font-medium">{formatValue(locationData.demographics.percent_income_25k_to_50k, 'percent')}</span>
                      </div>
                      <Progress value={locationData.demographics.percent_income_25k_to_50k || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>$50k - $100k</span>
                        <span className="font-medium">{formatValue(locationData.demographics.percent_income_50k_to_100k, 'percent')}</span>
                      </div>
                      <Progress value={locationData.demographics.percent_income_50k_to_100k || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>$100k+</span>
                        <span className="font-medium">{formatValue(locationData.demographics.percent_income_100k_plus, 'percent')}</span>
                      </div>
                      <Progress value={locationData.demographics.percent_income_100k_plus || 0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Income Brackets */}
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-bristol-ink font-serif">Detailed Income Brackets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Under $10k</span>
                        <span>{formatValue(locationData.demographics.income_under_10k)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>$10k - $15k</span>
                        <span>{formatValue(locationData.demographics.income_10k_to_15k)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>$15k - $20k</span>
                        <span>{formatValue(locationData.demographics.income_15k_to_20k)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>$20k - $25k</span>
                        <span>{formatValue(locationData.demographics.income_20k_to_25k)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>$25k - $30k</span>
                        <span>{formatValue(locationData.demographics.income_25k_to_30k)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>$30k - $35k</span>
                        <span>{formatValue(locationData.demographics.income_30k_to_35k)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>$35k - $40k</span>
                        <span>{formatValue(locationData.demographics.income_35k_to_40k)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>$40k - $45k</span>
                        <span>{formatValue(locationData.demographics.income_40k_to_45k)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>$45k - $50k</span>
                        <span>{formatValue(locationData.demographics.income_45k_to_50k)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>$50k - $60k</span>
                        <span>{formatValue(locationData.demographics.income_50k_to_60k)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>$60k - $75k</span>
                        <span>{formatValue(locationData.demographics.income_60k_to_75k)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>$75k - $100k</span>
                        <span>{formatValue(locationData.demographics.income_75k_to_100k)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>$100k - $125k</span>
                        <span>{formatValue(locationData.demographics.income_100k_to_125k)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>$125k - $150k</span>
                        <span>{formatValue(locationData.demographics.income_125k_to_150k)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>$150k - $200k</span>
                        <span>{formatValue(locationData.demographics.income_150k_to_200k)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>$200k+</span>
                        <span>{formatValue(locationData.demographics.income_200k_plus)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Economic Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Mean Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.mean_household_income, 'currency')}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Gini Index</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.gini_index)}
                    </div>
                    <div className="text-xs text-bristol-stone mt-1">
                      Income inequality measure
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Labor Force Participation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.labor_force_participation, 'percent')}
                    </div>
                    <div className="text-xs text-bristol-stone mt-1">
                      Labor force: {formatValue(locationData.demographics.labor_force)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="education" className="space-y-4">
              {/* Education Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Less than High School</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.percent_less_than_high_school, 'percent')}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">High School Graduate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.percent_high_school, 'percent')}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Some College/Associates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.percent_some_college, 'percent')}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Bachelor's or Higher</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.percent_bachelors_plus, 'percent')}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Education Breakdown */}
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-bristol-ink font-serif">Detailed Educational Attainment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Less than 9th grade</span>
                        <span>{formatValue(locationData.demographics.less_than_9th_grade)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>9th to 12th grade</span>
                        <span>{formatValue(locationData.demographics.grade_9_to_12)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>High school graduate</span>
                        <span>{formatValue(locationData.demographics.high_school_graduate)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Some college</span>
                        <span>{formatValue(locationData.demographics.some_college)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Associate's degree</span>
                        <span>{formatValue(locationData.demographics.associates_degree)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bachelor's degree</span>
                        <span>{formatValue(locationData.demographics.bachelors_degree)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Master's degree</span>
                        <span>{formatValue(locationData.demographics.masters_degree)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Professional degree</span>
                        <span>{formatValue(locationData.demographics.professional_degree)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Doctorate degree</span>
                        <span>{formatValue(locationData.demographics.doctorate_degree)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Graduate Education Focus */}
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-bristol-ink font-serif">Advanced Education</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Graduate Degree or Higher</span>
                        <span className="font-medium">{formatValue(locationData.demographics.percent_graduate_degree, 'percent')}</span>
                      </div>
                      <Progress value={locationData.demographics.percent_graduate_degree || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Bachelor's Degree or Higher</span>
                        <span className="font-medium">{formatValue(locationData.demographics.percent_bachelors_plus, 'percent')}</span>
                      </div>
                      <Progress value={locationData.demographics.percent_bachelors_plus || 0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="housing" className="space-y-4">
              {/* Housing Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Median Home Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.median_home_value, 'currency')}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Median Gross Rent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.median_gross_rent, 'currency')}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Homeownership Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.homeownership_rate, 'percent')}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Vacancy Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.vacancy_rate, 'percent')}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Housing Stock */}
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-bristol-ink font-serif">Housing Stock & Occupancy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Housing Units</span>
                        <span className="font-medium">{formatValue(locationData.demographics.total_housing_units)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Occupied Units</span>
                        <span>{formatValue(locationData.demographics.occupied_housing_units)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Owner Occupied</span>
                        <span>{formatValue(locationData.demographics.owner_occupied_units)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Renter Occupied</span>
                        <span>{formatValue(locationData.demographics.renter_occupied_units)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Vacant Units</span>
                        <span>{formatValue(locationData.demographics.vacant_housing_units)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Median Rooms</span>
                        <span>{formatValue(locationData.demographics.median_rooms)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Rental Rate</span>
                        <span>{formatValue(locationData.demographics.rental_rate, 'percent')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rent Distribution */}
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-bristol-ink font-serif">Rent Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Under $500</span>
                        <span>{formatValue(locationData.demographics.rent_under_500)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>$500-$999</span>
                        <span>{formatValue(locationData.demographics.rent_500_to_999)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>$1,000-$1,499</span>
                        <span>{formatValue(locationData.demographics.rent_1000_to_1499)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>$1,500-$1,999</span>
                        <span>{formatValue(locationData.demographics.rent_1500_to_1999)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>$2,000+</span>
                        <span>{formatValue(locationData.demographics.rent_2000_plus)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Housing Cost Burden */}
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-bristol-ink font-serif">Housing Cost Burden</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Pay 30%+ of Income on Housing</span>
                        <span className="font-medium">{formatValue(locationData.demographics.housing_cost_burden_30_percent, 'percent')}</span>
                      </div>
                      <Progress value={locationData.demographics.housing_cost_burden_30_percent || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Pay 50%+ of Income on Housing</span>
                        <span className="font-medium">{formatValue(locationData.demographics.housing_cost_burden_50_percent, 'percent')}</span>
                      </div>
                      <Progress value={locationData.demographics.housing_cost_burden_50_percent || 0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Household Size */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Average Household Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.average_household_size)}
                    </div>
                    <div className="text-xs text-bristol-stone mt-1">
                      People per household
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Average Family Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.average_family_size)}
                    </div>
                    <div className="text-xs text-bristol-stone mt-1">
                      People per family
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transportation" className="space-y-4">
              {/* Commute Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-200/90 via-blue-50 to-white border-blue-400 border-2 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-blue-300/40">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-300/30 via-transparent to-blue-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/50 via-blue-500/50 to-blue-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                  <div className="absolute -top-1 -left-1 w-8 h-8 bg-blue-400/50 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
                  <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-sm font-medium text-blue-800 group-hover:text-blue-900 transition-colors duration-300">Total Commuters</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold text-blue-600 group-hover:text-blue-700 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] group-hover:scale-105 transition-all duration-300">
                      {formatValue(locationData.demographics.total_commuters)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-200/90 via-purple-50 to-white border-purple-400 border-2 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-purple-300/40">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-300/30 via-transparent to-purple-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-400/50 via-purple-500/50 to-purple-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-400/50 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
                  <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-sm font-medium text-purple-800 group-hover:text-purple-900 transition-colors duration-300">Median Commute Time</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold text-purple-600 group-hover:text-purple-700 group-hover:drop-shadow-[0_0_8px_rgba(147,51,234,0.8)] group-hover:scale-105 transition-all duration-300">
                      {formatValue(locationData.demographics.median_commute_time)} min
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-200/90 via-indigo-50 to-white border-indigo-400 border-2 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-indigo-300/40">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-300/30 via-transparent to-indigo-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-indigo-400/50 via-indigo-500/50 to-indigo-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-indigo-400/50 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
                  <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-sm font-medium text-indigo-800 group-hover:text-indigo-900 transition-colors duration-300">Work From Home</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold text-indigo-600 group-hover:text-indigo-700 group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] group-hover:scale-105 transition-all duration-300">
                      {formatValue(locationData.demographics.percent_work_from_home, 'percent')}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Commute Methods */}
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-bristol-ink font-serif flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Transportation Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Drive Alone</span>
                        <span className="font-medium">{formatValue(locationData.demographics.percent_drive_alone, 'percent')}</span>
                      </div>
                      <Progress value={locationData.demographics.percent_drive_alone || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Carpool</span>
                        <span className="font-medium">{formatValue(locationData.demographics.percent_carpool, 'percent')}</span>
                      </div>
                      <Progress value={locationData.demographics.percent_carpool || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Public Transit</span>
                        <span className="font-medium">{formatValue(locationData.demographics.percent_public_transit, 'percent')}</span>
                      </div>
                      <Progress value={locationData.demographics.percent_public_transit || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Walk</span>
                        <span className="font-medium">{formatValue(locationData.demographics.percent_walk, 'percent')}</span>
                      </div>
                      <Progress value={locationData.demographics.percent_walk || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Bicycle</span>
                        <span className="font-medium">{formatValue(locationData.demographics.commute_bicycle)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Other</span>
                        <span className="font-medium">{formatValue(locationData.demographics.commute_other)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Access */}
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-bristol-ink font-serif">Vehicle Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Households with No Vehicle</span>
                        <span className="font-medium">{formatValue(locationData.demographics.percent_no_vehicle, 'percent')}</span>
                      </div>
                      <Progress value={locationData.demographics.percent_no_vehicle || 0} className="h-2" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>No Vehicle Households</span>
                        <span>{formatValue(locationData.demographics.no_vehicle_households)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Vehicle Households</span>
                        <span>{formatValue(locationData.demographics.total_vehicle_households)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Commute Numbers */}
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-bristol-ink font-serif">Detailed Commute Numbers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Drive alone</span>
                        <span>{formatValue(locationData.demographics.commute_drive_alone)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Carpool</span>
                        <span>{formatValue(locationData.demographics.commute_carpool)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Public transit</span>
                        <span>{formatValue(locationData.demographics.commute_public_transit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Walk</span>
                        <span>{formatValue(locationData.demographics.commute_walk)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Bicycle</span>
                        <span>{formatValue(locationData.demographics.commute_bicycle)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Work from home</span>
                        <span>{formatValue(locationData.demographics.commute_work_from_home)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Other means</span>
                        <span>{formatValue(locationData.demographics.commute_other)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              {/* Household & Family Structure */}
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-bristol-ink font-serif">Household & Family Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Households</span>
                        <span className="font-medium">{formatValue(locationData.demographics.total_households)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Family Households</span>
                        <span>{formatValue(locationData.demographics.percent_family_households, 'percent')}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Married Couples</span>
                        <span>{formatValue(locationData.demographics.percent_married_couples, 'percent')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Single Parent Families</span>
                        <span>{formatValue(locationData.demographics.percent_single_parent, 'percent')}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Households with Children</span>
                        <span>{formatValue(locationData.demographics.percent_households_with_children, 'percent')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Non-family Households</span>
                        <span>{formatValue(locationData.demographics.nonfamily_households)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technology & Internet */}
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-bristol-ink font-serif">Technology & Internet Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Broadband Subscription</span>
                        <span className="font-medium">{formatValue(locationData.demographics.percent_broadband, 'percent')}</span>
                      </div>
                      <Progress value={locationData.demographics.percent_broadband || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>No Internet Access</span>
                        <span className="font-medium">{formatValue(locationData.demographics.percent_no_internet, 'percent')}</span>
                      </div>
                      <Progress value={locationData.demographics.percent_no_internet || 0} className="h-2" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Broadband Households</span>
                        <span>{formatValue(locationData.demographics.broadband_with_subscription)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>No Internet Households</span>
                        <span>{formatValue(locationData.demographics.no_internet_access)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Veterans & Disability */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader>
                    <CardTitle className="text-bristol-ink font-serif">Veterans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Veterans</span>
                        <span className="font-medium">{formatValue(locationData.demographics.total_veterans)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Veteran Percentage</span>
                        <span>{formatValue(locationData.demographics.percent_veterans, 'percent')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader>
                    <CardTitle className="text-bristol-ink font-serif">Disability Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>With Disability</span>
                        <span className="font-medium">{formatValue(locationData.demographics.with_disability)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Disability Rate</span>
                        <span>{formatValue(locationData.demographics.percent_with_disability, 'percent')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}