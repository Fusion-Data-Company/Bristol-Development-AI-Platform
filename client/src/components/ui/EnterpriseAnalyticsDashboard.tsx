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
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-bristol-maroon" />
          <h1 className="text-3xl font-bold text-gray-900">Enterprise Analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          {enterpriseMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-bristol-maroon/5 to-bristol-maroon/10 border-bristol-maroon/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-bristol-maroon" />
                    Total Sites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-bristol-maroon">
                    {enterpriseMetrics.totalSites}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {enterpriseMetrics.totalUnits?.toLocaleString()} total units
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                    Portfolio Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-700">
                    {formatCurrency(enterpriseMetrics.portfolioValue || 0)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Bristol Score: {enterpriseMetrics.avgBristolScore}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    Active Operations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700">
                    {enterpriseMetrics.activeScrapes || 0}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {enterpriseMetrics.completedAnalyses || 0} analyses completed
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-700">
                    {enterpriseMetrics.systemUptime?.toFixed(1)}h
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {enterpriseMetrics.apiCalls?.toLocaleString()} API calls
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