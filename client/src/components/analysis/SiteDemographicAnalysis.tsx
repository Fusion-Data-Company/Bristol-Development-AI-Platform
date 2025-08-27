import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Users, DollarSign, Home, TrendingUp, MapPin, Briefcase, GraduationCap, Clock, Car, Baby, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SiteDemographicAnalysisProps {
  siteId: string;
  siteName?: string;
  className?: string;
}

interface DemographicData {
  site: {
    id: string;
    name: string;
    coordinates: [number, number];
    fips: {
      state: string;
      county: string;
      tract: string;
      geoid: string;
    };
    demographics: Record<string, number>;
  };
  area: {
    averages: Record<string, number>;
    surrounding_tracts: Array<Record<string, any>>;
    tract_count: number;
  };
  metadata: {
    acs_year: string;
    analysis_date: string;
    variables_analyzed: number;
  };
}

export function SiteDemographicAnalysis({ siteId, siteName, className }: SiteDemographicAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data, isLoading, refetch, error } = useQuery<DemographicData>({
    queryKey: ['site-demographics', siteId],
    queryFn: async () => {
      const response = await fetch(`/api/sites/${siteId}/demographics`);
      if (!response.ok) throw new Error('Failed to fetch demographic analysis');
      return response.json();
    },
    enabled: !!siteId
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await refetch();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatNumber = (value: number | null | undefined, type: 'currency' | 'percent' | 'number' = 'number'): string => {
    if (value == null || isNaN(value)) return '—';
    
    switch (type) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percent':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  const calculateComparison = (siteValue: number, areaAverage: number): { percent: number; status: 'higher' | 'lower' | 'similar' } => {
    if (!siteValue || !areaAverage) return { percent: 0, status: 'similar' };
    
    const percent = ((siteValue - areaAverage) / areaAverage) * 100;
    const absPercent = Math.abs(percent);
    
    if (absPercent < 5) return { percent: absPercent, status: 'similar' };
    return { percent: absPercent, status: percent > 0 ? 'higher' : 'lower' };
  };

  if (error) {
    return (
      <Card className={cn("bg-white border-brand-stone/20", className)}>
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">
            Failed to load demographic analysis
          </div>
          <Button onClick={handleAnalyze} variant="outline">
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !data) {
    return (
      <Card className={cn("bg-white border-brand-stone/20", className)}>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-maroon mx-auto mb-4"></div>
          <p className="text-brand-stone">Loading demographic analysis...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={cn("bg-white border-brand-stone/20", className)}>
        <CardHeader>
          <CardTitle className="text-brand-ink font-serif">
            Site Demographics
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-brand-stone mb-4">
            Click analyze to get detailed demographic insights for this site and surrounding area
          </p>
          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-brand-maroon hover:bg-brand-maroon/90"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Analyze Demographics
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { site, area, metadata } = data;
  const demo = site.demographics;
  const avg = area.averages;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card className="bg-white border-brand-stone/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-brand-ink font-serif">
                {siteName || site.name} Demographics
              </CardTitle>
              <p className="text-brand-stone text-sm mt-1">
                Census Tract {site.fips.geoid} • ACS {metadata.acs_year} • {area.tract_count} tracts analyzed
              </p>
            </div>
            <Button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              variant="outline"
              size="sm"
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="economics">Economics</TabsTrigger>
          <TabsTrigger value="housing">Housing</TabsTrigger>
          <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Population */}
            <Card className="bg-white border-brand-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-brand-stone flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Population
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-ink">
                  {formatNumber(demo.total_population)}
                </div>
                <div className="text-xs text-brand-stone mt-1">
                  Area avg: {formatNumber(avg.total_population)}
                </div>
              </CardContent>
            </Card>

            {/* Median Age */}
            <Card className="bg-white border-brand-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-brand-stone flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Median Age
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-ink">
                  {formatNumber(demo.median_age)}
                </div>
                <div className="text-xs text-brand-stone mt-1">
                  Area avg: {formatNumber(avg.median_age)}
                </div>
              </CardContent>
            </Card>

            {/* Education */}
            <Card className="bg-white border-brand-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-brand-stone flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Bachelor's+
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-ink">
                  {formatNumber((demo.bachelor_degree_or_higher / demo.total_population) * 100, 'percent')}
                </div>
                <div className="text-xs text-brand-stone mt-1">
                  Area avg: {formatNumber((avg.bachelor_degree_or_higher / avg.total_population) * 100, 'percent')}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Demographics Breakdown */}
          <Card className="bg-white border-brand-stone/20">
            <CardHeader>
              <CardTitle className="text-brand-ink font-serif">Population Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-brand-stone">Male</span>
                    <span className="text-sm font-medium">
                      {formatNumber((demo.male_population / demo.total_population) * 100, 'percent')}
                    </span>
                  </div>
                  <Progress value={(demo.male_population / demo.total_population) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-brand-stone">Female</span>
                    <span className="text-sm font-medium">
                      {formatNumber((demo.female_population / demo.total_population) * 100, 'percent')}
                    </span>
                  </div>
                  <Progress value={(demo.female_population / demo.total_population) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="economics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Median Household Income */}
            <Card className="bg-white border-brand-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-brand-stone flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Median Household Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-ink">
                  {formatNumber(demo.median_household_income, 'currency')}
                </div>
                <div className="text-xs text-brand-stone mt-1">
                  Area avg: {formatNumber(avg.median_household_income, 'currency')}
                </div>
                {(() => {
                  const comp = calculateComparison(demo.median_household_income, avg.median_household_income);
                  return (
                    <Badge 
                      variant={comp.status === 'higher' ? 'default' : comp.status === 'lower' ? 'destructive' : 'secondary'}
                      className="mt-2"
                    >
                      {comp.percent.toFixed(1)}% {comp.status === 'similar' ? 'similar' : comp.status}
                    </Badge>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Per Capita Income */}
            <Card className="bg-white border-brand-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-brand-stone flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Per Capita Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-ink">
                  {formatNumber(demo.per_capita_income, 'currency')}
                </div>
                <div className="text-xs text-brand-stone mt-1">
                  Area avg: {formatNumber(avg.per_capita_income, 'currency')}
                </div>
              </CardContent>
            </Card>

            {/* Employment */}
            <Card className="bg-white border-brand-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-brand-stone flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Employment Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-ink">
                  {formatNumber(((demo.labor_force - demo.unemployment_rate) / demo.labor_force) * 100, 'percent')}
                </div>
                <div className="text-xs text-brand-stone mt-1">
                  Labor force: {formatNumber(demo.labor_force)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="housing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Median Home Value */}
            <Card className="bg-white border-brand-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-brand-stone flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Median Home Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-ink">
                  {formatNumber(demo.median_home_value, 'currency')}
                </div>
                <div className="text-xs text-brand-stone mt-1">
                  Area avg: {formatNumber(avg.median_home_value, 'currency')}
                </div>
              </CardContent>
            </Card>

            {/* Median Rent */}
            <Card className="bg-white border-brand-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-brand-stone flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Median Gross Rent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-ink">
                  {formatNumber(demo.median_gross_rent, 'currency')}
                </div>
                <div className="text-xs text-brand-stone mt-1">
                  Area avg: {formatNumber(avg.median_gross_rent, 'currency')}
                </div>
              </CardContent>
            </Card>

            {/* Homeownership Rate */}
            <Card className="bg-white border-brand-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-brand-stone flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Homeownership Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-ink">
                  {formatNumber((demo.owner_occupied_units / (demo.owner_occupied_units + demo.renter_occupied_units)) * 100, 'percent')}
                </div>
                <div className="text-xs text-brand-stone mt-1">
                  {formatNumber(demo.owner_occupied_units)} owned, {formatNumber(demo.renter_occupied_units)} rented
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lifestyle" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Commute Times */}
            <Card className="bg-white border-brand-stone/20">
              <CardHeader>
                <CardTitle className="text-brand-ink font-serif flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Commute Times
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Less than 15 min</span>
                    <span>{formatNumber((demo.commute_less_than_15_min / demo.labor_force) * 100, 'percent')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>15-29 min</span>
                    <span>{formatNumber((demo.commute_15_to_29_min / demo.labor_force) * 100, 'percent')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>30-44 min</span>
                    <span>{formatNumber((demo.commute_30_to_44_min / demo.labor_force) * 100, 'percent')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>45+ min</span>
                    <span>{formatNumber((demo.commute_45_plus_min / demo.labor_force) * 100, 'percent')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Family Structure */}
            <Card className="bg-white border-brand-stone/20">
              <CardHeader>
                <CardTitle className="text-brand-ink font-serif flex items-center gap-2">
                  <Baby className="h-4 w-4" />
                  Family Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Married Couples</span>
                    <span>{formatNumber(demo.married_couple_families)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Single Parent</span>
                    <span>{formatNumber(demo.single_parent_families)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>With Children</span>
                    <span>{formatNumber(demo.households_with_children)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}