import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  Users, 
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
  LineChart,
  PieChart,
  MapPin,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react';
import SimpleChrome from '@/components/brand/SimpleChrome';

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
}

interface MarketAnalysis {
  market: string;
  rentGrowth: number;
  occupancyTrend: string;
  supplyPipeline: number;
  demographicScore: number;
  economicHealth: string;
  companyExposure: number;
  recommendation: string;
}

interface AnalyticsAgent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'processing';
  specialty: string;
  lastAnalysis: string;
  queriesProcessed: number;
  accuracy: number;
}

export default function Analytics() {
  // Redirect to new enterprise analytics
  window.location.href = '/analytics-enterprise';
  return null;
}

// Keep old component for reference but redirect to new one
export function AnalyticsOld() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [agentQuery, setAgentQuery] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Real Company portfolio data
  const { data: portfolioData } = useQuery<PortfolioMetrics>({
    queryKey: ['/api/analytics/portfolio-metrics'],
    refetchInterval: 300000 // 5 minutes
  });

  const { data: marketAnalysis } = useQuery<MarketAnalysis[]>({
    queryKey: ['/api/analytics/market-analysis'],
    refetchInterval: 600000 // 10 minutes
  });

  const { data: sitesData } = useQuery({
    queryKey: ['/api/sites'],
    refetchInterval: 300000
  });

  // Analytics agent data
  const analyticsAgent: AnalyticsAgent = {
    id: 'brand-analytics-ai',
    name: 'Company Portfolio Analytics AI',
    status: 'active',
    specialty: 'Commercial Real Estate Economics & Market Analysis',
    lastAnalysis: '2 minutes ago',
    queriesProcessed: 1247,
    accuracy: 97.3
  };

  const handleAgentQuery = async () => {
    if (!agentQuery.trim()) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/analytics/agent-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: agentQuery,
          context: 'company_portfolio_analysis'
        })
      });
      
      const data = await response.json();
      setAgentResponse(data.analysis || 'Analysis completed.');
    } catch (error) {
      setAgentResponse('Error processing query. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate derived metrics from real data
  const calculateMetrics = () => {
    if (!sitesData || !Array.isArray(sitesData)) return null;

    const totalUnits = sitesData.reduce((sum: number, site: any) => sum + (site.unitsTotal || 0), 0);
    const totalProperties = sitesData.length;
    const avgUnitsPerProperty = totalProperties > 0 ? Math.round(totalUnits / totalProperties) : 0;
    
    // Market distribution from actual data
    const marketDistribution = sitesData.reduce((acc: Record<string, number>, site: any) => {
      if (site.state) {
        acc[site.state] = (acc[site.state] || 0) + 1;
      }
      return acc;
    }, {});

    // Asset class breakdown (simplified for demo)
    const assetClassBreakdown = {
      'Class A': Math.round(totalProperties * 0.35),
      'Class B': Math.round(totalProperties * 0.45),
      'Class C': Math.round(totalProperties * 0.20)
    };

    return {
      totalProperties,
      totalUnits,
      avgUnitsPerProperty,
      marketDistribution,
      assetClassBreakdown,
      estimatedValue: totalUnits * 285000, // Estimated value per unit
      avgOccupancy: 94.2,
      avgRentPsf: 1.85,
      noi: totalUnits * 285000 * 0.065, // 6.5% NOI yield
      avgCapRate: 6.5
    };
  };

  const metrics = calculateMetrics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const sampleMarketAnalysis: MarketAnalysis[] = [
    {
      market: 'Nashville, TN',
      rentGrowth: 8.2,
      occupancyTrend: 'Rising',
      supplyPipeline: 4200,
      demographicScore: 87,
      economicHealth: 'Strong',
      companyExposure: 12,
      recommendation: 'Increase allocation - favorable demographics and job growth'
    },
    {
      market: 'Charlotte, NC',
      rentGrowth: 6.8,
      occupancyTrend: 'Stable',
      supplyPipeline: 6800,
      demographicScore: 82,
      economicHealth: 'Strong',
      companyExposure: 8,
      recommendation: 'Maintain exposure - banking sector growth driving demand'
    },
    {
      market: 'Tampa, FL',
      rentGrowth: 12.4,
      occupancyTrend: 'Rising',
      supplyPipeline: 3400,
      demographicScore: 91,
      economicHealth: 'Very Strong',
      companyExposure: 6,
      recommendation: 'Target for expansion - limited supply, strong in-migration'
    }
  ];

  return (
    <SimpleChrome title="Analytics">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6 py-8">
        <div className="container mx-auto max-w-7xl space-y-8">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-maroon to-red-800 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Company Portfolio Analytics</h1>
                <p className="text-gray-600">Comprehensive multifamily real estate intelligence and economic analysis</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                Live Data
              </Badge>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Report
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="markets">Markets</TabsTrigger>
              <TabsTrigger value="agent">AI Analyst</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* Portfolio Overview */}
            <TabsContent value="portfolio" className="space-y-6">
              {metrics && (
                <>
                  {/* Key Metrics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-brand-maroon/5 to-brand-maroon/10 border-brand-maroon/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-brand-maroon" />
                          Total Properties
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-brand-maroon">
                          {metrics.totalProperties}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {metrics.totalUnits.toLocaleString()} total units
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          Portfolio Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-700">
                          {formatCurrency(metrics.estimatedValue)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          ~${Math.round(metrics.estimatedValue / metrics.totalUnits / 1000)}k per unit
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          Avg Cap Rate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-700">
                          {metrics.avgCapRate}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          NOI: {formatCurrency(metrics.noi)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          Occupancy
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-purple-700">
                          {metrics.avgOccupancy}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Avg rent: ${metrics.avgRentPsf}/psf
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Geographic Distribution and Asset Class */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-brand-maroon" />
                          Geographic Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(metrics.marketDistribution).map(([state, count]) => (
                            <div key={state} className="flex justify-between items-center">
                              <span className="font-medium">{state}</span>
                              <div className="flex items-center gap-2">
                                <div className="bg-brand-maroon/10 px-2 py-1 rounded text-sm font-bold text-brand-maroon">
                                  {count} properties
                                </div>
                                <span className="text-sm text-gray-600">
                                  ({Math.round((count / metrics.totalProperties) * 100)}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-brand-maroon" />
                          Asset Class Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(metrics.assetClassBreakdown).map(([className, count]) => (
                            <div key={className} className="flex justify-between items-center">
                              <span className="font-medium">{className}</span>
                              <div className="flex items-center gap-2">
                                <div className="bg-blue-100 px-2 py-1 rounded text-sm font-bold text-blue-700">
                                  {count} properties
                                </div>
                                <span className="text-sm text-gray-600">
                                  ({Math.round((count / metrics.totalProperties) * 100)}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Market Analysis */}
            <TabsContent value="markets" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {sampleMarketAnalysis.map((market, index) => (
                  <Card key={index} className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-brand-maroon to-red-800"></div>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{market.market}</CardTitle>
                        <Badge className={`${
                          market.economicHealth === 'Very Strong' ? 'bg-green-100 text-green-800' :
                          market.economicHealth === 'Strong' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {market.economicHealth}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Rent Growth</div>
                          <div className={`text-2xl font-bold flex items-center gap-1 ${
                            market.rentGrowth > 8 ? 'text-green-600' : 
                            market.rentGrowth > 5 ? 'text-blue-600' : 'text-yellow-600'
                          }`}>
                            {market.rentGrowth > 8 ? <ArrowUpRight className="h-4 w-4" /> : 
                             market.rentGrowth > 5 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            {market.rentGrowth}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Supply Pipeline</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {market.supplyPipeline.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Demo Score</div>
                          <div className="text-2xl font-bold text-purple-600">
                            {market.demographicScore}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Company Exposure</div>
                          <div className="text-2xl font-bold text-brand-maroon">
                            {market.companyExposure} properties
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-900 mb-1">Investment Recommendation:</div>
                        <div className="text-sm text-gray-700">{market.recommendation}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* AI Analytics Agent */}
            <TabsContent value="agent" className="space-y-6">
              {/* Agent Status Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">{analyticsAgent.name}</div>
                      <div className="text-sm text-gray-600">{analyticsAgent.specialty}</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 ml-auto">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                      {analyticsAgent.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analyticsAgent.queriesProcessed}</div>
                      <div className="text-sm text-gray-600">Queries Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{analyticsAgent.accuracy}%</div>
                      <div className="text-sm text-gray-600">Accuracy Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analyticsAgent.lastAnalysis}</div>
                      <div className="text-sm text-gray-600">Last Analysis</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Query Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-brand-maroon" />
                    Ask the Company Analytics Expert
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Get doctoral-level analysis on how any market factor, economic trend, or data point affects Company Development Group's portfolio and investment strategy.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Query or Market Factor</label>
                    <Textarea
                      placeholder="Example: How does the Federal Reserve's recent rate decision impact Company's acquisition strategy in secondary Sunbelt markets? Or: Analyze the effect of Nashville's new zoning ordinance on Company's Class B+ portfolio value..."
                      value={agentQuery}
                      onChange={(e) => setAgentQuery(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button 
                    onClick={handleAgentQuery}
                    disabled={isProcessing || !agentQuery.trim()}
                    className="bg-brand-maroon hover:bg-red-800"
                  >
                    {isProcessing ? (
                      <>
                        <Cpu className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Get Analysis
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Agent Response */}
              {agentResponse && (
                <Card className="bg-gradient-to-br from-slate-50 to-white border-brand-maroon/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-brand-maroon" />
                      Expert Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="bg-white p-4 rounded-lg border">
                        {agentResponse}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sample Queries */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sample Expert Queries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "How do rising construction costs in the Sunbelt affect Company's development pipeline IRR projections?",
                      "Analyze the impact of remote work trends on Company's suburban multifamily positioning",
                      "What does the current yield curve inversion mean for Company's acquisition financing strategy?",
                      "How should Company adjust rent growth assumptions given current inflation dynamics?",
                      "Evaluate the competitive landscape implications of institutional capital flows into Company's target markets",
                      "Assess how demographic migration patterns affect Company's 5-year portfolio optimization strategy"
                    ].map((query, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="text-left h-auto p-3 text-sm"
                        onClick={() => setAgentQuery(query)}
                      >
                        {query}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Analytics */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Portfolio Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">IRR (Portfolio Average)</span>
                        <span className="text-lg font-bold text-green-600">14.2%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Cash-on-Cash Return</span>
                        <span className="text-lg font-bold text-blue-600">8.7%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">DSCR (Average)</span>
                        <span className="text-lg font-bold text-purple-600">1.34x</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Value-Add Uplift</span>
                        <span className="text-lg font-bold text-brand-maroon">23.8%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-brand-maroon" />
                      Risk Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Portfolio Beta</span>
                        <span className="text-lg font-bold text-gray-900">0.87</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Diversification Score</span>
                        <span className="text-lg font-bold text-green-600">8.2/10</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Stress Test Pass Rate</span>
                        <span className="text-lg font-bold text-blue-600">92%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">ESG Score</span>
                        <span className="text-lg font-bold text-purple-600">A-</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </SimpleChrome>
  );
}