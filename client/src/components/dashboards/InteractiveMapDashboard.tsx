import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortfolioMap } from "../maps/PortfolioMap";
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

  // Mock market overview data (this would come from API in production)
  const marketOverview = {
    demographics: {
      medianIncome: 78425,
      populationGrowth: 4.8,
      employmentRate: 94.2,
      ageTarget: 28.4
    },
    market: {
      avgRent: 1485,
      occupancyRate: 96.8,
      absorptionRate: 2.3,
      competitionDensity: 1.2
    },
    riskAssessment: {
      overall: 73.2,
      regulatory: 85,
      environmental: 92,
      market: 68,
      construction: 75
    },
    developmentPipeline: [
      { name: "Atlantic Station Phase II", units: 324, status: "Planning", completion: "Q3 2025" },
      { name: "Buckhead Gateway", units: 289, status: "Construction", completion: "Q1 2025" },
      { name: "Midtown Commons", units: 156, status: "Pre-Development", completion: "Q4 2025" }
    ]
  };

  // Calculate Bristol Score for selected site
  const getBristolScore = (site: Site | null): number => {
    if (!site) return 73.2; // Default market score
    // Use a simple scoring algorithm based on available data
    const score = site.totalUnits ? Math.min(100, 50 + (site.totalUnits / 10)) : 73.2;
    return score;
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
        <PortfolioMap
          selectedSiteId={selectedSite?.id}
          onSiteSelect={onSiteSelect}
          className="w-full h-full"
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

      {/* Right Sidebar */}
      <div className="w-96 bg-white border-l border-bristol-stone/20 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-bristol-stone/20 bg-bristol-cream/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium text-bristol-ink">Site Intelligence Platform</span>
            </div>
            <Button variant="ghost" size="sm" className="text-bristol-maroon">
              <Info className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-bristol-stone">
            Interactive Map • {sites.length} sites • Live data
          </div>
        </div>

        {/* Market Overview Header */}
        <div className="p-4 bg-gradient-to-r from-bristol-cream/20 to-bristol-sky/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-bristol-ink">Market Overview</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                5 properties
              </Badge>
              <Badge className="text-xs bg-bristol-maroon text-white">
                {getBristolScore(selectedSite).toFixed(1)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {new Date().toLocaleDateString()}
              </Badge>
            </div>
          </div>
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-bristol-ink">73.2</div>
              <div className="text-xs text-bristol-stone">Avg Bristol Score</div>
              <div className="text-xs text-green-600">+2.4% YoY</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-bristol-ink">$67.5K</div>
              <div className="text-xs text-bristol-stone">Median Income</div>
              <div className="text-xs text-green-600">3.4%</div>
            </div>
          </div>
        </div>

        {/* Analysis Tabs */}
        <div className="border-b border-bristol-stone/20">
          <div className="flex">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'demographics', label: 'Demographics' },
              { id: 'market', label: 'Market' },
              { id: 'scoring', label: 'Scoring' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveAnalysis(tab.id as any)}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  activeAnalysis === tab.id
                    ? 'text-bristol-maroon border-b-2 border-bristol-maroon bg-bristol-cream/30'
                    : 'text-bristol-stone hover:text-bristol-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            
            {/* Site Analysis Section */}
            {selectedSite && (
              <Card className="border-bristol-stone/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-bristol-ink">Site Analysis</CardTitle>
                    <Button variant="ghost" size="sm" className="text-bristol-maroon h-6 px-2">
                      <span className="text-xs">View details</span>
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div>
                    <div className="text-sm font-medium text-bristol-ink mb-1">{selectedSite.name}</div>
                    <div className="text-xs text-bristol-stone">{selectedSite.addrLine1 || 'Address'}, {selectedSite.city || 'City'}, {selectedSite.state || 'State'}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-bristol-stone">Status:</span>
                      <span className="ml-1 text-bristol-ink font-medium">{selectedSite.status || 'Operating'}</span>
                    </div>
                    <div>
                      <span className="text-bristol-stone">Units:</span>
                      <span className="ml-1 text-bristol-ink font-medium">{selectedSite.unitsTotal || selectedSite.totalUnits || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-bristol-stone">Bristol Score</span>
                      <span className={`text-xs font-bold ${getScoreColor(getBristolScore(selectedSite))}`}>
                        {getBristolScore(selectedSite).toFixed(1)}
                      </span>
                    </div>
                    <Progress value={getBristolScore(selectedSite)} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Market Indicators */}
            {activeAnalysis === 'overview' && (
              <div className="space-y-4">
                <Card className="border-bristol-stone/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-bristol-ink">Market Indicators</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-bristol-stone">Population Growth</span>
                        </div>
                        <span className="text-xs font-medium text-bristol-ink">4.8%</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs text-bristol-stone">Construction Permits</span>
                        </div>
                        <span className="text-xs font-medium text-bristol-ink">Med</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-xs text-bristol-stone">Job Market</span>
                        </div>
                        <span className="text-xs font-medium text-bristol-ink">Strong</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-bristol-stone">Development Pipeline</span>
                        </div>
                        <span className="text-xs font-medium text-bristol-ink">High</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-bristol-stone/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-bristol-ink">Risk Assessment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-bristol-stone">Low Risk Market</span>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Low
                        </Badge>
                      </div>
                      <div className="text-xs text-bristol-stone">
                        Strong fundamentals with minimal project trajectory exposure
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-bristol-stone/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-bristol-ink">Development Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {marketOverview.developmentPipeline.map((project, index) => (
                      <div key={index} className="flex items-center justify-between py-1 border-b border-bristol-stone/10 last:border-b-0">
                        <div>
                          <div className="text-xs font-medium text-bristol-ink">{project.name}</div>
                          <div className="text-xs text-bristol-stone">{project.units} units • {project.completion}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {project.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Demographics Tab */}
            {activeAnalysis === 'demographics' && (
              <div className="space-y-4">
                <Card className="border-bristol-stone/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-bristol-ink">Demographics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-bristol-cream/30 rounded">
                        <div className="text-sm font-bold text-bristol-ink">${marketOverview.demographics.medianIncome.toLocaleString()}</div>
                        <div className="text-xs text-bristol-stone">Median Income</div>
                      </div>
                      <div className="text-center p-2 bg-bristol-cream/30 rounded">
                        <div className="text-sm font-bold text-bristol-ink">{marketOverview.demographics.populationGrowth}%</div>
                        <div className="text-xs text-bristol-stone">Population Growth</div>
                      </div>
                      <div className="text-center p-2 bg-bristol-cream/30 rounded">
                        <div className="text-sm font-bold text-bristol-ink">{marketOverview.demographics.employmentRate}%</div>
                        <div className="text-xs text-bristol-stone">Employment Rate</div>
                      </div>
                      <div className="text-center p-2 bg-bristol-cream/30 rounded">
                        <div className="text-sm font-bold text-bristol-ink">{marketOverview.demographics.ageTarget}%</div>
                        <div className="text-xs text-bristol-stone">Age 25-44</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Market Tab */}
            {activeAnalysis === 'market' && (
              <div className="space-y-4">
                <Card className="border-bristol-stone/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-bristol-ink">Market Conditions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-bristol-cream/30 rounded">
                        <div className="text-sm font-bold text-bristol-ink">${marketOverview.market.avgRent}</div>
                        <div className="text-xs text-bristol-stone">Avg Rent</div>
                      </div>
                      <div className="text-center p-2 bg-bristol-cream/30 rounded">
                        <div className="text-sm font-bold text-bristol-ink">{marketOverview.market.occupancyRate}%</div>
                        <div className="text-xs text-bristol-stone">Occupancy Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Scoring Tab */}
            {activeAnalysis === 'scoring' && selectedSite && (
              <div className="space-y-4">
                <Card className="border-bristol-stone/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-bristol-ink">Bristol Scoring Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="text-center">
                      <div className={`text-2xl font-bold mb-1 ${getScoreColor(getBristolScore(selectedSite))}`}>
                        {getBristolScore(selectedSite).toFixed(1)}
                      </div>
                      <div className="text-xs text-bristol-stone mb-2">Overall Bristol Score</div>
                      <Badge className={`text-xs ${getBristolScore(selectedSite) >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        Grade: {getScoreGrade(getBristolScore(selectedSite))}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-bristol-stone">Demographics</span>
                        <span className="font-medium">75</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-bristol-stone">Location Access</span>
                        <span className="font-medium">82</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-bristol-stone">Market Conditions</span>
                        <span className="font-medium">68</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-bristol-stone">Development Potential</span>
                        <span className="font-medium">71</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-bristol-stone/20 bg-bristol-cream/20">
          <div className="flex items-center justify-between text-xs text-bristol-stone">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Market Assessment</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Bristol Analytics</span>
              <Badge variant="outline" className="text-xs">Live</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}