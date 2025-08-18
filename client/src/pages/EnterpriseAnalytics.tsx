import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Building2, 
  DollarSign, 
  MapPin, 
  Activity, 
  Target,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface PortfolioMetrics {
  totalProperties: number;
  totalUnits: number;
  totalValue: number;
  avgCapRate: number;
  avgOccupancy: number;
  avgRentPsf: number;
  marketDistribution: Record<string, number>;
  assetClassBreakdown: Record<string, number>;
  performanceMetrics: {
    noi: number;
    irr: number;
    cocReturn: number;
    dscr: number;
  };
  lastUpdated: string;
}

interface MarketAnalysis {
  market: string;
  rentGrowth: number;
  occupancyTrend: string;
  supplyPipeline: number;
  demographicScore: number;
  economicHealth: string;
  bristolExposure: number;
  unemploymentRate: number;
  populationGrowth: number;
  recommendation: string;
}

interface BristolIntelligence {
  summary: {
    totalInsights: number;
    avgConfidence: number;
    categoryBreakdown: Record<string, number>;
    lastUpdated: string;
  };
  intelligence: Array<{
    id: string;
    category: string;
    title: string;
    analysis: string;
    confidence: number;
    createdAt: string;
    source: string;
  }>;
  marketTrends: Array<any>;
  systemStatus: string;
}

export default function EnterpriseAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Portfolio metrics query
  const { data: portfolioData, isLoading: portfolioLoading } = useQuery<PortfolioMetrics>({
    queryKey: ['/api/analytics/enterprise/portfolio'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Market analysis query
  const { data: marketData, isLoading: marketLoading } = useQuery<MarketAnalysis[]>({
    queryKey: ['/api/analytics/enterprise/market-analysis'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Bristol intelligence query
  const { data: intelligenceData, isLoading: intelligenceLoading } = useQuery<BristolIntelligence>({
    queryKey: ['/api/analytics/production/bristol-intelligence'],
    refetchInterval: 180000, // Refresh every 3 minutes
  });

  // Production analytics query
  const { data: productionData, isLoading: productionLoading } = useQuery({
    queryKey: ['/api/analytics/production/portfolio-performance'],
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  const handleRefreshAll = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/enterprise/portfolio'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/enterprise/market-analysis'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/production/bristol-intelligence'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/production/portfolio-performance'] })
    ]);
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Bristol Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                Bristol Enterprise Analytics
              </h1>
              <p className="text-gray-300 mt-2 text-lg">
                Institutional-Grade Portfolio Intelligence & Market Analysis
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                LIVE DATA
              </Badge>
              <Button 
                onClick={handleRefreshAll} 
                variant="outline" 
                size="sm"
                disabled={refreshing}
                className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-gray-900"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {portfolioData ? formatCurrency(portfolioData.totalValue) : '--'}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {portfolioData ? `${formatNumber(portfolioData.totalProperties)} properties` : 'Loading...'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Units</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {portfolioData ? formatNumber(portfolioData.totalUnits) : '--'}
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Avg Occupancy: {portfolioData ? `${portfolioData.avgOccupancy}%` : '--'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Cap Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {portfolioData ? `${portfolioData.avgCapRate}%` : '--'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                IRR: {portfolioData ? `${portfolioData.performanceMetrics.irr}%` : '--'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Intelligence Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {intelligenceData ? intelligenceData.summary.avgConfidence.toFixed(1) : '--'}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-orange-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {intelligenceData ? `${intelligenceData.summary.totalInsights} insights` : 'Loading...'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
            <TabsTrigger value="markets">Market Analysis</TabsTrigger>
            <TabsTrigger value="intelligence">Bristol Intelligence</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Portfolio Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Market Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Geographic Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolioData?.marketDistribution && (
                    <div className="space-y-3">
                      {Object.entries(portfolioData.marketDistribution)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 6)
                        .map(([state, count]) => (
                        <div key={state} className="flex items-center justify-between">
                          <span className="font-medium">{state}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{
                                  width: `${(count / Math.max(...Object.values(portfolioData.marketDistribution))) * 100}%`
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Asset Class Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Asset Class Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolioData?.assetClassBreakdown && (
                    <div className="space-y-3">
                      {Object.entries(portfolioData.assetClassBreakdown).map(([assetClass, count]) => (
                        <div key={assetClass} className="flex items-center justify-between">
                          <span className="font-medium">{assetClass}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${(count / Math.max(...Object.values(portfolioData.assetClassBreakdown))) * 100}%`
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Financial Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {portfolioData && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(portfolioData.performanceMetrics.noi)}
                      </p>
                      <p className="text-sm text-gray-600">Net Operating Income</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {portfolioData.performanceMetrics.irr}%
                      </p>
                      <p className="text-sm text-gray-600">Internal Rate of Return</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {portfolioData.performanceMetrics.cocReturn}%
                      </p>
                      <p className="text-sm text-gray-600">Cash-on-Cash Return</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {portfolioData.performanceMetrics.dscr}x
                      </p>
                      <p className="text-sm text-gray-600">Debt Service Coverage</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Analysis Tab */}
          <TabsContent value="markets" className="space-y-6">
            <div className="grid gap-6">
              {marketData && marketData.slice(0, 6).map((market, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{market.market}</span>
                      <Badge 
                        variant={
                          market.economicHealth === 'Very Strong' ? 'default' :
                          market.economicHealth === 'Strong' ? 'secondary' : 'outline'
                        }
                      >
                        {market.economicHealth}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Rent Growth</p>
                        <p className="text-lg font-semibold text-green-600">{market.rentGrowth}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Bristol Properties</p>
                        <p className="text-lg font-semibold">{market.bristolExposure}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Unemployment</p>
                        <p className="text-lg font-semibold">{market.unemploymentRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Population Growth</p>
                        <p className="text-lg font-semibold text-blue-600">{market.populationGrowth}%</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{market.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Bristol Intelligence Tab */}
          <TabsContent value="intelligence" className="space-y-6">
            {intelligenceData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{intelligenceData.summary.totalInsights}</p>
                        <p className="text-sm text-gray-600">Total Intelligence Reports</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{intelligenceData.summary.avgConfidence.toFixed(1)}</p>
                        <p className="text-sm text-gray-600">Average Confidence Score</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-sm font-medium">{intelligenceData.systemStatus}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">System Status</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4">
                  {intelligenceData.intelligence.slice(0, 8).map((insight) => (
                    <Card key={insight.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <Badge variant="outline">
                            {insight.confidence}% confidence
                          </Badge>
                        </div>
                        <CardDescription>{insight.category}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {insight.analysis.length > 200 
                            ? `${insight.analysis.substring(0, 200)}...`
                            : insight.analysis
                          }
                        </p>
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <span>Source: {insight.source}</span>
                          <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {productionData && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Portfolio Performance Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{(productionData as any).portfolioKPIs?.totalProperties || 0}</p>
                        <p className="text-sm text-gray-600">Total Properties</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{formatNumber((productionData as any).portfolioKPIs?.totalUnits || 0)}</p>
                        <p className="text-sm text-gray-600">Total Units</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{((productionData as any).portfolioKPIs?.avgBristolScore || 0).toFixed(1)}</p>
                        <p className="text-sm text-gray-600">Avg Bristol Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{formatCurrency((productionData as any).portfolioKPIs?.estimatedValue || 0)}</p>
                        <p className="text-sm text-gray-600">Estimated Value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bristol Footer */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white mt-16">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h3 className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">
              Bristol Development Group
            </h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Institutional-quality multifamily development and investment platform powered by 
              advanced AI analytics and real-time market intelligence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}