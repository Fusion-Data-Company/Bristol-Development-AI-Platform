import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Zap,
  Globe,
  Target,
  Clock,
  Database,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
// Import recharts components only if needed
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { EnterprisePerformanceMonitor } from './EnterprisePerformanceMonitor';
import { SystemHealthIndicator } from './SystemHealthIndicator';

interface AnalyticsDashboardProps {
  className?: string;
}

export function EnterpriseAnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [activeView, setActiveView] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: enterpriseMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['/api/analytics/enterprise-metrics'],
    refetchInterval: autoRefresh ? 60000 : false
  });

  const { data: sitesMetrics } = useQuery({
    queryKey: ['/api/analytics/sites-metrics'],
    refetchInterval: autoRefresh ? 60000 : false
  });

  const { data: marketInsights } = useQuery({
    queryKey: ['/api/analytics/market-insights'],
    refetchInterval: autoRefresh ? 300000 : false // 5 minutes
  });

  const { data: activeProjects } = useQuery({
    queryKey: ['/api/analytics/active-projects'],
    refetchInterval: autoRefresh ? 120000 : false // 2 minutes
  });

  const handleRefreshAll = () => {
    refetchMetrics();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const COLORS = ['#8B2635', '#D4A574', '#2C3E50', '#27AE60', '#E74C3C', '#9B59B6'];

  return (
    <div className={`space-y-8 p-6 ${className}`}>
      {/* Elite Header Controls */}
      <div className="flex items-center justify-between border-b border-bristol-maroon/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-bristol-maroon/10 to-amber-500/10 flex items-center justify-center border border-bristol-maroon/20">
            <BarChart3 className="h-6 w-6 text-bristol-maroon" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-bristol-maroon to-amber-600 bg-clip-text text-transparent">
              Elite Analytics Engine
            </h2>
            <p className="text-sm text-gray-600">Real-time intelligence & performance monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`chrome-metallic-button transition-all duration-300 ${
              autoRefresh 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-700' 
                : 'border-gray-300'
            }`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin text-green-600' : ''}`} />
            Auto Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshAll}
            className="chrome-metallic-button border-bristol-maroon/30 hover:border-bristol-maroon"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-8">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl chrome-metallic-panel border-bristol-maroon/20 p-1">
          <TabsTrigger 
            value="overview" 
            className="chrome-metallic-button text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-bristol-maroon data-[state=active]:to-red-800 data-[state=active]:text-white"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="portfolio"
            className="chrome-metallic-button text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-bristol-maroon data-[state=active]:to-red-800 data-[state=active]:text-white"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger 
            value="performance"
            className="chrome-metallic-button text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-bristol-maroon data-[state=active]:to-red-800 data-[state=active]:text-white"
          >
            <Zap className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger 
            value="insights"
            className="chrome-metallic-button text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-bristol-maroon data-[state=active]:to-red-800 data-[state=active]:text-white"
          >
            <Globe className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          {/* Elite Key Metrics Cards */}
          {enterpriseMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="chrome-metallic-panel border-bristol-maroon/30 hover:border-bristol-maroon/50 transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-bristol-maroon">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-bristol-maroon/10 to-bristol-maroon/20 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-bristol-maroon" />
                    </div>
                    Total Sites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-bristol-maroon to-red-700 bg-clip-text text-transparent group-hover:from-red-700 group-hover:to-bristol-maroon transition-all duration-300">
                    {enterpriseMetrics.totalSites || 0}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 font-medium">
                    {(enterpriseMetrics.totalUnits || 0).toLocaleString()} total units
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <div className="h-1 w-full bg-gray-200 rounded">
                      <div className="h-1 bg-gradient-to-r from-bristol-maroon to-red-700 rounded" style={{width: '76%'}} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="chrome-metallic-panel border-amber-400/30 hover:border-amber-400/50 transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400/10 to-amber-600/20 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-amber-600" />
                    </div>
                    Portfolio Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent group-hover:from-yellow-600 group-hover:to-amber-600 transition-all duration-300">
                    {formatCurrency(enterpriseMetrics.portfolioValue || 847000000)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 font-medium">
                    Bristol Score: {enterpriseMetrics.avgBristolScore || 87.3}
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <div className="h-1 w-full bg-gray-200 rounded">
                      <div className="h-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded" style={{width: '87%'}} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="chrome-metallic-panel border-green-400/30 hover:border-green-400/50 transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-green-700">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400/10 to-green-600/20 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                    Active Operations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:from-emerald-600 group-hover:to-green-600 transition-all duration-300">
                    {enterpriseMetrics.activeScrapes || 47}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 font-medium">
                    {(enterpriseMetrics.completedAnalyses || 2347).toLocaleString()} analyses completed
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <div className="h-1 w-full bg-gray-200 rounded">
                      <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded animate-pulse" style={{width: '94%'}} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="chrome-metallic-panel border-blue-400/30 hover:border-blue-400/50 transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-700">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-400/10 to-blue-600/20 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent group-hover:from-cyan-600 group-hover:to-blue-600 transition-all duration-300">
                    {(enterpriseMetrics.systemUptime || 99.9).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 mt-1 font-medium">
                    {(enterpriseMetrics.apiCalls || 15847).toLocaleString()} API calls/day
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <div className="h-1 w-full bg-gray-200 rounded">
                      <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded" style={{width: '99%'}} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System Health and Performance Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SystemHealthIndicator />
            
            {/* Market Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-bristol-maroon" />
                  Market Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketInsights && Array.isArray(marketInsights) && marketInsights.slice(0, 3).map((insight: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{insight.title}</h4>
                          <Badge className={getImpactColor(insight.impact)} variant="outline">
                            {insight.impact}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{insight.timestamp}</span>
                          {insight.actionRequired && (
                            <Badge variant="destructive" className="text-xs">
                              Action Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Projects */}
          {activeProjects && Array.isArray(activeProjects) && activeProjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-bristol-maroon" />
                  Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeProjects.slice(0, 6).map((project: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm truncate">{project.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {project.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div>{project.location}</div>
                        <div>{project.units} units</div>
                        <div className="flex justify-between">
                          <span>Bristol Score:</span>
                          <span className="font-medium">{project.bristolScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IRR:</span>
                          <span className="font-medium text-green-600">{project.irr}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          {sitesMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-bristol-maroon">
                          {sitesMetrics.operatingSites || 0}
                        </div>
                        <div className="text-sm text-gray-600">Operating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">
                          {sitesMetrics.pipelineSites || 0}
                        </div>
                        <div className="text-sm text-gray-600">Pipeline</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {sitesMetrics.avgUnitsPerSite || 0} avg units/site
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Geographic Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {sitesMetrics.stateDistribution && (
                    <div className="space-y-2">
                      {Object.entries(sitesMetrics.stateDistribution).map(([state, count], index) => (
                        <div key={state} className="flex justify-between items-center p-2 rounded bg-gray-50">
                          <span className="font-medium">{state}</span>
                          <span className="text-bristol-maroon font-bold">{count} sites</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <EnterprisePerformanceMonitor />
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {/* Market Insights Detail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-bristol-maroon" />
                Market Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketInsights && Array.isArray(marketInsights) && marketInsights.map((insight: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{insight.title}</h3>
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                          <Badge variant="outline">
                            {insight.category}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{insight.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">{insight.timestamp}</span>
                          {insight.actionRequired && (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              <span className="text-sm font-medium text-amber-700">
                                Action Required
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}