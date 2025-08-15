import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, TrendingUp, Users, DollarSign, BarChart3, Info, Target } from "lucide-react";
import Chrome from "../components/brand/SimpleChrome";
import { BristolFooter } from "@/components/ui/BristolFooter";
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
      <div className="min-h-screen bg-bristol-cream text-bristol-ink">
        {/* Header */}
        <div className="border-b border-bristol-stone/20 bg-bristol-ink text-white">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-serif font-bold text-bristol-gold">
                  Demographics Intelligence
                </h1>
                <p className="text-bristol-cream/80 mt-2">
                  Census ACS demographic analysis for Bristol Development sites
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="border-bristol-gold text-bristol-gold">
                  ACS 2023 Data
                </Badge>
                <Badge variant="outline" className="border-bristol-stone text-bristol-cream">
                  Live API
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card className="bg-white border-bristol-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-bristol-stone flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Total Sites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-bristol-ink">
                  {stats?.totalSites || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-bristol-stone/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-bristol-stone flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  With Demographics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-bristol-ink">
                  {stats?.sitesWithData || 0}
                </div>
                <div className="text-xs text-bristol-stone">
                  {stats?.totalSites ? Math.round((stats.sitesWithData / stats.totalSites) * 100) : 0}% coverage
                </div>
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
        
        <BristolFooter />
      </div>
    </Chrome>
  );
}