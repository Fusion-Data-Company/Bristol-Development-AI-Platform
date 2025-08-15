import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Shield,
  Database,
  Zap,
  Target,
  BarChart3,
  Cpu,
  Globe,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import SimpleChrome from '@/components/brand/SimpleChrome';

interface DashboardMetrics {
  totalSites: number;
  totalUnits: number;
  avgBristolScore: number;
  portfolioValue: number;
  activeScrapes: number;
  completedAnalyses: number;
  systemUptime: number;
  apiCalls: number;
}

interface MarketInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'market' | 'financial' | 'regulatory' | 'competitive';
  timestamp: string;
  actionRequired: boolean;
}

interface ActiveProject {
  id: string;
  name: string;
  location: string;
  status: 'analysis' | 'underwriting' | 'due-diligence' | 'closing';
  bristolScore: number;
  units: number;
  irr: number;
  lastUpdate: string;
}

export default function EnterpriseDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: metrics } = useQuery({
    queryKey: ['/api/analytics/enterprise-metrics']
  });

  const { data: insights } = useQuery({
    queryKey: ['/api/analytics/market-insights']
  });

  const { data: projects } = useQuery({
    queryKey: ['/api/analytics/active-projects']
  });

  const { data: systemHealth } = useQuery({
    queryKey: ['/api/analytics/system-health']
  });

  // Mock data for demonstration
  const dashboardMetrics: DashboardMetrics = {
    totalSites: 46,
    totalUnits: 9953,
    avgBristolScore: 78.5,
    portfolioValue: 2840000000,
    activeScrapes: 12,
    completedAnalyses: 234,
    systemUptime: 99.97,
    apiCalls: 45782
  };

  const marketInsights: MarketInsight[] = [
    {
      id: '1',
      title: 'Sunbelt Migration Accelerating',
      description: 'Population growth in target markets up 3.2% YoY, driving multifamily demand',
      impact: 'high',
      category: 'market',
      timestamp: '2 hours ago',
      actionRequired: true
    },
    {
      id: '2',
      title: 'Interest Rate Environment Stabilizing',
      description: 'Fed signals potential rate cuts in Q2, improving acquisition financing',
      impact: 'high',
      category: 'financial',
      timestamp: '4 hours ago',
      actionRequired: false
    },
    {
      id: '3',
      title: 'New Zoning Regulations - Nashville',
      description: 'Nashville Metro announces density bonuses for affordable housing components',
      impact: 'medium',
      category: 'regulatory',
      timestamp: '6 hours ago',
      actionRequired: true
    }
  ];

  const activeProjects: ActiveProject[] = [
    {
      id: '1',
      name: 'Meridian Crossing',
      location: 'Austin, TX',
      status: 'underwriting',
      bristolScore: 85,
      units: 324,
      irr: 16.8,
      lastUpdate: '1 hour ago'
    },
    {
      id: '2',
      name: 'Riverside Commons',
      location: 'Nashville, TN',
      status: 'due-diligence',
      bristolScore: 82,
      units: 289,
      irr: 14.2,
      lastUpdate: '3 hours ago'
    },
    {
      id: '3',
      name: 'Park Avenue Residences',
      location: 'Charlotte, NC',
      status: 'analysis',
      bristolScore: 79,
      units: 198,
      irr: 13.9,
      lastUpdate: '2 hours ago'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analysis': return 'bg-blue-500';
      case 'underwriting': return 'bg-yellow-500';
      case 'due-diligence': return 'bg-orange-500';
      case 'closing': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <SimpleChrome title="Enterprise Dashboard">
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enterprise Command Center</h1>
          <p className="text-gray-600">Real-time intelligence for Bristol Development Group operations</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Portfolio Sites</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardMetrics.totalSites}</p>
                  <p className="text-sm text-green-600 mt-1">+12% this quarter</p>
                </div>
                <Building2 className="h-12 w-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Units</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardMetrics.totalUnits.toLocaleString()}</p>
                  <p className="text-sm text-green-600 mt-1">+8% this quarter</p>
                </div>
                <Users className="h-12 w-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Bristol Score</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardMetrics.avgBristolScore}</p>
                  <p className="text-sm text-green-600 mt-1">+2.3 pts this month</p>
                </div>
                <Target className="h-12 w-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                  <p className="text-3xl font-bold text-gray-900">${(dashboardMetrics.portfolioValue / 1000000000).toFixed(1)}B</p>
                  <p className="text-sm text-green-600 mt-1">+15% YoY</p>
                </div>
                <DollarSign className="h-12 w-12 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Active Projects</TabsTrigger>
            <TabsTrigger value="insights">Market Intelligence</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">System Uptime</span>
                      <span className="text-sm font-medium">{dashboardMetrics.systemUptime}%</span>
                    </div>
                    <Progress value={dashboardMetrics.systemUptime} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">API Response Time</span>
                      <span className="text-sm font-medium">142ms avg</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{dashboardMetrics.activeScrapes}</p>
                      <p className="text-sm text-gray-600">Active Scrapes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{dashboardMetrics.apiCalls.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">API Calls Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Globe className="h-4 w-4 mr-2" />
                    Launch New Site Analysis
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Portfolio Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Update Market Data
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Cpu className="h-4 w-4 mr-2" />
                    Configure AI Agents
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Development Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`} />
                        <div>
                          <h3 className="font-semibold text-gray-900">{project.name}</h3>
                          <p className="text-sm text-gray-600 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {project.location} • {project.units} units
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline">Score: {project.bristolScore}</Badge>
                          <Badge variant="outline">IRR: {project.irr}%</Badge>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {project.lastUpdate}
                        </p>
                      </div>
                      
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Intelligence Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marketInsights.map((insight) => (
                    <div key={insight.id} className="border-l-4 border-l-blue-500 pl-4 py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                            <Badge className={getImpactColor(insight.impact)}>
                              {insight.impact} impact
                            </Badge>
                            {insight.actionRequired && (
                              <Badge variant="destructive">Action Required</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {insight.timestamp}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    Security Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Authentication System</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Encryption</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Rate Limiting</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Backup Systems</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    Data Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Connectivity</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real-time Sync</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Validation</span>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cache Performance</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SimpleChrome>
  );
}