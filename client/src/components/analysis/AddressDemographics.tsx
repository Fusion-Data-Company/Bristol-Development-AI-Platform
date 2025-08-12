import { useState } from 'react';
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

export function AddressDemographics({ className, onLocationSelect }: AddressDemographicsProps) {
  const [address, setAddress] = useState('');
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (params: { address?: string; latitude?: number; longitude?: number }) => {
      return apiRequest('/api/address/demographics', {
        method: 'POST',
        body: JSON.stringify(params)
      });
    },
    onSuccess: (data) => {
      setLocationData(data);
      if (onLocationSelect && data.location?.coordinates) {
        onLocationSelect(data.location.coordinates[1], data.location.coordinates[0]);
      }
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
          <Card className="bg-white border-bristol-stone/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-bristol-ink font-serif">
                    {locationData.location.address}
                  </CardTitle>
                  <p className="text-bristol-stone text-sm mt-1">
                    Census Tract {locationData.location.census_tract.geoid} • {locationData.metadata.acs_year} ACS Data
                  </p>
                </div>
                <Badge variant="outline" className="border-bristol-gold text-bristol-gold">
                  Live Data
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Demographics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-bristol-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-bristol-stone flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Population
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-bristol-ink">
                  {formatValue(locationData.demographics.total_population)}
                </div>
                <div className="text-xs text-bristol-stone mt-1">
                  Median age: {formatValue(locationData.demographics.median_age)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-bristol-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-bristol-stone flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Median Income
                </CardTitle>
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

            <Card className="bg-white border-bristol-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-bristol-stone flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-bristol-ink">
                  {formatValue(locationData.demographics.percent_bachelor_plus, 'percent')}
                </div>
                <div className="text-xs text-bristol-stone mt-1">
                  Bachelor's degree or higher
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tabs */}
          <Tabs defaultValue="population" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="population">Population</TabsTrigger>
              <TabsTrigger value="economics">Economics</TabsTrigger>
              <TabsTrigger value="housing">Housing</TabsTrigger>
              <TabsTrigger value="transportation">Transportation</TabsTrigger>
            </TabsList>

            <TabsContent value="population" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader>
                    <CardTitle className="text-bristol-ink font-serif">Gender Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Male</span>
                        <span className="text-sm font-medium">
                          {formatValue(locationData.demographics.percent_male, 'percent')}
                        </span>
                      </div>
                      <Progress value={locationData.demographics.percent_male || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Female</span>
                        <span className="text-sm font-medium">
                          {formatValue(locationData.demographics.percent_female, 'percent')}
                        </span>
                      </div>
                      <Progress value={locationData.demographics.percent_female || 0} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader>
                    <CardTitle className="text-bristol-ink font-serif">Race & Ethnicity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>White</span>
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
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="economics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Employment Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.employment_rate, 'percent')}
                    </div>
                    <div className="text-xs text-bristol-stone mt-1">
                      Labor force: {formatValue(locationData.demographics.labor_force)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Unemployment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.unemployment_rate)}
                    </div>
                    <div className="text-xs text-bristol-stone mt-1">
                      People unemployed
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Poverty Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.poverty_rate)}
                    </div>
                    <div className="text-xs text-bristol-stone mt-1">
                      People in poverty
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="housing" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Homeownership Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-bristol-ink">
                      {formatValue(locationData.demographics.homeownership_rate, 'percent')}
                    </div>
                    <div className="text-xs text-bristol-stone mt-1">
                      Owner occupied units
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
                    <div className="text-xs text-bristol-stone mt-1">
                      Vacant units
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-bristol-stone/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-bristol-stone">Avg Household Size</CardTitle>
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
              </div>
            </TabsContent>

            <TabsContent value="transportation" className="space-y-4">
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-bristol-ink font-serif flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Commute Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Drive alone</span>
                      <span>{formatValue(locationData.demographics.commute_drive_alone)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Carpool</span>
                      <span>{formatValue(locationData.demographics.commute_carpool)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Public transit</span>
                      <span>{formatValue(locationData.demographics.commute_public_transit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Walk</span>
                      <span>{formatValue(locationData.demographics.commute_walk)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Work from home</span>
                      <span>{formatValue(locationData.demographics.commute_work_from_home)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Median commute time</span>
                      <span>{formatValue(locationData.demographics.median_commute_time)} min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}