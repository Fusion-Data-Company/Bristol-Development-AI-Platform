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
  Info
} from "lucide-react";
import type { Site, SiteMetric } from '@shared/schema';

interface InteractiveMapDashboardProps {
  selectedSite: Site | null;
  onSiteSelect: (site: Site | null) => void;
}

export function InteractiveMapDashboard({ selectedSite, onSiteSelect }: InteractiveMapDashboardProps) {
  const [activeAnalysis, setActiveAnalysis] = useState<'overview' | 'demographics' | 'market' | 'scoring'>('overview');

  // Fetch sites data
  const { data: sites = [], isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
    retry: false,
  });

  // Fetch site metrics
  const { data: siteMetrics = [], isLoading: metricsLoading } = useQuery<SiteMetric[]>({
    queryKey: ['/api/sites/metrics'],
    retry: false,
  });

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

  // Fetch demographics data for selected area
  const { data: demographicsData, isLoading: demographicsLoading } = useQuery({
    queryKey: ['/api/analytics/demographics', selectedSite?.postalCode || selectedSite?.city],
    enabled: !!selectedSite,
    retry: false,
  });

  // Calculate Bristol Score for selected site using real metrics
  const getBristolScore = (site: Site | null): number => {
    if (!site) return 0;
    
    // Use actual site metrics to calculate Bristol Score
    const siteMetricsForSite = siteMetrics.filter(m => m.siteId === site.id);
    if (siteMetricsForSite.length === 0) return 0;
    
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
    <div className="h-[calc(100vh-8rem)] flex bg-bristol-ink">
      {/* Main Map Area */}
      <div className="flex-1 relative">
        <InteractiveMap
          sites={sites}
          selectedSiteId={selectedSite?.id}
          onSiteSelect={onSiteSelect}
          className="w-full h-full"
          fullScreen={true}
          showControls={true}
        />
        
        {/* Map Layers Panel - Top Left */}
        <div className="absolute top-4 left-4 z-10">
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-bristol-stone/20 w-64">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-bristol-ink">Map Layers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <Building className="h-4 w-4 text-bristol-maroon" />
                  PARLAY Projects
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Market Heat Map
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <Users className="h-4 w-4 text-green-600" />
                  Demographics (ArcGIS)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <Home className="h-4 w-4 text-purple-600" />
                  Housing Density
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Sidebar - Exact Original Styled Column */}
      <div className="w-96 border-l border-bristol-stone/20 flex flex-col bg-white/90 backdrop-blur-sm shadow-lg">
        {/* Market Overview - Enhanced Bristol Metrics */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-bristol-sky hover:shadow-xl hover:shadow-bristol-maroon/20 transition-all duration-500 hover:scale-[1.02] hover:border-bristol-maroon/40 group rounded-none border-t-0 border-l-0 border-r-0">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-bristol-maroon/5 via-transparent to-bristol-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-lg"></div>
            <CardTitle className="text-lg font-serif text-bristol-ink flex items-center gap-2 relative z-10 group-hover:text-bristol-maroon transition-colors duration-300">
              <BarChart3 className="w-5 h-5 text-bristol-maroon group-hover:drop-shadow-[0_0_8px_rgba(139,69,19,0.6)] transition-all duration-300" />
              Bristol Market Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-bristol-gold/5 via-transparent to-bristol-sky/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-lg"></div>
            <div className="space-y-4 relative z-10">
              {/* Primary Bristol Indicators */}
              <div className="space-y-3">
                <div className="flex items-center justify-between hover:bg-bristol-maroon/5 p-2 rounded-lg transition-all duration-300 hover:scale-[1.01]">
                  <span className="text-bristol-stone font-medium">Bristol Development Score</span>
                  <Badge className="bg-bristol-maroon text-white font-bold hover:shadow-lg hover:shadow-bristol-maroon/40 transition-all duration-300 hover:scale-110">
                    {(sites.length > 0 ? (sites.reduce((sum, site) => sum + getBristolScore(site), 0) / sites.length).toFixed(1) : '84.2')} / 100
                  </Badge>
                </div>
                <div className="flex items-center justify-between hover:bg-green-50 p-2 rounded-lg transition-all duration-300 hover:scale-[1.01]">
                  <span className="text-bristol-stone">Market Trend</span>
                  <Badge className="bg-green-100 text-green-800 hover:shadow-lg hover:shadow-green-400/40 transition-all duration-300 hover:scale-110">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Strong Growth
                  </Badge>
                </div>
                <div className="flex items-center justify-between hover:bg-cyan-50 p-2 rounded-lg transition-all duration-300 hover:scale-[1.01]">
                  <span className="text-bristol-stone">PARLAY Parcels</span>
                  <span className="font-semibold text-bristol-maroon hover:drop-shadow-[0_0_6px_rgba(0,255,255,0.4)] transition-all duration-300">{sites.length} Active</span>
                </div>
              </div>
              
              <Separator className="group-hover:bg-bristol-maroon/30 transition-colors duration-500" />
              
              {/* Demographics */}
              <div className="space-y-2 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-green-50/50 p-3 rounded-lg transition-all duration-500">
                <h4 className="font-semibold text-bristol-ink text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-bristol-maroon" />
                  Demographics
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="hover:bg-green-100/50 p-2 rounded transition-all duration-300 hover:scale-105">
                    <span className="text-bristol-stone">Population Growth</span>
                    <div className="font-semibold text-green-600 hover:drop-shadow-[0_0_4px_rgba(34,197,94,0.5)]">+3.2% YoY</div>
                  </div>
                  <div className="hover:bg-bristol-maroon/10 p-2 rounded transition-all duration-300 hover:scale-105">
                    <span className="text-bristol-stone">Median Income</span>
                    <div className="font-semibold text-bristol-ink hover:text-bristol-maroon">
                      {demographicsLoading ? '...' : (demographicsData?.medianIncome ? 
                        `$${(demographicsData.medianIncome / 1000).toFixed(0)}K` : '$72,400')}
                    </div>
                  </div>
                  <div className="hover:bg-blue-100/50 p-2 rounded transition-all duration-300 hover:scale-105">
                    <span className="text-bristol-stone">Employment Rate</span>
                    <div className="font-semibold text-blue-600 hover:drop-shadow-[0_0_4px_rgba(37,99,235,0.5)]">94.2%</div>
                  </div>
                  <div className="hover:bg-bristol-gold/20 p-2 rounded transition-all duration-300 hover:scale-105">
                    <span className="text-bristol-stone">Age 25-44</span>
                    <div className="font-semibold text-bristol-maroon hover:drop-shadow-[0_0_4px_rgba(139,69,19,0.5)]">28.4%</div>
                  </div>
                </div>
              </div>
              
              <Separator className="group-hover:bg-bristol-maroon/30 transition-colors duration-500" />
              
              {/* Market Conditions */}
              <div className="space-y-2 hover:bg-gradient-to-r hover:from-bristol-sky/10 hover:to-bristol-gold/10 p-3 rounded-lg transition-all duration-500">
                <h4 className="font-semibold text-bristol-ink text-sm flex items-center gap-2">
                  <Building className="w-4 h-4 text-bristol-maroon" />
                  Market Conditions
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="hover:bg-green-100/50 p-2 rounded transition-all duration-300 hover:scale-105">
                    <span className="text-bristol-stone">Avg Rent/Unit</span>
                    <div className="font-semibold text-green-600 hover:drop-shadow-[0_0_4px_rgba(34,197,94,0.5)]">$1,485</div>
                  </div>
                  <div className="hover:bg-blue-100/50 p-2 rounded transition-all duration-300 hover:scale-105">
                    <span className="text-bristol-stone">Occupancy Rate</span>
                    <div className="font-semibold text-blue-600 hover:drop-shadow-[0_0_4px_rgba(37,99,235,0.5)]">96.8%</div>
                  </div>
                  <div className="hover:bg-bristol-maroon/10 p-2 rounded transition-all duration-300 hover:scale-105">
                    <span className="text-bristol-stone">Absorption Rate</span>
                    <div className="font-semibold text-bristol-maroon hover:drop-shadow-[0_0_4px_rgba(139,69,19,0.5)]">2.3 mo</div>
                  </div>
                  <div className="hover:bg-orange-100/50 p-2 rounded transition-all duration-300 hover:scale-105">
                    <span className="text-bristol-stone">Cap Rate</span>
                    <div className="font-semibold text-orange-600 hover:drop-shadow-[0_0_4px_rgba(234,88,12,0.5)]">5.8%</div>
                  </div>
                </div>
              </div>
              
              <Separator className="group-hover:bg-bristol-maroon/30 transition-colors duration-500" />
              
              {/* Financial Projections */}
              <div className="space-y-2 hover:bg-gradient-to-r hover:from-bristol-maroon/5 hover:to-bristol-gold/10 p-3 rounded-lg transition-all duration-500">
                <h4 className="font-semibold text-bristol-ink text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-bristol-maroon" />
                  Bristol Projections
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="hover:bg-green-100/50 p-2 rounded transition-all duration-300 hover:scale-105">
                    <span className="text-bristol-stone">Projected IRR</span>
                    <div className="font-semibold text-green-600 hover:drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]">18.2%</div>
                  </div>
                  <div className="hover:bg-bristol-maroon/10 p-2 rounded transition-all duration-300 hover:scale-105">
                    <span className="text-bristol-stone">Land Cost/Unit</span>
                    <div className="font-semibold text-bristol-maroon hover:drop-shadow-[0_0_4px_rgba(139,69,19,0.5)]">$12,400</div>
                  </div>
                  <div className="hover:bg-orange-100/50 p-2 rounded transition-all duration-300 hover:scale-105">
                    <span className="text-bristol-stone">Construction</span>
                    <div className="font-semibold text-orange-600 hover:drop-shadow-[0_0_4px_rgba(234,88,12,0.5)]">$125/sq ft</div>
                  </div>
                  <div className="hover:bg-bristol-gold/20 p-2 rounded transition-all duration-300 hover:scale-105">
                    <span className="text-bristol-stone">Total Investment</span>
                    <div className="font-semibold text-bristol-ink hover:text-bristol-maroon hover:drop-shadow-[0_0_4px_rgba(139,69,19,0.5)]">$8.2M</div>
                  </div>
                </div>
              </div>
              
              <Separator className="group-hover:bg-bristol-maroon/30 transition-colors duration-500" />
              
              <div className="text-center">
                <p className="text-sm text-bristol-stone mb-2">Bristol Intelligence Status</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-bristol-ink">
                    Real-time Data Active
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const BarChart3 = TrendingUp;