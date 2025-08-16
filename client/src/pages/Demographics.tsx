import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, TrendingUp, Users, DollarSign, BarChart3, Info, Target } from "lucide-react";
import Chrome from "../components/brand/SimpleChrome";
import { DemographicMap } from "../components/maps/DemographicMap";
import { SiteDemographicAnalysis } from "../components/analysis/SiteDemographicAnalysis";
import { AddressDemographics } from "../components/analysis/AddressDemographics";
import { useQuery } from "@tanstack/react-query";

interface DemographicStats {
  totalSites: number;
  sitesWithData: number;
  avgPopulation: number;
  avgIncome: number;
  avgRent: number;
}

interface Site {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

export default function Demographics() {
  const [enrichmentCount, setEnrichmentCount] = useState(0);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Fetch available sites
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ['sites-list'],
    queryFn: async () => {
      const response = await fetch('/api/sites');
      if (!response.ok) throw new Error('Failed to fetch sites');
      return response.json();
    }
  });

  // Fetch demographic statistics
  const { data: stats, refetch: refetchStats } = useQuery<DemographicStats>({
    queryKey: ['demographic-stats', enrichmentCount],
    queryFn: async () => {
      const response = await fetch('/api/sites.geojson');
      if (!response.ok) throw new Error('Failed to fetch demographic data');
      
      const geojson = await response.json();
      const features = geojson.features || [];
      
      const sitesWithData = features.filter((f: any) => f.properties?.acs_profile);
      const populations = sitesWithData
        .map((f: any) => f.properties?.acs_profile?.population)
        .filter((p: any) => Number.isFinite(p));
      const incomes = sitesWithData
        .map((f: any) => f.properties?.acs_profile?.median_income)
        .filter((i: any) => Number.isFinite(i));
      const rents = sitesWithData
        .map((f: any) => f.properties?.acs_profile?.median_rent)
        .filter((r: any) => Number.isFinite(r));

      return {
        totalSites: features.length,
        sitesWithData: sitesWithData.length,
        avgPopulation: populations.length ? Math.round(populations.reduce((a: number, b: number) => a + b, 0) / populations.length) : 0,
        avgIncome: incomes.length ? Math.round(incomes.reduce((a: number, b: number) => a + b, 0) / incomes.length) : 0,
        avgRent: rents.length ? Math.round(rents.reduce((a: number, b: number) => a + b, 0) / rents.length) : 0,
      };
    }
  });

  const handleEnrichmentComplete = () => {
    setEnrichmentCount(prev => prev + 1);
    refetchStats();
    toast({
      title: "Demographics Updated",
      description: "ACS demographic data has been refreshed for all sites",
    });
  };

  return (
    <Chrome>
      <div className="min-h-screen bg-gradient-to-br from-white via-bristol-fog to-bristol-fog/50 relative overflow-hidden">
        {/* Light background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,165,116,0.02),transparent_50%)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-bristol-gold/3 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-bristol-maroon/3 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-bristol-sky/3 rounded-full blur-2xl animate-pulse delay-500" />
        
        <div className="relative z-10">
          {/* Light Header */}
          <div className="border-b border-bristol-stone/20 bg-white/95 backdrop-blur-xl shadow-lg">
            <div className="container mx-auto max-w-7xl px-6 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-bristol-gold/20 to-bristol-maroon/20 rounded-2xl blur-xl" />
                    <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-bristol-maroon via-bristol-gold to-bristol-maroon flex items-center justify-center border border-bristol-gold/40 shadow-lg">
                      <Users className="h-8 w-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-bristol-maroon via-bristol-ink to-bristol-maroon bg-clip-text text-transparent">
                      DEMOGRAPHICS INTELLIGENCE
                    </h1>
                    <p className="text-bristol-stone font-medium text-lg mt-1">
                      Census ACS demographic analysis for Bristol Development sites
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-700 text-sm font-medium">ACS 2023 Live</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bristol-gold/10 border border-bristol-gold/30">
                    <BarChart3 className="w-4 h-4 text-bristol-maroon" />
                    <span className="text-bristol-maroon text-sm font-medium">Real-time API</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Elite Stats Dashboard */}
          <div className="container mx-auto max-w-7xl px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <Card className="bg-white/95 border-bristol-gold/30 backdrop-blur-xl shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-bristol-maroon font-medium">Total Sites</CardTitle>
                    <MapPin className="h-5 w-5 text-bristol-gold" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-bristol-ink">{stats?.totalSites || 0}</div>
                </CardContent>
            </Card>

              <Card className="bg-white/95 border-bristol-gold/30 backdrop-blur-xl shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-bristol-maroon font-medium">With Demographics</CardTitle>
                    <BarChart3 className="h-5 w-5 text-bristol-gold" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-bristol-ink">{stats?.sitesWithData || 0}</div>
                  <p className="text-bristol-stone text-sm mt-1">
                    {stats?.totalSites ? Math.round((stats.sitesWithData / stats.totalSites) * 100) : 0}% coverage
                  </p>
                </CardContent>
            </Card>

            <Card className="bg-white border-bristol-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-bristol-stone flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Avg Population
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-bristol-ink">
                  {stats?.avgPopulation?.toLocaleString() || '—'}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-bristol-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-bristol-stone flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Avg Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-bristol-ink">
                  {stats?.avgIncome ? `$${stats.avgIncome.toLocaleString()}` : '—'}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-bristol-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-bristol-stone flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Avg Rent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-bristol-ink">
                  {stats?.avgRent ? `$${stats.avgRent.toLocaleString()}` : '—'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
            <TabsTrigger value="address">Address Lookup</TabsTrigger>
            <TabsTrigger value="analysis">Site Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Map */}
              <div className="lg:col-span-3">
                <Card className="bg-white border-bristol-stone/20 h-[600px]">
                  <CardHeader>
                    <CardTitle className="text-bristol-ink font-serif">
                      Portfolio Demographic Map
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-[520px]">
                    <DemographicMap 
                      className="w-full h-full rounded-b-lg"
                      onEnrichComplete={handleEnrichmentComplete}
                    />
                  </CardContent>
                </Card>
              </div>
              {/* Info Panel - existing content */}

            {/* Info Panel */}
            <div className="space-y-4">
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-bristol-ink flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Data Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <div className="font-medium text-bristol-ink">Census ACS</div>
                    <div className="text-bristol-stone">American Community Survey 5-year estimates</div>
                  </div>
                  <div>
                    <div className="font-medium text-bristol-ink">FCC Block API</div>
                    <div className="text-bristol-stone">Geographic coordinate resolution</div>
                  </div>
                  <div>
                    <div className="font-medium text-bristol-ink">GEOID Tracts</div>
                    <div className="text-bristol-stone">Census tract boundary mapping</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-bristol-ink">
                    Available Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Population (B01003_001E)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Median Household Income (B19013_001E)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Median Gross Rent (B25064_001E)</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-bristol-ink">
                    Color Scale
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="text-bristol-stone">
                    Site markers are colored using quantile-based ranges:
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#045a8d]"></div>
                      <span>95th percentile</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#2b8cbe]"></div>
                      <span>75th percentile</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#74a9cf]"></div>
                      <span>50th percentile</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#bdc9e1]"></div>
                      <span>25th percentile</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#f1eef6]"></div>
                      <span>5th percentile</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="address">
            <AddressDemographics />
          </TabsContent>

          <TabsContent value="analysis">
            <div className="space-y-6">
              {/* Site Selection */}
              <Card className="bg-white border-bristol-stone/20">
                <CardHeader>
                  <CardTitle className="text-bristol-ink font-serif flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Focused Site Analysis
                  </CardTitle>
                  <p className="text-bristol-stone text-sm mt-1">
                    Select a site for in-depth demographic analysis including surrounding area comparison
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a site to analyze..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sites.map((site) => (
                            <SelectItem key={site.id} value={site.id}>
                              {site.name} {site.city && site.state && `(${site.city}, ${site.state})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Badge variant="outline" className="border-bristol-gold text-bristol-gold">
                      25+ Variables
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Analysis */}
              {selectedSiteId && (
                <SiteDemographicAnalysis 
                  siteId={selectedSiteId}
                  siteName={sites.find(s => s.id === selectedSiteId)?.name}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
          </div>
        </div>
      </div>
    </Chrome>
  );
}