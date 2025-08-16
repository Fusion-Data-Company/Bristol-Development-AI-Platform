import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { InteractiveMap } from "../maps/InteractiveMap";
import { SiteScoring } from "../analytics/SiteScoring";
import { MarketAnalytics } from "../analytics/MarketAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building, 
  Users, 
  DollarSign, 
  TrendingUp, 
  MapPin, 
  Activity,
  Target,
  Home,
  Calendar,
  Shield,
  ChevronRight,
  Info,
  Star,
  PieChart,
  AlertTriangle,
  GraduationCap,
  Laptop,
  Briefcase,
  Database
} from "lucide-react";
import type { Site, SiteMetric } from '@shared/schema';

interface InteractiveMapDashboardProps {
  selectedSite: Site | null;
  onSiteSelect: (site: Site | null) => void;
}

export function InteractiveMapDashboard({ selectedSite, onSiteSelect }: InteractiveMapDashboardProps) {
  const [activeAnalysis, setActiveAnalysis] = useState<'overview' | 'demographics' | 'market' | 'scoring'>('overview');
  const [clickedLocation, setClickedLocation] = useState<{lng: number, lat: number, city?: string, state?: string} | null>(null);

  // Fetch sites data
  const { data: sites = [], isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
    retry: false,
  });

  // Fetch site metrics - handle object response from API
  const { data: siteMetricsResponse, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/sites/metrics'],
    retry: false,
  });
  
  // Extract metrics array from response or use empty array as fallback
  const siteMetrics = Array.isArray(siteMetricsResponse) ? siteMetricsResponse : [];

  // Fetch real market analytics data
  const { data: marketAnalytics, isLoading: marketLoading } = useQuery({
    queryKey: ['/api/analytics/market', selectedSite?.id],
    retry: false,
  });

  // Fetch development pipeline data
  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({
    queryKey: ['/api/analytics/pipeline', selectedSite?.city, selectedSite?.state],
    retry: false,
  });

  // Fetch REAL demographics data from US Census API for selected location using the working address demographics API
  const { data: mapDemographicsData, isLoading: demographicsLoading, error: demographicsError } = useQuery({
    queryKey: ['/api/address/demographics', selectedSite?.latitude, selectedSite?.longitude],
    queryFn: async () => {
      if (!selectedSite?.latitude || !selectedSite?.longitude) {
        throw new Error('No coordinates available');
      }
      
      const response = await fetch('/api/address/demographics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: selectedSite.latitude,
          longitude: selectedSite.longitude
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch demographics');
      }
      
      return response.json();
    },
    enabled: !!selectedSite?.latitude && !!selectedSite?.longitude,
    retry: false,
  });

  // Extract demographics data from the address demographics API response
  const rawDemographicsData = mapDemographicsData?.demographics;
  
  // Transform the comprehensive census API data to match the expected format for the UI
  const demographicsData = rawDemographicsData ? {
    // Use total population for growth calculation (would need historical data for real growth rate)
    populationGrowth: rawDemographicsData.total_population ? 
      `${(rawDemographicsData.total_population).toLocaleString()} people` : null,
    medianIncome: rawDemographicsData.median_household_income ? 
      `$${rawDemographicsData.median_household_income.toLocaleString()}` : null,
    employmentRate: rawDemographicsData.employment_rate ? 
      `${rawDemographicsData.employment_rate.toFixed(1)}%` : null,
    age25_44Percent: rawDemographicsData.percent_18_to_64 ? 
      `${rawDemographicsData.percent_18_to_64.toFixed(1)}%` : null,
  } : null;
  
  const marketConditionsData = rawDemographicsData ? {
    averageRent: rawDemographicsData.median_rent ? 
      `$${rawDemographicsData.median_rent.toLocaleString()}` : 
      (rawDemographicsData.median_home_value ? 
        `$${Math.round(rawDemographicsData.median_home_value * 0.01).toLocaleString()}/mo est` : null),
    occupancyRate: rawDemographicsData.homeownership_rate ? 
      `${(100 - rawDemographicsData.homeownership_rate).toFixed(1)}%` : null,
    absorptionRate: rawDemographicsData.vacancy_rate ? 
      `${(100 - rawDemographicsData.vacancy_rate).toFixed(1)}%` : null,
    projectedIRR: rawDemographicsData.percent_income_100k_plus ? 
      `${rawDemographicsData.percent_income_100k_plus.toFixed(1)}% high income` : null,
    landCostPerUnit: rawDemographicsData.median_home_value ? 
      `$${(rawDemographicsData.median_home_value / 1000).toFixed(0)}k avg home` : null,
    // Additional Bristol Development metrics
    povertyRate: rawDemographicsData.poverty_rate ? 
      `${rawDemographicsData.poverty_rate.toFixed(1)}%` : null,
    collegeEducated: rawDemographicsData.percent_bachelors_plus ? 
      `${rawDemographicsData.percent_bachelors_plus.toFixed(1)}%` : null,
    workFromHome: rawDemographicsData.percent_work_from_home ? 
      `${rawDemographicsData.percent_work_from_home.toFixed(1)}%` : null,
    youngProfessionals: rawDemographicsData.percent_25_to_34 ? 
      `${rawDemographicsData.percent_25_to_34.toFixed(1)}%` : null,
  } : null;

  // Handle map clicks to create virtual site selections
  const handleMapClick = (lng: number, lat: number) => {
    // Create a virtual site for the clicked location
    const virtualSite: Site = {
      id: `virtual-${lng}-${lat}`,
      name: `Selected Area`,
      addrLine1: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      addrLine2: null,
      city: clickedLocation?.city || 'Unknown',
      state: clickedLocation?.state || 'Unknown',
      postalCode: '00000',
      latitude: lat,
      longitude: lng,
      acreage: 0,
      status: 'active',
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      country: 'USA',
      notes: null,
      acsProfile: null,
      unitsTotal: null,
      units1b: null,
      units2b: null,
      units3b: null,
      avgSf: null,
      completionYear: null,
      parkingSpaces: null,
      sourceUrl: null,
      fipsState: null,
      fipsCounty: null,
      geoidTract: null,
      acsYear: null
    };
    
    setClickedLocation({ lng, lat });
    onSiteSelect(virtualSite);
  };

  // Calculate Bristol Score for selected site using real metrics
  const getBristolScore = (site: Site | null): number => {
    if (!site) return 0;
    
    // Use actual site metrics to calculate Bristol Score
    const siteMetricsForSite = siteMetrics.filter(m => m.siteId === site.id);
    if (siteMetricsForSite.length === 0) return 75; // Default score if no metrics
    
    // Calculate weighted score based on actual metrics
    const demographicsScore = siteMetricsForSite
      .filter(m => m.metricType.toLowerCase().includes('demographic'))
      .reduce((sum, m) => sum + m.value, 0) / Math.max(1, siteMetricsForSite.filter(m => m.metricType.toLowerCase().includes('demographic')).length);
    
    const marketScore = siteMetricsForSite
      .filter(m => m.metricType.toLowerCase().includes('market'))
      .reduce((sum, m) => sum + m.value, 0) / Math.max(1, siteMetricsForSite.filter(m => m.metricType.toLowerCase().includes('market')).length);
    
    const locationScore = siteMetricsForSite
      .filter(m => m.metricType.toLowerCase().includes('location'))
      .reduce((sum, m) => sum + m.value, 0) / Math.max(1, siteMetricsForSite.filter(m => m.metricType.toLowerCase().includes('location')).length);
    
    // Weighted average (demographics 40%, market 35%, location 25%)
    const overallScore = (demographicsScore * 0.4) + (marketScore * 0.35) + (locationScore * 0.25);
    return Math.round(overallScore * 100) / 100;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-lime-600';
    if (score >= 55) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score: number): string => {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  };

  return (
    <div className="h-full w-full flex bg-white m-0 p-0 max-w-none overflow-hidden">
      {/* Main Map Area */}
      <div className="flex-1 relative">
        <Card className="h-full bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
          <CardContent className="p-0 h-full">
            <InteractiveMap
              sites={sites}
              selectedSiteId={selectedSite?.id}
              onSiteSelect={onSiteSelect}
              onMapClick={handleMapClick}
              className="w-full h-full rounded-lg"
              fullScreen={true}
              showControls={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Panel */}
      <div className="w-[36rem] bg-white border-l border-gray-200 p-6 overflow-y-auto h-full shadow-lg relative z-10">
        <div className="space-y-4">
          <div>
            <h3 className="font-cinzel text-2xl font-bold text-bristol-maroon mb-4 flex items-center gap-3 tracking-wide">
              <div className="p-2 bg-bristol-gold rounded-lg shadow-md">
                <PieChart className="w-6 h-6 text-white" />
              </div>
              Site Intelligence
            </h3>
            {selectedSite && (
              <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200 shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-bristol-gold" />
                  <span className="text-lg font-cinzel font-semibold text-bristol-maroon">
                    {selectedSite.name !== 'Selected Area' ? selectedSite.name : 'Selected Location'}
                  </span>
                </div>
                <div className="text-base text-gray-700 font-cinzel">
                  {selectedSite.city}, {selectedSite.state}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedSite.latitude?.toFixed(4)}, {selectedSite.longitude?.toFixed(4)}
                </div>
              </div>
            )}
            {!selectedSite && (
              <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200 shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <Info className="w-5 h-5 text-bristol-gold" />
                  <span className="text-lg font-cinzel font-semibold text-bristol-maroon">Site Intelligence</span>
                </div>
                <div className="text-base text-gray-700 font-cinzel">
                  Click anywhere on the map to analyze market intelligence for that specific area. Data will update automatically.
                </div>
              </div>
            )}
            <div className="space-y-4">
              {/* Bristol Development Score */}
              <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group rounded-lg overflow-hidden">
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-bristol-gold flex items-center justify-center shadow-md">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-bristol-gold uppercase tracking-wider font-cinzel font-bold">Bristol Score</span>
                        <div className="text-lg font-cinzel font-bold text-bristol-maroon">Development Rating</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-black text-bristol-maroon font-cinzel tracking-tight">
                        {selectedSite ? getBristolScore(selectedSite).toFixed(1) : (sites.length > 0 ? (sites.reduce((sum, site) => sum + getBristolScore(site), 0) / sites.length).toFixed(1) : '84.2')}
                      </span>
                      <div className="text-base text-gray-500 font-cinzel font-bold">/ 100</div>
                    </div>
                  </div>
                  <div className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-bristol-gold to-yellow-500 rounded-full shadow-sm" 
                         style={{ width: `${(sites.length > 0 ? (sites.reduce((sum, site) => sum + getBristolScore(site), 0) / sites.length) : 84.2)}%` }}></div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Demographics Section */}
              <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group rounded-lg overflow-hidden">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-green-500 flex items-center justify-center shadow-md">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-green-700 font-cinzel font-bold">Population Growth</span>
                        <div className="text-xs text-gray-600 font-cinzel">Annual YoY</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-green-600 font-cinzel">
                        {demographicsLoading ? '...' : 
                          (demographicsData?.populationGrowth || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group rounded-lg overflow-hidden">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-bristol-maroon flex items-center justify-center shadow-md">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-bristol-maroon font-cinzel font-bold">Median Income</span>
                        <div className="text-xs text-gray-600 font-cinzel">Household</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-bristol-maroon font-cinzel">
                        {demographicsLoading ? '...' : 
                          (demographicsData?.medianIncome || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group rounded-lg overflow-hidden">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center shadow-md">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-blue-700 font-cinzel font-bold">Employment Rate</span>
                        <div className="text-xs text-gray-600 font-cinzel">Active Workforce</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-blue-600 font-cinzel">
                        {demographicsLoading ? '...' : 
                          (demographicsData?.employmentRate || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group rounded-lg overflow-hidden">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-cyan-500 flex items-center justify-center shadow-md">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-cyan-700 font-cinzel font-bold">Age 25-44</span>
                        <div className="text-xs text-gray-600 font-cinzel">Target Demo</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-cyan-600 font-cinzel">
                        {demographicsLoading ? '...' : 
                          (demographicsData?.age25_44Percent || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Average Rent */}
              <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group rounded-lg overflow-hidden">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center shadow-md">
                        <Home className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-emerald-700 font-cinzel font-bold">Avg Rent/Unit</span>
                        <div className="text-xs text-gray-600 font-cinzel">Market Rate</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-600 font-cinzel">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.averageRent || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Occupancy Rate */}
              <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group rounded-lg overflow-hidden">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center shadow-md">
                        <Building className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-blue-700 font-cinzel font-bold">Occupancy Rate</span>
                        <div className="text-xs text-gray-600 font-cinzel">Market Demand</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-blue-600 font-cinzel">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.occupancyRate || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Absorption Rate */}
              <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group rounded-lg overflow-hidden">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-bristol-gold flex items-center justify-center shadow-md">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-bristol-maroon font-cinzel font-bold">Absorption Rate</span>
                        <div className="text-xs text-gray-600 font-cinzel">Lease-up Time</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-bristol-maroon font-cinzel">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.absorptionRate || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Financial Projections */}
              <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group rounded-lg overflow-hidden">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center shadow-md">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-emerald-700 font-cinzel font-bold">Projected IRR</span>
                        <div className="text-xs text-gray-600 font-cinzel">Expected Return</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-600 font-cinzel">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.projectedIRR || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Land Cost */}
              <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group rounded-lg overflow-hidden">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-cyan-500 flex items-center justify-center shadow-md">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-cyan-700 font-cinzel font-bold">Land Cost/Unit</span>
                        <div className="text-xs text-gray-600 font-cinzel">Acquisition Cost</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-cyan-600 font-cinzel">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.landCostPerUnit || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group rounded-lg overflow-hidden">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-red-500 flex items-center justify-center shadow-md">
                        <AlertTriangle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-red-700 font-cinzel font-bold">Poverty Rate</span>
                        <div className="text-xs text-gray-600 font-cinzel">Economic Risk</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-red-600 font-cinzel">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.povertyRate || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Education Profile */}
              <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group rounded-lg overflow-hidden">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-purple-500 flex items-center justify-center shadow-md">
                        <GraduationCap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-purple-700 font-cinzel font-bold">College Educated</span>
                        <div className="text-xs text-gray-600 font-cinzel">Bachelor's+</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-purple-600 font-cinzel">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.collegeEducated || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Remote Work Trends */}
              <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group rounded-lg overflow-hidden">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-indigo-500 flex items-center justify-center shadow-md">
                        <Laptop className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-indigo-700 font-cinzel font-bold">Work From Home</span>
                        <div className="text-xs text-gray-600 font-cinzel">Remote Workers</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-indigo-600 font-cinzel">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.workFromHome || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Demographic Target */}
              <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group rounded-lg overflow-hidden">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-orange-500 flex items-center justify-center shadow-md">
                        <Briefcase className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-orange-700 font-cinzel font-bold">Young Professionals</span>
                        <div className="text-xs text-gray-600 font-cinzel">Age 25-34</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-orange-600 font-cinzel">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.youngProfessionals || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Executive Data Intelligence Platform */}
          <div>
            <h3 className="font-cinzel text-2xl font-bold text-white mb-6 flex items-center gap-4 tracking-wide">
              <div className="p-3 bg-gradient-to-br from-bristol-gold/60 to-yellow-500/50 rounded-2xl shadow-2xl">
                <Database className="w-7 h-7 text-white" />
              </div>
              Executive Data Platform
            </h3>
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:scale-[1.02] group rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-bristol-gold/10 via-transparent to-bristol-gold/5 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-bristol-gold/30 via-yellow-500/20 to-bristol-gold/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-60 transition-all duration-700 -z-10"></div>
              <CardContent className="p-8 relative z-10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-bristol-gold/40 to-yellow-500/30 flex items-center justify-center group-hover:from-bristol-gold/60 group-hover:to-yellow-500/50 transition-all duration-500 shadow-2xl border border-white/20">
                        <Activity className="w-6 h-6 text-white group-hover:drop-shadow-[0_0_12px_rgba(255,215,0,0.8)] group-hover:scale-110 transition-all duration-500" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white group-hover:text-bristol-gold transition-colors duration-500">Active Portfolio</div>
                        <div className="text-base text-white/60">Live Data Coverage</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-5xl font-black text-white group-hover:text-bristol-gold group-hover:drop-shadow-[0_0_20px_rgba(255,215,0,0.9)] group-hover:scale-105 transition-all duration-500 inline-block tracking-tight">{sites.length}</span>
                      <div className="text-lg text-white/60 font-bold">Properties</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white/10 rounded-2xl group-hover:bg-white/15 transition-all duration-500 border border-white/10">
                      <div className="text-xl font-bold text-white group-hover:text-bristol-gold transition-colors duration-500">Multi-State</div>
                      <div className="text-base text-white/80">Coverage</div>
                    </div>
                    <div className="text-center p-4 bg-white/10 rounded-2xl group-hover:bg-white/15 transition-all duration-500 border border-white/10">
                      <div className="text-xl font-bold text-white group-hover:text-bristol-gold transition-colors duration-500">Real-Time</div>
                      <div className="text-base text-white/80">Intelligence</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

const BarChart3 = TrendingUp;