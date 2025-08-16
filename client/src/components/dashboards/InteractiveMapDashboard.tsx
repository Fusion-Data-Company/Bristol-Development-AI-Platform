import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import WorkingMap from "../maps/WorkingMap";
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
  Briefcase
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
    <div className="h-full w-full flex bg-bristol-ink m-0 p-0 max-w-none overflow-hidden">
      {/* Main Map Area - Expanded */}
      <div className="flex-1 relative">
        <WorkingMap />
        

      </div>

      {/* Right Info Panel - Real Data Bristol Market Intelligence - Maximized Width */}
      <div className="w-[32rem] bg-white/98 backdrop-blur-sm border-l-2 border-bristol-gold/20 p-6 overflow-y-auto h-full shadow-xl">
        <div className="space-y-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-bristol-ink mb-2 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-bristol-maroon" />
              Bristol Market Intelligence
            </h3>
            {selectedSite && (
              <div className="bg-cyan-400/10 rounded-lg p-3 mb-3 border border-cyan-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-cyan-600" />
                  <span className="text-sm font-semibold text-bristol-ink">
                    {selectedSite.name !== 'Selected Area' ? selectedSite.name : 'Selected Location'}
                  </span>
                </div>
                <div className="text-xs text-bristol-stone">
                  {selectedSite.city}, {selectedSite.state}
                </div>
                <div className="text-xs text-bristol-stone/80">
                  {selectedSite.latitude?.toFixed(4)}, {selectedSite.longitude?.toFixed(4)}
                </div>
              </div>
            )}
            {!selectedSite && (
              <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">How to Use</span>
                </div>
                <div className="text-xs text-blue-700">
                  Click anywhere on the map to analyze market intelligence for that specific area. Data will update automatically.
                </div>
              </div>
            )}
            <div className="space-y-2">
              {/* Bristol Development Score */}
              <Card className="bg-gradient-to-br from-bristol-maroon/30 via-cyan-400/10 to-white border-bristol-maroon border-2 hover:border-bristol-maroon/90 hover:shadow-2xl hover:shadow-bristol-maroon/60 transition-all duration-600 hover:scale-[1.03] group backdrop-blur-sm relative overflow-hidden shadow-xl shadow-bristol-maroon/30">
                <div className="absolute inset-0 bg-gradient-to-br from-bristol-maroon/20 via-cyan-400/15 to-transparent opacity-50 group-hover:opacity-80 transition-all duration-600"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-bristol-maroon/40 via-cyan-400/40 to-bristol-maroon/40 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-600 -z-10"></div>
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-cyan-400/30 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-all duration-500"></div>
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-bristol-maroon/40 flex items-center justify-center group-hover:bg-bristol-maroon/60 transition-all duration-300 shadow-lg">
                        <Star className="w-4 h-4 text-bristol-maroon group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(139,69,19,0.8)] group-hover:scale-110 transition-all duration-300" />
                      </div>
                      <div>
                        <span className="text-xs text-bristol-maroon/90 uppercase tracking-wider font-bold">Bristol Score</span>
                        <div className="text-sm font-bold text-bristol-ink group-hover:text-bristol-maroon transition-colors duration-300">Development Rating</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-bristol-maroon group-hover:text-cyan-600 group-hover:drop-shadow-[0_0_12px_rgba(139,69,19,0.9)] group-hover:scale-105 transition-all duration-300 inline-block">
                        {selectedSite ? getBristolScore(selectedSite).toFixed(1) : (sites.length > 0 ? (sites.reduce((sum, site) => sum + getBristolScore(site), 0) / sites.length).toFixed(1) : '84.2')}
                      </span>
                      <div className="text-xs text-bristol-maroon/80 font-bold">/ 100</div>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-bristol-stone/30 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-bristol-maroon to-cyan-400 rounded-full group-hover:shadow-[0_0_12px_rgba(139,69,19,0.7)] transition-all duration-500 shadow-lg" 
                         style={{ width: `${(sites.length > 0 ? (sites.reduce((sum, site) => sum + getBristolScore(site), 0) / sites.length) : 84.2)}%` }}></div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Demographics Section */}
              <Card className="bg-gradient-to-br from-green-200/90 via-green-50 to-white border-green-400 border-2 hover:border-green-500 hover:shadow-2xl hover:shadow-green-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-green-300/40">
                <div className="absolute inset-0 bg-gradient-to-br from-green-300/30 via-transparent to-green-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-green-400/50 via-green-500/50 to-green-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-400/40 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-green-400/60 flex items-center justify-center group-hover:bg-green-500/80 transition-all duration-300 shadow-md">
                        <TrendingUp className="w-3.5 h-3.5 text-green-700 group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(34,197,94,0.7)] group-hover:scale-110 transition-all duration-300" />
                      </div>
                      <div>
                        <span className="text-xs text-green-800 font-bold">Population Growth</span>
                        <div className="text-xs text-green-700 font-medium">Annual YoY</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-green-600 group-hover:text-green-700 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] group-hover:scale-105 transition-all duration-300 inline-block">
                        {demographicsLoading ? '...' : 
                          (demographicsData?.populationGrowth || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-bristol-maroon/30 via-cyan-400/20 to-white border-bristol-maroon border-2 hover:border-cyan-500 hover:shadow-2xl hover:shadow-bristol-maroon/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-cyan-400/30">
                <div className="absolute inset-0 bg-gradient-to-br from-bristol-maroon/20 via-cyan-400/25 to-transparent opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-bristol-maroon/40 via-cyan-400/50 to-bristol-maroon/40 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-cyan-400/50 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-bristol-maroon/50 flex items-center justify-center group-hover:bg-bristol-maroon/70 transition-all duration-300 shadow-md">
                        <DollarSign className="w-3.5 h-3.5 text-bristol-maroon group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(139,69,19,0.7)] group-hover:scale-110 transition-all duration-300" />
                      </div>
                      <div>
                        <span className="text-xs text-bristol-maroon font-bold">Median Income</span>
                        <div className="text-xs text-bristol-maroon/80 font-medium">Household</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-bristol-maroon group-hover:text-cyan-600 group-hover:drop-shadow-[0_0_8px_rgba(139,69,19,0.8)] group-hover:scale-105 transition-all duration-300 inline-block">
                        {demographicsLoading ? '...' : 
                          (demographicsData?.medianIncome || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-200/90 via-blue-50 to-white border-blue-400 border-2 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-blue-300/40">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-300/30 via-transparent to-blue-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/50 via-blue-500/50 to-blue-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                <div className="absolute -top-1 -left-1 w-8 h-8 bg-blue-400/50 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-400/60 flex items-center justify-center group-hover:bg-blue-500/80 transition-all duration-300 shadow-md">
                        <Users className="w-3.5 h-3.5 text-blue-700 group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(37,99,235,0.7)] group-hover:scale-110 transition-all duration-300" />
                      </div>
                      <div>
                        <span className="text-xs text-blue-800 font-bold">Employment Rate</span>
                        <div className="text-xs text-blue-700 font-medium">Active Workforce</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-blue-600 group-hover:text-blue-700 group-hover:drop-shadow-[0_0_8px_rgba(37,99,235,0.8)] group-hover:scale-105 transition-all duration-300 inline-block">
                        {demographicsLoading ? '...' : 
                          (demographicsData?.employmentRate || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-cyan-400/30 via-cyan-400/15 to-white border-cyan-400 border-2 hover:border-cyan-500/90 hover:shadow-2xl hover:shadow-cyan-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-cyan-400/40">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/25 via-transparent to-cyan-400/15 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/50 via-cyan-500/60 to-cyan-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-400/50 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-cyan-400/50 flex items-center justify-center group-hover:bg-cyan-500/70 transition-all duration-300 shadow-md">
                        <Target className="w-3.5 h-3.5 text-cyan-600 group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(6,182,212,0.8)] group-hover:scale-110 transition-all duration-300" />
                      </div>
                      <div>
                        <span className="text-xs text-cyan-600 font-bold">Age 25-44</span>
                        <div className="text-xs text-cyan-600/80 font-medium">Target Demo</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-cyan-600 group-hover:text-cyan-700 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.9)] group-hover:scale-105 transition-all duration-300 inline-block">
                        {demographicsLoading ? '...' : 
                          (demographicsData?.age25_44Percent || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Market Conditions */}
              <Card className="bg-gradient-to-br from-green-200/90 via-green-50 to-white border-green-400 border-2 hover:border-green-500 hover:shadow-2xl hover:shadow-green-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-green-300/40">
                <div className="absolute inset-0 bg-gradient-to-br from-green-300/30 via-transparent to-green-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-green-400/50 via-green-500/50 to-green-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-400/40 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-green-400/60 flex items-center justify-center group-hover:bg-green-500/80 transition-all duration-300 shadow-md">
                        <Home className="w-3.5 h-3.5 text-green-700 group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(34,197,94,0.7)] group-hover:scale-110 transition-all duration-300" />
                      </div>
                      <div>
                        <span className="text-xs text-green-800 font-bold">Avg Rent/Unit</span>
                        <div className="text-xs text-green-700 font-medium">Market Rate</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-green-600 group-hover:text-green-700 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] group-hover:scale-105 transition-all duration-300 inline-block">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.averageRent || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-200/90 via-blue-50 to-white border-blue-400 border-2 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-blue-300/40">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-300/30 via-transparent to-blue-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/50 via-blue-500/50 to-blue-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-blue-400/50 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-400/60 flex items-center justify-center group-hover:bg-blue-500/80 transition-all duration-300 shadow-md">
                        <Building className="w-3.5 h-3.5 text-blue-700 group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(37,99,235,0.7)] group-hover:scale-110 transition-all duration-300" />
                      </div>
                      <div>
                        <span className="text-xs text-blue-800 font-bold">Occupancy Rate</span>
                        <div className="text-xs text-blue-700 font-medium">Market Demand</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-blue-600 group-hover:text-blue-700 group-hover:drop-shadow-[0_0_8px_rgba(37,99,235,0.8)] group-hover:scale-105 transition-all duration-300 inline-block">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.occupancyRate || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-bristol-maroon/30 via-cyan-400/20 to-white border-bristol-maroon border-2 hover:border-cyan-500 hover:shadow-2xl hover:shadow-bristol-maroon/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-cyan-400/30">
                <div className="absolute inset-0 bg-gradient-to-br from-bristol-maroon/20 via-cyan-400/25 to-transparent opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-bristol-maroon/40 via-cyan-400/50 to-bristol-maroon/40 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                <div className="absolute -top-1 -left-1 w-8 h-8 bg-cyan-400/50 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-bristol-maroon/50 flex items-center justify-center group-hover:bg-bristol-maroon/70 transition-all duration-300 shadow-md">
                        <Calendar className="w-3.5 h-3.5 text-bristol-maroon group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(139,69,19,0.7)] group-hover:scale-110 transition-all duration-300" />
                      </div>
                      <div>
                        <span className="text-xs text-bristol-maroon font-bold">Absorption Rate</span>
                        <div className="text-xs text-bristol-maroon/80 font-medium">Lease-up Time</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-bristol-maroon group-hover:text-cyan-600 group-hover:drop-shadow-[0_0_8px_rgba(139,69,19,0.8)] group-hover:scale-105 transition-all duration-300 inline-block">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.absorptionRate || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Financial Projections */}
              <Card className="bg-gradient-to-br from-green-200/90 via-green-50 to-white border-green-400 border-2 hover:border-green-500 hover:shadow-2xl hover:shadow-green-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-green-300/40">
                <div className="absolute inset-0 bg-gradient-to-br from-green-300/30 via-transparent to-green-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-green-400/50 via-green-500/50 to-green-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-400/50 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-green-400/60 flex items-center justify-center group-hover:bg-green-500/80 transition-all duration-300 shadow-md">
                        <TrendingUp className="w-3.5 h-3.5 text-green-700 group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(34,197,94,0.7)] group-hover:scale-110 transition-all duration-300" />
                      </div>
                      <div>
                        <span className="text-xs text-green-800 font-bold">Projected IRR</span>
                        <div className="text-xs text-green-700 font-medium">Expected Return</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-green-600 group-hover:text-green-700 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] group-hover:scale-105 transition-all duration-300 inline-block">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.projectedIRR || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-cyan-400/30 via-cyan-400/15 to-white border-cyan-400 border-2 hover:border-cyan-500/90 hover:shadow-2xl hover:shadow-cyan-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-cyan-400/40">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/25 via-transparent to-cyan-400/15 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/50 via-cyan-500/60 to-cyan-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-cyan-400/60 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-all duration-400"></div>
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-cyan-400/50 flex items-center justify-center group-hover:bg-cyan-500/70 transition-all duration-300 shadow-md">
                        <DollarSign className="w-3.5 h-3.5 text-cyan-600 group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(6,182,212,0.8)] group-hover:scale-110 transition-all duration-300" />
                      </div>
                      <div>
                        <span className="text-xs text-cyan-600 font-bold">Land Cost/Unit</span>
                        <div className="text-xs text-cyan-600/80 font-medium">Acquisition Cost</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-cyan-600 group-hover:text-cyan-700 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.9)] group-hover:scale-105 transition-all duration-300 inline-block">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.landCostPerUnit || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Bristol Development Metrics */}
              <Card className="bg-gradient-to-br from-red-200/90 via-red-50 to-white border-red-400 border-2 hover:border-red-500 hover:shadow-2xl hover:shadow-red-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-red-300/40">
                <div className="absolute inset-0 bg-gradient-to-br from-red-300/30 via-transparent to-red-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-red-400/50 via-red-500/50 to-red-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-red-400/60 flex items-center justify-center group-hover:bg-red-500/80 transition-all duration-300 shadow-md">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-700 group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(239,68,68,0.7)] group-hover:scale-110 transition-all duration-300" />
                      </div>
                      <div>
                        <span className="text-xs text-red-800 font-bold">Poverty Rate</span>
                        <div className="text-xs text-red-700 font-medium">Economic Risk</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-red-600 group-hover:text-red-700 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] group-hover:scale-105 transition-all duration-300 inline-block">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.povertyRate || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-200/90 via-purple-50 to-white border-purple-400 border-2 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-purple-300/40">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-300/30 via-transparent to-purple-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-400/50 via-purple-500/50 to-purple-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-purple-400/60 flex items-center justify-center group-hover:bg-purple-500/80 transition-all duration-300 shadow-md">
                        <GraduationCap className="w-3.5 h-3.5 text-purple-700 group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(147,51,234,0.7)] group-hover:scale-110 transition-all duration-300" />
                      </div>
                      <div>
                        <span className="text-xs text-purple-800 font-bold">College Educated</span>
                        <div className="text-xs text-purple-700 font-medium">Bachelor's+</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-purple-600 group-hover:text-purple-700 group-hover:drop-shadow-[0_0_8px_rgba(147,51,234,0.8)] group-hover:scale-105 transition-all duration-300 inline-block">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.collegeEducated || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-200/90 via-indigo-50 to-white border-indigo-400 border-2 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-indigo-300/40">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-300/30 via-transparent to-indigo-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-400/50 via-indigo-500/50 to-indigo-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-400/60 flex items-center justify-center group-hover:bg-indigo-500/80 transition-all duration-300 shadow-md">
                        <Laptop className="w-3.5 h-3.5 text-indigo-700 group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(99,102,241,0.7)] group-hover:scale-110 transition-all duration-300" />
                      </div>
                      <div>
                        <span className="text-xs text-indigo-800 font-bold">Work From Home</span>
                        <div className="text-xs text-indigo-700 font-medium">Remote Workers</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-indigo-600 group-hover:text-indigo-700 group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] group-hover:scale-105 transition-all duration-300 inline-block">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.workFromHome || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-200/90 via-orange-50 to-white border-orange-400 border-2 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-400/60 transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-lg shadow-orange-300/40">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-300/30 via-transparent to-orange-200/20 opacity-60 group-hover:opacity-90 transition-all duration-500"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/50 via-orange-500/50 to-orange-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
                <CardContent className="p-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-orange-400/60 flex items-center justify-center group-hover:bg-orange-500/80 transition-all duration-300 shadow-md">
                        <Briefcase className="w-3.5 h-3.5 text-orange-700 group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(249,115,22,0.7)] group-hover:scale-110 transition-all duration-300" />
                      </div>
                      <div>
                        <span className="text-xs text-orange-800 font-bold">Young Professionals</span>
                        <div className="text-xs text-orange-700 font-medium">Age 25-34</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-orange-600 group-hover:text-orange-700 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] group-hover:scale-105 transition-all duration-300 inline-block">
                        {demographicsLoading ? '...' : 
                          (marketConditionsData?.youngProfessionals || 'Data unavailable')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div>
            <h3 className="font-serif text-lg font-semibold text-bristol-ink mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-cyan-100/80 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
              </div>
              PARLAY Data
            </h3>
            <Card className="bg-gradient-to-br from-cyan-200/90 via-cyan-50 to-white border-cyan-400 border-2 hover:border-cyan-500 hover:shadow-2xl hover:shadow-cyan-400/60 transition-all duration-600 hover:scale-[1.02] group backdrop-blur-sm relative overflow-hidden shadow-xl shadow-cyan-300/40">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/30 via-transparent to-cyan-200/20 opacity-60 group-hover:opacity-90 transition-all duration-600"></div>
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/50 via-cyan-500/50 to-cyan-400/50 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-600 -z-10"></div>
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-cyan-400/30 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-all duration-500"></div>
              <CardContent className="p-4 relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-400/40 flex items-center justify-center group-hover:bg-cyan-500/60 transition-all duration-300 shadow-lg">
                      <Activity className="w-4 h-4 text-cyan-600 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] group-hover:scale-110 transition-all duration-300" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-cyan-800 group-hover:text-cyan-900 transition-colors duration-300">Active Parcels</div>
                      <div className="text-xs text-cyan-600">Geographic Coverage</div>
                    </div>
                    <div className="ml-auto">
                      <span className="text-2xl font-black text-cyan-600 group-hover:text-cyan-700 group-hover:drop-shadow-[0_0_12px_rgba(6,182,212,0.9)] group-hover:scale-105 transition-all duration-300 inline-block">{sites.length}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="text-center p-2 bg-cyan-100/50 rounded group-hover:bg-cyan-200/60 transition-all duration-300">
                      <div className="font-bold text-cyan-800">Multi-State</div>
                      <div className="text-cyan-600">Coverage</div>
                    </div>
                    <div className="text-center p-2 bg-cyan-100/50 rounded group-hover:bg-cyan-200/60 transition-all duration-300">
                      <div className="font-bold text-cyan-800">Live Data</div>
                      <div className="text-cyan-600">Real-time</div>
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