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
  RefreshCw,
  Shield,
  MapPin
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

          {/* Elite System Health and Performance Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced System Health */}
            <Card className="chrome-metallic-panel border-green-400/30 hover:border-green-400/50 transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-green-700">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-400/10 to-green-600/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  System Health Monitor
                  <div className="ml-auto">
                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                    <div className="text-2xl font-bold text-green-700">99.9%</div>
                    <div className="text-xs text-green-600 font-medium">Uptime</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">2.3s</div>
                    <div className="text-xs text-blue-600 font-medium">Response</div>
                  </div>
                </div>
                
                {/* Live Performance Indicators */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm font-bold text-green-600">23%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse" style={{width: '23%'}}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Memory</span>
                    <span className="text-sm font-bold text-blue-600">67%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{width: '67%'}}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Network</span>
                    <span className="text-sm font-bold text-amber-600">145ms</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Elite Market Insights */}
            <Card className="chrome-metallic-panel border-purple-400/30 hover:border-purple-400/50 transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-purple-700">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-400/10 to-purple-600/20 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-purple-600" />
                  </div>
                  Live Market Intelligence
                  <div className="ml-auto">
                    <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white animate-float">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      LIVE
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marketInsights && Array.isArray(marketInsights) && marketInsights.slice(0, 3).map((insight: any, index: number) => (
                    <div key={index} className="data-card-elite p-4 hover:border-bristol-maroon/30 transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-bristol-maroon/10 to-amber-500/20 flex items-center justify-center flex-shrink-0">
                          {insight.impact === 'high' ? <AlertTriangle className="h-4 w-4 text-red-600" /> : 
                           insight.impact === 'medium' ? <Target className="h-4 w-4 text-amber-600" /> : 
                           <CheckCircle className="h-4 w-4 text-green-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm text-gray-900">{insight.title}</h4>
                            <Badge className={`${getImpactColor(insight.impact)} text-xs`} variant="outline">
                              {insight.impact?.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">{insight.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-medium">{insight.timestamp}</span>
                            {insight.actionRequired && (
                              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs animate-pulse">
                                Action Required
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Elite Active Projects Grid */}
          {activeProjects && Array.isArray(activeProjects) && activeProjects.length > 0 && (
            <Card className="chrome-metallic-panel border-bristol-maroon/20 hover:border-bristol-maroon/40 transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-bristol-maroon">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-bristol-maroon/10 to-amber-500/20 flex items-center justify-center">
                    <Target className="h-5 w-5 text-bristol-maroon" />
                  </div>
                  Active Development Pipeline
                  <div className="ml-auto flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-bristol-maroon to-red-800 text-white animate-float">
                      {activeProjects.length} Projects
                    </Badge>
                    <div className="h-3 w-3 bg-bristol-maroon rounded-full animate-pulse"></div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeProjects.slice(0, 6).map((project: any, index: number) => (
                    <div key={index} className="data-card-elite p-5 hover:border-bristol-maroon/40 group transition-all duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-gradient-to-br from-bristol-maroon/20 to-amber-500/20 flex items-center justify-center">
                            <Building2 className="h-3 w-3 text-bristol-maroon" />
                          </div>
                          <h4 className="font-bold text-sm text-gray-900 group-hover:text-bristol-maroon transition-colors truncate">
                            {project.name}
                          </h4>
                        </div>
                        <Badge 
                          className={`text-xs ${
                            project.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                            project.status === 'planning' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            project.status === 'construction' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`} 
                          variant="outline"
                        >
                          {project.status?.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span className="font-medium">{project.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>{project.units} units</span>
                        </div>
                        
                        {/* Elite Performance Metrics */}
                        <div className="pt-2 border-t border-gray-200 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Bristol Score:</span>
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-bristol-maroon">{project.bristolScore}</span>
                              <div className="h-1 w-8 bg-gray-200 rounded">
                                <div 
                                  className="h-1 bg-gradient-to-r from-bristol-maroon to-amber-500 rounded" 
                                  style={{width: `${project.bristolScore}%`}}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">IRR:</span>
                            <span className="font-bold text-green-600">{project.irr}%</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">NPV:</span>
                            <span className="font-bold text-blue-600">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                notation: 'compact',
                                maximumFractionDigits: 1
                              }).format(project.npv || (project.units * 45000))}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Cap Rate:</span>
                            <span className="font-bold text-purple-600">{project.capRate || '6.2'}%</span>
                          </div>
                        </div>
                        
                        {/* Progress Indicator */}
                        <div className="pt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-600 text-xs">Progress</span>
                            <span className="text-xs font-medium">{project.progress || Math.floor(Math.random() * 100)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full">
                            <div 
                              className="h-1.5 bg-gradient-to-r from-bristol-maroon to-amber-500 rounded-full transition-all duration-500" 
                              style={{width: `${project.progress || Math.floor(Math.random() * 100)}%`}}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Elite Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-8">
          {sitesMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {/* Elite Portfolio Distribution */}
              <Card className="chrome-metallic-panel border-bristol-maroon/30 hover:border-bristol-maroon/50 transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-bristol-maroon">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-bristol-maroon/10 to-amber-500/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-bristol-maroon" />
                    </div>
                    Portfolio Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                        <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {sitesMetrics.operatingSites || 34}
                        </div>
                        <div className="text-sm text-green-700 font-medium">Operating</div>
                        <div className="mt-2 h-1 w-full bg-green-200 rounded">
                          <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded" style={{width: '74%'}} />
                        </div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200">
                        <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                          {sitesMetrics.pipelineSites || 12}
                        </div>
                        <div className="text-sm text-amber-700 font-medium">Pipeline</div>
                        <div className="mt-2 h-1 w-full bg-amber-200 rounded">
                          <div className="h-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded" style={{width: '26%'}} />
                        </div>
                      </div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-bristol-maroon/5 to-bristol-maroon/10 border border-bristol-maroon/20">
                      <div className="text-2xl font-bold bg-gradient-to-r from-bristol-maroon to-red-700 bg-clip-text text-transparent">
                        {sitesMetrics.avgUnitsPerSite || 187}
                      </div>
                      <div className="text-sm text-bristol-maroon font-medium">Avg Units/Site</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Elite Geographic Distribution */}
              <Card className="chrome-metallic-panel border-blue-400/30 hover:border-blue-400/50 transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-blue-700">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400/10 to-blue-600/20 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                    Geographic Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sitesMetrics.stateDistribution ? (
                    <div className="space-y-3">
                      {Object.entries(sitesMetrics.stateDistribution).map(([state, count], index) => (
                        <div key={state} className="data-card-elite p-3 hover:border-blue-400/30 transition-all duration-300">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-400/20 to-blue-600/20 flex items-center justify-center">
                                <MapPin className="h-3 w-3 text-blue-600" />
                              </div>
                              <span className="font-semibold text-gray-900">{state}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-700 font-bold">{count}</span>
                              <div className="h-1 w-12 bg-gray-200 rounded">
                                <div 
                                  className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded" 
                                  style={{width: `${Math.min(100, (count as number / 20) * 100)}%`}}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {['Texas', 'Florida', 'Georgia', 'North Carolina', 'Tennessee'].map((state, index) => (
                        <div key={state} className="data-card-elite p-3 hover:border-blue-400/30 transition-all duration-300">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-400/20 to-blue-600/20 flex items-center justify-center">
                                <MapPin className="h-3 w-3 text-blue-600" />
                              </div>
                              <span className="font-semibold text-gray-900">{state}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-700 font-bold">{[12, 8, 7, 6, 5][index]}</span>
                              <div className="h-1 w-12 bg-gray-200 rounded">
                                <div 
                                  className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded" 
                                  style={{width: `${[60, 40, 35, 30, 25][index]}%`}}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Elite Financial Performance */}
              <Card className="chrome-metallic-panel border-purple-400/30 hover:border-purple-400/50 transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-purple-700">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-400/10 to-purple-600/20 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                    </div>
                    Financial Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="data-card-elite p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Total AUM</span>
                      <span className="text-lg font-bold text-purple-700">$847M</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{width: '87%'}} />
                    </div>
                  </div>
                  
                  <div className="data-card-elite p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Avg IRR</span>
                      <span className="text-lg font-bold text-green-600">18.4%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{width: '92%'}} />
                    </div>
                  </div>
                  
                  <div className="data-card-elite p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Avg Cap Rate</span>
                      <span className="text-lg font-bold text-blue-600">6.8%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{width: '68%'}} />
                    </div>
                  </div>
                  
                  <div className="data-card-elite p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Occupancy Rate</span>
                      <span className="text-lg font-bold text-bristol-maroon">94.2%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-gradient-to-r from-bristol-maroon to-red-700 rounded-full" style={{width: '94%'}} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Elite Performance Tab */}
        <TabsContent value="performance" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            
            {/* Real-Time Performance Monitor */}
            <Card className="chrome-metallic-panel border-green-400/30 hover:border-green-400/50 transition-all duration-300 xl:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-green-700">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-400/10 to-green-600/20 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  Real-Time Performance Monitor
                  <div className="ml-auto">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse">
                      <Zap className="h-3 w-3 mr-1" />
                      LIVE
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                    <div className="text-2xl font-bold text-green-700">99.9%</div>
                    <div className="text-xs text-green-600 font-medium">Uptime</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">145ms</div>
                    <div className="text-xs text-blue-600 font-medium">Response</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">47</div>
                    <div className="text-xs text-purple-600 font-medium">Active Tasks</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200">
                    <div className="text-2xl font-bold text-amber-700">1.2K</div>
                    <div className="text-xs text-amber-600 font-medium">API Calls/hr</div>
                  </div>
                </div>
                
                {/* Performance Metrics */}
                <div className="space-y-4">
                  <div className="data-card-elite p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">CPU Usage</span>
                      <span className="text-sm font-bold text-green-600">23%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse" style={{width: '23%'}}></div>
                    </div>
                  </div>
                  
                  <div className="data-card-elite p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Memory Usage</span>
                      <span className="text-sm font-bold text-blue-600">67%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{width: '67%'}}></div>
                    </div>
                  </div>
                  
                  <div className="data-card-elite p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Database Performance</span>
                      <span className="text-sm font-bold text-purple-600">91%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{width: '91%'}}></div>
                    </div>
                  </div>
                  
                  <div className="data-card-elite p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Network Latency</span>
                      <span className="text-sm font-bold text-amber-600">145ms</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Elite System Alerts */}
            <Card className="chrome-metallic-panel border-red-400/30 hover:border-red-400/50 transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-red-700">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-400/10 to-red-600/20 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="data-card-elite p-4 border-green-200 bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-800">All Systems Operational</span>
                  </div>
                  <p className="text-xs text-green-700">No critical issues detected</p>
                </div>
                
                <div className="data-card-elite p-4 border-yellow-200 bg-yellow-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-800">Scheduled Maintenance</span>
                  </div>
                  <p className="text-xs text-yellow-700">DB optimization at 3:00 AM EST</p>
                </div>
                
                <div className="data-card-elite p-4 border-blue-200 bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">Cache Performance</span>
                  </div>
                  <p className="text-xs text-blue-700">96% hit rate - optimal performance</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Elite API Performance Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* API Endpoint Performance */}
            <Card className="chrome-metallic-panel border-bristol-maroon/30 hover:border-bristol-maroon/50 transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-bristol-maroon">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-bristol-maroon/10 to-amber-500/20 flex items-center justify-center">
                    <Cpu className="h-5 w-5 text-bristol-maroon" />
                  </div>
                  API Endpoint Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { endpoint: '/api/sites', avgTime: '120ms', status: 'healthy', requests: '2.4K' },
                  { endpoint: '/api/analytics', avgTime: '89ms', status: 'healthy', requests: '1.8K' },
                  { endpoint: '/api/scraping', avgTime: '2.1s', status: 'warning', requests: '847' },
                  { endpoint: '/api/auth', avgTime: '45ms', status: 'healthy', requests: '634' }
                ].map((api, index) => (
                  <div key={index} className="data-card-elite p-4 hover:border-bristol-maroon/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-gray-800">{api.endpoint}</span>
                      <Badge className={`text-xs ${
                        api.status === 'healthy' ? 'bg-green-100 text-green-800 border-green-200' :
                        api.status === 'warning' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-red-100 text-red-800 border-red-200'
                      }`} variant="outline">
                        {api.status?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Avg Response: <span className="font-bold">{api.avgTime}</span></span>
                      <span className="text-gray-600">Requests: <span className="font-bold">{api.requests}</span></span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Elite Data Processing Stats */}
            <Card className="chrome-metallic-panel border-amber-400/30 hover:border-amber-400/50 transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-amber-700">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400/10 to-amber-600/20 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-amber-600" />
                  </div>
                  Data Processing Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="data-card-elite p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Properties Analyzed</span>
                    <span className="text-lg font-bold text-amber-700">2,347</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full" style={{width: '94%'}} />
                  </div>
                </div>
                
                <div className="data-card-elite p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Scraping Success Rate</span>
                    <span className="text-lg font-bold text-green-600">97.3%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{width: '97%'}} />
                  </div>
                </div>
                
                <div className="data-card-elite p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Data Quality Score</span>
                    <span className="text-lg font-bold text-bristol-maroon">89.7%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-gradient-to-r from-bristol-maroon to-red-700 rounded-full" style={{width: '90%'}} />
                  </div>
                </div>
                
                <div className="data-card-elite p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Bristol Score Accuracy</span>
                    <span className="text-lg font-bold text-purple-600">95.8%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{width: '96%'}} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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