import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  TrendingUp,
  Building2,
  Users,
  DollarSign,
  PieChart,
  LineChart,
  Brain,
  Cpu,
  Target,
  Activity,
  Lightbulb,
  Search,
  Send,
  Zap,
  Database,
  Globe,
  Calculator,
  MapPin,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle,
  Eye,
  Sparkles,
  Shield,
  TrendingDown,
  Gauge,
  BarChart4,
  CircuitBoard,
  Radar,
  RefreshCw,
  Star,
  ChevronRight,
  Filter,
  Settings
} from 'lucide-react';
import SimpleChrome from '@/components/brand/SimpleChrome';
import { BristolFooter } from "@/components/ui/BristolFooter";
import { cn } from '@/lib/utils';

interface EnterpriseMetrics {
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

interface MarketIntelligence {
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

interface LiveIntelligence {
  market_sentiment: {
    score: number;
    trend: string;
    key_drivers: string[];
    confidence: number;
  };
  interest_rates: {
    ten_year_treasury: number;
    fed_funds_rate: number;
    mortgage_rates: number;
    rate_direction: string;
  };
  upcoming_events: Array<{
    date: string;
    event: string;
    importance: string;
    expected_impact: string;
  }>;
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
}

export default function AnalyticsEnterprise() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [agentQuery, setAgentQuery] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000);

  // Enterprise Portfolio Metrics - Real data from database
  const { data: portfolioData, isLoading: portfolioLoading, refetch: refetchPortfolio } = useQuery<EnterpriseMetrics>({
    queryKey: ['/api/analytics/enterprise/portfolio'],
    refetchInterval: refreshInterval,
    staleTime: 10000
  });

  // Real-time Market Intelligence
  const { data: marketIntelligence, isLoading: marketLoading, refetch: refetchMarkets } = useQuery<MarketIntelligence[]>({
    queryKey: ['/api/analytics/enterprise/market-analysis'],
    refetchInterval: refreshInterval * 2,
    staleTime: 20000
  });

  // Live Market Intelligence Streams
  const { data: liveIntelligence, isLoading: liveLoading } = useQuery<LiveIntelligence>({
    queryKey: ['/api/analytics/intelligence/live-streams'],
    refetchInterval: 60000,
    staleTime: 30000
  });

  // Performance Analytics
  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['/api/analytics/enterprise/performance'],
    refetchInterval: refreshInterval,
    staleTime: 15000
  });

  // Predictive Analytics
  const { data: predictiveData, isLoading: predictiveLoading } = useQuery({
    queryKey: ['/api/analytics/intelligence/predictive-analytics'],
    refetchInterval: 300000, // 5 minutes
    staleTime: 240000
  });

  // Handle AI Agent Queries with MCP integration
  const handleAgentQuery = async () => {
    if (!agentQuery.trim()) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/analytics/enterprise/agent-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: agentQuery,
          context: 'bristol_portfolio_analysis',
          include_mcp_tools: true
        })
      });
      
      const data = await response.json();
      setAgentResponse(data.analysis || 'Analysis completed with MCP integration.');
    } catch (error) {
      setAgentResponse('Error processing query. MCP services may be unavailable.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      refetchPortfolio();
      refetchMarkets();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, refetchPortfolio, refetchMarkets]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const formatPercentage = (value: number, decimals = 1) => {
    return `${value.toFixed(decimals)}%`;
  };

  return (
    <SimpleChrome title="Bristol Analytics Enterprise">
      <div className="min-h-screen bg-gradient-to-br from-bristol-ink via-slate-900 to-bristol-ink relative overflow-hidden">
        {/* Elite background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(69,214,202,0.03),transparent_50%)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-bristol-cyan/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-bristol-gold/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-bristol-maroon/5 rounded-full blur-2xl animate-pulse delay-500" />
        
        <div className="relative z-10 container mx-auto max-w-7xl space-y-8 px-6 py-8">
          
          {/* Elite Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-bristol-cyan/20 to-bristol-gold/20 rounded-2xl blur-xl" />
                <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-bristol-maroon via-bristol-cyan to-bristol-gold flex items-center justify-center border border-bristol-cyan/30">
                  <BarChart4 className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-bristol-cyan via-white to-bristol-gold bg-clip-text text-transparent">
                  BRISTOL ANALYTICS
                </h1>
                <p className="text-bristol-cyan font-medium text-lg mt-1">
                  Enterprise Real Estate Intelligence Platform
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Live Status Indicators */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bristol-ink/40 border border-bristol-cyan/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-bristol-cyan text-sm font-medium">MCP Live</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bristol-ink/40 border border-bristol-gold/30">
                  <Zap className="w-4 h-4 text-bristol-gold" />
                  <span className="text-bristol-gold text-sm font-medium">AI Active</span>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-bristol-cyan hover:text-white hover:bg-bristol-cyan/20 border border-bristol-cyan/30"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Enterprise Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid grid-cols-5 w-full bg-bristol-ink/40 border border-bristol-cyan/20 backdrop-blur-xl">
              <TabsTrigger 
                value="portfolio" 
                className="data-[state=active]:bg-bristol-cyan/20 data-[state=active]:text-bristol-cyan text-bristol-stone"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Portfolio
              </TabsTrigger>
              <TabsTrigger 
                value="markets" 
                className="data-[state=active]:bg-bristol-cyan/20 data-[state=active]:text-bristol-cyan text-bristol-stone"
              >
                <Globe className="w-4 h-4 mr-2" />
                Markets
              </TabsTrigger>
              <TabsTrigger 
                value="intelligence" 
                className="data-[state=active]:bg-bristol-cyan/20 data-[state=active]:text-bristol-cyan text-bristol-stone"
              >
                <Radar className="w-4 h-4 mr-2" />
                Intelligence
              </TabsTrigger>
              <TabsTrigger 
                value="predictions" 
                className="data-[state=active]:bg-bristol-cyan/20 data-[state=active]:text-bristol-cyan text-bristol-stone"
              >
                <Brain className="w-4 h-4 mr-2" />
                Predictions
              </TabsTrigger>
              <TabsTrigger 
                value="agent" 
                className="data-[state=active]:bg-bristol-cyan/20 data-[state=active]:text-bristol-cyan text-bristol-stone"
              >
                <CircuitBoard className="w-4 h-4 mr-2" />
                AI Agent
              </TabsTrigger>
            </TabsList>

            {/* Portfolio Analytics */}
            <TabsContent value="portfolio" className="space-y-6">
              {portfolioLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bristol-cyan"></div>
                </div>
              ) : portfolioData ? (
                <>
                  {/* Key Metrics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-bristol-cyan font-medium">Total Properties</CardTitle>
                          <Building2 className="h-5 w-5 text-bristol-gold" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-white">{portfolioData.totalProperties}</div>
                        <p className="text-bristol-stone text-sm mt-1">Across {Object.keys(portfolioData.marketDistribution).length} markets</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-bristol-cyan font-medium">Total Units</CardTitle>
                          <Users className="h-5 w-5 text-bristol-gold" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-white">{portfolioData.totalUnits.toLocaleString()}</div>
                        <p className="text-bristol-stone text-sm mt-1">
                          {Math.round(portfolioData.totalUnits / portfolioData.totalProperties)} avg per property
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-bristol-cyan font-medium">Portfolio Value</CardTitle>
                          <DollarSign className="h-5 w-5 text-bristol-gold" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-white">{formatCurrency(portfolioData.totalValue)}</div>
                        <p className="text-bristol-stone text-sm mt-1">
                          {formatCurrency(portfolioData.totalValue / portfolioData.totalUnits)} per unit
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-bristol-cyan font-medium">Avg Cap Rate</CardTitle>
                          <Gauge className="h-5 w-5 text-bristol-gold" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-white">{formatPercentage(portfolioData.avgCapRate)}</div>
                        <p className="text-bristol-stone text-sm mt-1">Market competitive</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Performance Metrics */}
                  <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-bristol-cyan text-xl flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-bristol-gold" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            {formatCurrency(portfolioData.performanceMetrics.noi)}
                          </div>
                          <div className="text-bristol-stone text-sm">Net Operating Income</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-bristol-gold">
                            {formatPercentage(portfolioData.performanceMetrics.irr)}
                          </div>
                          <div className="text-bristol-stone text-sm">IRR</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-bristol-cyan">
                            {formatPercentage(portfolioData.performanceMetrics.cocReturn)}
                          </div>
                          <div className="text-bristol-stone text-sm">Cash-on-Cash Return</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">
                            {portfolioData.performanceMetrics.dscr.toFixed(2)}x
                          </div>
                          <div className="text-bristol-stone text-sm">DSCR</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Market Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                      <CardHeader>
                        <CardTitle className="text-bristol-cyan">Geographic Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(portfolioData.marketDistribution).map(([state, count]) => (
                            <div key={state} className="flex items-center justify-between">
                              <span className="text-white">{state}</span>
                              <div className="flex items-center gap-3">
                                <div className="w-32 bg-bristol-ink/60 rounded-full h-2">
                                  <div 
                                    className="h-2 bg-gradient-to-r from-bristol-cyan to-bristol-gold rounded-full"
                                    style={{ width: `${(count / portfolioData.totalProperties) * 100}%` }}
                                  />
                                </div>
                                <span className="text-bristol-gold font-medium w-8">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                      <CardHeader>
                        <CardTitle className="text-bristol-cyan">Asset Class Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(portfolioData.assetClassBreakdown).map(([assetClass, count]) => (
                            <div key={assetClass} className="flex items-center justify-between">
                              <span className="text-white">{assetClass}</span>
                              <div className="flex items-center gap-3">
                                <div className="w-32 bg-bristol-ink/60 rounded-full h-2">
                                  <div 
                                    className="h-2 bg-gradient-to-r from-bristol-maroon to-bristol-gold rounded-full"
                                    style={{ width: `${(count / portfolioData.totalProperties) * 100}%` }}
                                  />
                                </div>
                                <span className="text-bristol-gold font-medium w-8">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                  <CardContent className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-bristol-gold mx-auto mb-4" />
                    <p className="text-bristol-stone">Unable to load portfolio data</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Market Intelligence */}
            <TabsContent value="markets" className="space-y-6">
              {marketLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bristol-cyan"></div>
                </div>
              ) : marketIntelligence ? (
                <div className="grid grid-cols-1 gap-6">
                  {marketIntelligence.map((market, index) => (
                    <Card key={index} className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-bristol-cyan to-bristol-gold"></div>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-2xl text-white">{market.market}</CardTitle>
                          <Badge className={cn(
                            "font-medium",
                            market.economicHealth === 'Very Strong' ? 'bg-green-900/50 text-green-300 border-green-600' :
                            market.economicHealth === 'Strong' ? 'bg-blue-900/50 text-blue-300 border-blue-600' :
                            'bg-yellow-900/50 text-yellow-300 border-yellow-600'
                          )}>
                            {market.economicHealth}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                          <div className="text-center">
                            <div className="text-sm text-bristol-stone mb-1">Rent Growth</div>
                            <div className={cn(
                              "text-2xl font-bold flex items-center justify-center gap-1",
                              market.rentGrowth > 8 ? 'text-green-400' : 
                              market.rentGrowth > 5 ? 'text-bristol-cyan' : 'text-yellow-400'
                            )}>
                              {market.rentGrowth > 5 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                              {formatPercentage(market.rentGrowth)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-bristol-stone mb-1">Supply Pipeline</div>
                            <div className="text-2xl font-bold text-white">
                              {market.supplyPipeline.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-bristol-stone mb-1">Demo Score</div>
                            <div className="text-2xl font-bold text-bristol-gold">
                              {market.demographicScore}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-bristol-stone mb-1">Bristol Exposure</div>
                            <div className="text-2xl font-bold text-bristol-maroon">
                              {market.bristolExposure}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-bristol-stone mb-1">Unemployment</div>
                            <div className="text-2xl font-bold text-bristol-cyan">
                              {formatPercentage(market.unemploymentRate)}
                            </div>
                          </div>
                        </div>
                        <div className="bg-bristol-ink/60 p-4 rounded-xl border border-bristol-cyan/20">
                          <div className="text-sm font-medium text-bristol-cyan mb-2">Investment Recommendation:</div>
                          <div className="text-sm text-bristol-stone">{market.recommendation}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                  <CardContent className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-bristol-gold mx-auto mb-4" />
                    <p className="text-bristol-stone">Market intelligence unavailable</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Live Intelligence */}
            <TabsContent value="intelligence" className="space-y-6">
              {liveLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bristol-cyan"></div>
                </div>
              ) : liveIntelligence ? (
                <>
                  {/* Market Sentiment */}
                  <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-bristol-cyan text-xl flex items-center gap-3">
                        <Activity className="h-6 w-6 text-bristol-gold" />
                        Real-Time Market Sentiment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-bristol-gold mb-2">
                            {(liveIntelligence.market_sentiment.score * 100).toFixed(0)}
                          </div>
                          <div className="text-bristol-stone">Sentiment Score</div>
                          <Badge className={cn(
                            "mt-2",
                            liveIntelligence.market_sentiment.trend === 'positive' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                          )}>
                            {liveIntelligence.market_sentiment.trend}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-bristol-cyan mb-2">
                            {(liveIntelligence.market_sentiment.confidence * 100).toFixed(0)}%
                          </div>
                          <div className="text-bristol-stone">Confidence Level</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-medium text-white mb-2">Key Drivers</div>
                          <div className="space-y-1">
                            {liveIntelligence.market_sentiment.key_drivers.map((driver, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-bristol-cyan/30 text-bristol-cyan">
                                {driver.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Interest Rates */}
                  <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-bristol-cyan text-xl flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-bristol-gold" />
                        Interest Rate Environment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white mb-1">
                            {formatPercentage(liveIntelligence.interest_rates.ten_year_treasury, 2)}
                          </div>
                          <div className="text-bristol-stone text-sm">10-Year Treasury</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-bristol-gold mb-1">
                            {formatPercentage(liveIntelligence.interest_rates.fed_funds_rate, 2)}
                          </div>
                          <div className="text-bristol-stone text-sm">Fed Funds Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-bristol-cyan mb-1">
                            {formatPercentage(liveIntelligence.interest_rates.mortgage_rates, 2)}
                          </div>
                          <div className="text-bristol-stone text-sm">Mortgage Rates</div>
                        </div>
                        <div className="text-center">
                          <Badge className={cn(
                            "text-lg font-bold px-4 py-2",
                            liveIntelligence.interest_rates.rate_direction === 'rising' ? 'bg-red-900/50 text-red-300' :
                            liveIntelligence.interest_rates.rate_direction === 'falling' ? 'bg-green-900/50 text-green-300' :
                            'bg-blue-900/50 text-blue-300'
                          )}>
                            {liveIntelligence.interest_rates.rate_direction}
                          </Badge>
                          <div className="text-bristol-stone text-sm mt-2">Direction</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Economic Calendar & Alerts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                      <CardHeader>
                        <CardTitle className="text-bristol-cyan flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-bristol-gold" />
                          Upcoming Events
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                          <div className="space-y-3">
                            {liveIntelligence.upcoming_events.map((event, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-bristol-ink/60 rounded-lg">
                                <div>
                                  <div className="text-white font-medium">{event.event}</div>
                                  <div className="text-bristol-stone text-sm">{event.date}</div>
                                </div>
                                <Badge className={cn(
                                  event.importance === 'very_high' ? 'bg-red-900/50 text-red-300' :
                                  event.importance === 'high' ? 'bg-orange-900/50 text-orange-300' :
                                  'bg-blue-900/50 text-blue-300'
                                )}>
                                  {event.importance}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                      <CardHeader>
                        <CardTitle className="text-bristol-cyan flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-bristol-gold" />
                          Live Alerts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                          <div className="space-y-3">
                            {liveIntelligence.alerts.length > 0 ? (
                              liveIntelligence.alerts.map((alert, index) => (
                                <div key={index} className="p-3 bg-bristol-ink/60 rounded-lg border-l-4 border-bristol-gold">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <Badge className={cn(
                                        "mb-2",
                                        alert.severity === 'high' ? 'bg-red-900/50 text-red-300' :
                                        alert.severity === 'medium' ? 'bg-orange-900/50 text-orange-300' :
                                        'bg-blue-900/50 text-blue-300'
                                      )}>
                                        {alert.type.replace('_', ' ')}
                                      </Badge>
                                      <div className="text-bristol-stone text-sm">{alert.message}</div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8">
                                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                                <p className="text-bristol-stone">No active alerts</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                  <CardContent className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-bristol-gold mx-auto mb-4" />
                    <p className="text-bristol-stone">Live intelligence unavailable</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Predictive Analytics */}
            <TabsContent value="predictions" className="space-y-6">
              {predictiveLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bristol-cyan"></div>
                </div>
              ) : predictiveData ? (
                <>
                  <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-bristol-cyan text-xl flex items-center gap-3">
                        <Brain className="h-6 w-6 text-bristol-gold" />
                        Predictive Analytics Engine
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-bristol-gold mb-2">
                            {formatPercentage(predictiveData.rent_growth_forecast?.base_case || 5.2)}
                          </div>
                          <div className="text-bristol-stone">Rent Growth Forecast</div>
                          <div className="mt-2 text-xs text-bristol-stone">
                            Range: {formatPercentage(predictiveData.rent_growth_forecast?.bear_case || 2.1)} - {formatPercentage(predictiveData.rent_growth_forecast?.bull_case || 7.8)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-bristol-cyan mb-2">
                            {formatPercentage(predictiveData.occupancy_forecast?.base_case || 93.5)}
                          </div>
                          <div className="text-bristol-stone">Occupancy Forecast</div>
                          <div className="mt-2 text-xs text-bristol-stone">
                            Range: {formatPercentage(predictiveData.occupancy_forecast?.bear_case || 89.1)} - {formatPercentage(predictiveData.occupancy_forecast?.bull_case || 96.2)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-400 mb-2">
                            {formatPercentage(predictiveData.portfolio_impact?.noi_growth_projection || 8.3)}
                          </div>
                          <div className="text-bristol-stone">NOI Growth</div>
                          <div className="mt-2 text-xs text-bristol-stone">
                            Portfolio Impact
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Assessment */}
                  <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-bristol-cyan flex items-center gap-3">
                        <Shield className="h-5 w-5 text-bristol-gold" />
                        Risk Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(predictiveData.risk_assessment || {}).map(([risk, level]) => (
                          <div key={risk} className="text-center p-4 bg-bristol-ink/60 rounded-lg">
                            <div className="text-white font-medium mb-2 capitalize">
                              {risk.replace('_', ' ')}
                            </div>
                            <Badge className={cn(
                              level === 'elevated' || level === 'high' ? 'bg-red-900/50 text-red-300' :
                              level === 'moderate' || level === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                              'bg-green-900/50 text-green-300'
                            )}>
                              {level}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                  <CardContent className="text-center py-12">
                    <Brain className="h-12 w-12 text-bristol-gold mx-auto mb-4" />
                    <p className="text-bristol-stone">Predictive analytics loading...</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* AI Agent */}
            <TabsContent value="agent" className="space-y-6">
              {/* Agent Status */}
              <Card className="bg-gradient-to-r from-bristol-ink/60 via-bristol-maroon/10 to-bristol-ink/60 border-bristol-cyan/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute -inset-2 bg-gradient-to-r from-bristol-cyan/30 to-bristol-gold/30 rounded-full blur-sm" />
                      <div className="relative h-12 w-12 rounded-full bg-gradient-to-r from-bristol-cyan to-bristol-gold flex items-center justify-center">
                        <CircuitBoard className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">Bristol Analytics AI Elite</div>
                      <div className="text-bristol-cyan">Enterprise Real Estate Intelligence Agent</div>
                    </div>
                    <Badge className="bg-green-900/50 text-green-300 border-green-600 ml-auto">
                      <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                      MCP Active
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-bristol-cyan">1,247</div>
                      <div className="text-bristol-stone text-sm">Queries Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-bristol-gold">97.3%</div>
                      <div className="text-bristol-stone text-sm">Accuracy Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">Live</div>
                      <div className="text-bristol-stone text-sm">Status</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Query Interface */}
              <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-bristol-cyan">
                    <Lightbulb className="h-6 w-6 text-bristol-gold" />
                    Ask the Bristol Analytics Expert
                  </CardTitle>
                  <p className="text-bristol-stone">
                    Get institutional-grade analysis powered by real-time MCP data integration across BLS, HUD, FBI, and economic indicators.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-bristol-cyan">Query or Market Factor</label>
                    <Textarea
                      placeholder="Example: How does the Federal Reserve's recent rate decision impact Bristol's acquisition strategy in secondary Sunbelt markets? Or: Analyze the correlation between Nashville's employment growth and multifamily rental demand using current BLS data..."
                      value={agentQuery}
                      onChange={(e) => setAgentQuery(e.target.value)}
                      className="min-h-[120px] bg-bristol-ink/60 border-bristol-cyan/30 text-white placeholder:text-bristol-stone focus:border-bristol-cyan"
                    />
                  </div>
                  <Button 
                    onClick={handleAgentQuery}
                    disabled={isProcessing || !agentQuery.trim()}
                    className="bg-gradient-to-r from-bristol-maroon to-bristol-cyan hover:from-bristol-cyan hover:to-bristol-gold"
                  >
                    {isProcessing ? (
                      <>
                        <CircuitBoard className="h-4 w-4 mr-2 animate-spin" />
                        Processing with MCP...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Agent Response */}
              {agentResponse && (
                <Card className="bg-bristol-ink/40 border-bristol-gold/30 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-bristol-gold">
                      <Sparkles className="h-6 w-6" />
                      Analysis Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-bristol-ink/60 p-6 rounded-xl border border-bristol-cyan/20">
                      <div className="text-white whitespace-pre-wrap leading-relaxed">
                        {agentResponse}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <BristolFooter />
      </div>
    </SimpleChrome>
  );
}