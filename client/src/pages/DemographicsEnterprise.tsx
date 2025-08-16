import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  MapPin,
  TrendingUp,
  Building2,
  DollarSign,
  Target,
  Activity,
  BarChart3,
  PieChart,
  Globe,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  ChevronRight,
  Home,
  Calendar
} from 'lucide-react';
import SimpleChrome from '@/components/brand/SimpleChrome';
import { InteractiveMap } from '@/components/maps/InteractiveMap';
import { SiteDemographicAnalysis } from '@/components/analysis/SiteDemographicAnalysis';
import { useArcGISDemographics } from '@/components/analytics/ArcGISLayer';
import { cn } from '@/lib/utils';
import bristolBackground from '@assets/tapestry+clubhouse_1755367516748.webp';

interface DemographicMetric {
  category: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: any;
  color: string;
}

interface MarketDemographics {
  market: string;
  population: number;
  medianIncome: number;
  ageGroup25to44: number;
  employmentRate: number;
  rentAffordability: number;
  populationGrowth: number;
}

export default function DemographicsEnterprise() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch demographic data
  const { data: demographicsData } = useQuery({
    queryKey: ['/api/demographics/overview'],
    refetchInterval: 300000 // 5 minutes
  });

  const { data: sitesData } = useQuery({
    queryKey: ['/api/sites'],
    refetchInterval: 300000
  });

  const { data: marketData } = useQuery({
    queryKey: ['/api/demographics/markets'],
    refetchInterval: 600000 // 10 minutes
  });

  // Mock data for demonstration (replace with real API data)
  const demographicMetrics: DemographicMetric[] = [
    {
      category: 'Target Population (25-44)',
      value: '32.4%',
      change: '+2.8%',
      trend: 'up',
      icon: Users,
      color: 'text-green-600'
    },
    {
      category: 'Median Household Income',
      value: '$78,950',
      change: '+$5,200',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      category: 'Employment Rate',
      value: '95.2%',
      change: '+1.4%',
      trend: 'up',
      icon: Activity,
      color: 'text-green-600'
    },
    {
      category: 'Population Growth',
      value: '4.1%',
      change: '+0.9%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-blue-600'
    }
  ];

  const marketDemographics: MarketDemographics[] = [
    {
      market: 'Nashville, TN',
      population: 1934317,
      medianIncome: 78950,
      ageGroup25to44: 32.4,
      employmentRate: 95.2,
      rentAffordability: 28.5,
      populationGrowth: 4.1
    },
    {
      market: 'Austin, TX',
      population: 2352431,
      medianIncome: 89200,
      ageGroup25to44: 35.8,
      employmentRate: 96.1,
      rentAffordability: 31.2,
      populationGrowth: 5.7
    },
    {
      market: 'Atlanta, GA',
      population: 6144050,
      medianIncome: 71450,
      ageGroup25to44: 29.6,
      employmentRate: 93.8,
      rentAffordability: 26.8,
      populationGrowth: 3.2
    },
    {
      market: 'Tampa, FL',
      population: 3342963,
      medianIncome: 65890,
      ageGroup25to44: 28.9,
      employmentRate: 94.5,
      rentAffordability: 24.1,
      populationGrowth: 2.8
    }
  ];

  const sites = sitesData || [];
  const filteredMarkets = selectedMarket === 'all' 
    ? marketDemographics 
    : marketDemographics.filter(m => m.market === selectedMarket);

  return (
    <SimpleChrome showNavigation={true}>
      <div className="min-h-screen relative overflow-hidden" style={{
        backgroundImage: `url(${bristolBackground})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        backgroundRepeat: 'no-repeat',
        imageRendering: 'crisp-edges',
        WebkitImageRendering: 'crisp-edges' as any,
        msInterpolationMode: 'nearest-neighbor' as any,
        backgroundAttachment: 'fixed'
      }}>
        {/* Professional overlay for content readability */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
        
        {/* Subtle brand accent overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-bristol-maroon/[0.05] via-transparent to-bristol-gold/[0.05]" />
        
        <div className="relative z-10 container mx-auto max-w-7xl space-y-8 px-6 py-8">
          
          {/* Elite Hero Header Card */}
          <Card className="bg-white/95 backdrop-blur-md border-bristol-maroon/20 shadow-2xl shadow-bristol-maroon/10 hover:shadow-bristol-maroon/20 transition-all duration-500 mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-bristol-cyan/20 to-bristol-gold/20 rounded-2xl blur-xl" />
                    <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-bristol-maroon via-bristol-cyan to-bristol-gold flex items-center justify-center border border-bristol-cyan/30">
                      <Users className="h-8 w-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-bristol-maroon via-bristol-cyan to-bristol-gold bg-clip-text text-transparent">
                      BRISTOL DEMOGRAPHICS
                    </h1>
                    <p className="text-bristol-maroon font-medium text-lg mt-1">
                      Advanced Market Demographics Intelligence Platform
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Live Status Indicators */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-bristol-cyan/30 shadow-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-bristol-cyan text-sm font-medium">ArcGIS Live</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-bristol-gold/30 shadow-sm">
                      <Activity className="w-4 h-4 text-bristol-gold" />
                      <span className="text-bristol-gold text-sm font-medium">Real-time</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="text-bristol-cyan hover:text-bristol-maroon hover:bg-bristol-cyan/10 border border-bristol-cyan/30 bg-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demographics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {demographicMetrics.map((metric, index) => (
              <Card key={index} className="bg-white/90 backdrop-blur-sm border-bristol-cyan/20 hover:border-bristol-cyan/40 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-bristol-cyan/10">
                          <metric.icon className={`h-5 w-5 ${metric.color}`} />
                        </div>
                        <Badge variant="outline" className="text-xs">Live</Badge>
                      </div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">{metric.category}</h3>
                      <p className="text-2xl font-bold text-bristol-maroon">{metric.value}</p>
                      <p className={`text-sm ${metric.color} flex items-center gap-1`}>
                        {metric.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                        {metric.change}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Demographics Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid grid-cols-4 w-full bg-white border border-bristol-cyan/20 shadow-lg">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-bristol-cyan/20 data-[state=active]:text-bristol-cyan text-gray-600"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="markets" 
                className="data-[state=active]:bg-bristol-cyan/20 data-[state=active]:text-bristol-cyan text-gray-600"
              >
                <Globe className="w-4 h-4 mr-2" />
                Markets
              </TabsTrigger>
              <TabsTrigger 
                value="analysis" 
                className="data-[state=active]:bg-bristol-cyan/20 data-[state=active]:text-bristol-cyan text-gray-600"
              >
                <Target className="w-4 h-4 mr-2" />
                Site Analysis
              </TabsTrigger>
              <TabsTrigger 
                value="mapping" 
                className="data-[state=active]:bg-bristol-cyan/20 data-[state=active]:text-bristol-cyan text-gray-600"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Interactive Map
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Market Performance Chart */}
                <Card className="bg-white/90 backdrop-blur-sm border-bristol-cyan/20">
                  <CardHeader>
                    <CardTitle className="text-bristol-maroon flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Market Demographics Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {marketDemographics.map((market, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-bristol-cream/30">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-bristol-cyan" />
                            <span className="font-medium text-bristol-maroon">{market.market}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{(market.population / 1000000).toFixed(1)}M</div>
                            <div className="text-xs text-gray-600">Population</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Key Demographics Summary */}
                <Card className="bg-white/90 backdrop-blur-sm border-bristol-cyan/20">
                  <CardHeader>
                    <CardTitle className="text-bristol-maroon flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Target Demographics Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="text-gray-600">Average Income</div>
                          <div className="font-bold text-bristol-maroon">$78,123</div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-gray-600">Target Age Group</div>
                          <div className="font-bold text-bristol-maroon">31.8%</div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-gray-600">Employment</div>
                          <div className="font-bold text-bristol-maroon">94.9%</div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-gray-600">Growth Rate</div>
                          <div className="font-bold text-bristol-maroon">3.95%</div>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Portfolio Alignment</span>
                          <Badge className="bg-green-100 text-green-800">Excellent Match</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="markets" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Search markets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select market" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Markets</SelectItem>
                      {marketDemographics.map(market => (
                        <SelectItem key={market.market} value={market.market}>{market.market}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>

              <div className="grid gap-4">
                {filteredMarkets.map((market, index) => (
                  <Card key={index} className="bg-white/90 backdrop-blur-sm border-bristol-cyan/20 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-bristol-maroon">{market.market}</h3>
                        <Badge className="bg-bristol-cyan/10 text-bristol-cyan">Active Market</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600 mb-1">Population</div>
                          <div className="font-bold">{(market.population / 1000000).toFixed(1)}M</div>
                        </div>
                        <div>
                          <div className="text-gray-600 mb-1">Median Income</div>
                          <div className="font-bold">${market.medianIncome.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 mb-1">Age 25-44</div>
                          <div className="font-bold">{market.ageGroup25to44}%</div>
                        </div>
                        <div>
                          <div className="text-gray-600 mb-1">Employment</div>
                          <div className="font-bold">{market.employmentRate}%</div>
                        </div>
                        <div>
                          <div className="text-gray-600 mb-1">Rent Afford.</div>
                          <div className="font-bold">{market.rentAffordability}%</div>
                        </div>
                        <div>
                          <div className="text-gray-600 mb-1">Growth</div>
                          <div className="font-bold text-green-600">+{market.populationGrowth}%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              {selectedSite ? (
                <SiteDemographicAnalysis 
                  siteId={selectedSite} 
                  siteName={sites.find(s => s.id === selectedSite)?.name || 'Selected Site'} 
                />
              ) : (
                <Card className="bg-white/90 backdrop-blur-sm border-bristol-cyan/20">
                  <CardContent className="p-12 text-center">
                    <Building2 className="h-16 w-16 text-bristol-cyan mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-bristol-maroon mb-2">Select a Site for Analysis</h3>
                    <p className="text-gray-600 mb-6">Choose a property to view detailed demographic analysis</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      {sites.slice(0, 6).map((site) => (
                        <Button
                          key={site.id}
                          variant="outline"
                          onClick={() => setSelectedSite(site.id)}
                          className="flex items-center justify-between p-4 h-auto"
                        >
                          <div className="text-left">
                            <div className="font-medium">{site.name}</div>
                            <div className="text-xs text-gray-500">{site.city}, {site.state}</div>
                          </div>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="mapping" className="space-y-6">
              <Card className="bg-white/90 backdrop-blur-sm border-bristol-cyan/20">
                <CardHeader>
                  <CardTitle className="text-bristol-maroon flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Interactive Demographics Map
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="h-[600px] rounded-lg overflow-hidden">
                    <InteractiveMap sites={sites} />
                  </div>
                  <div className="mt-4 p-4 bg-bristol-cream/30 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Click anywhere on the map</strong> to view real-time demographic data for that location. 
                      Layers include census demographics, housing data, employment statistics, and economic indicators.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SimpleChrome>
  );
}