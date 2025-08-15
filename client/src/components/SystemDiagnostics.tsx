import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BarChart3, Bot, Cpu, Database, Globe, MemoryStick, RefreshCw, Server, Zap } from 'lucide-react';

interface SystemMetrics {
  timestamp: number;
  system: {
    memory: {
      avg: number;
      max: number;
      count: number;
    };
    eventLoopLag: {
      avg: number;
      max: number;
      count: number;
    };
  };
  agents: Record<string, any>;
  apis: Record<string, any>;
  overview: {
    totalMetrics: number;
    activeTimers: number;
  };
  recommendations: string[];
  status: string;
}

interface HealthCheck {
  overall: string;
  services: {
    database: { status: string; details: any };
    mcp: { status: string; details: any };
    agents: { status: string; details: any };
    memory: { status: string; details: any };
  };
  timestamp: string;
}

export function SystemDiagnostics() {
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch performance metrics
  const { data: metrics, refetch: refetchMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/performance-metrics'],
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchOnWindowFocus: false,
  });

  // Fetch health status
  const { data: health, refetch: refetchHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/health'],
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchOnWindowFocus: false,
  });

  // Fetch agent status
  const { data: agentStatus, refetch: refetchAgents, isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/agents/status'],
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchOnWindowFocus: false,
  });

  const handleRefreshAll = () => {
    refetchMetrics();
    refetchHealth();
    refetchAgents();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'excellent':
      case 'ok':
        return 'bg-green-500';
      case 'warning':
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (metricsLoading && healthLoading && agentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-gray-600">Loading system diagnostics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Diagnostics</h2>
          <p className="text-gray-600">Real-time performance monitoring and system health</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="flex items-center space-x-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center space-x-1"
          >
            <Activity className="h-4 w-4" />
            <span>{autoRefresh ? 'Live' : 'Manual'}</span>
          </Button>
        </div>
      </div>

      {/* Overall Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Server className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(health?.overall || 'unknown')}`} />
              <span className="text-2xl font-bold capitalize">
                {health?.overall || 'Unknown'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Overall system status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.system?.memory?.avg ? formatBytes(metrics.system.memory.avg * 1024 * 1024) : 'N/A'}
            </div>
            <Progress 
              value={metrics?.system?.memory?.avg ? Math.min((metrics.system.memory.avg / 512) * 100, 100) : 0}
              className="mt-2"
            />
            <p className="text-xs text-gray-600 mt-1">
              of 512 MB limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agentStatus?.status?.activeAgents || 0}/{agentStatus?.status?.totalAgents || 6}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Bristol AI agents online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agentStatus?.status?.averageResponseTime || 'N/A'}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Average agent response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {health?.services && Object.entries(health.services).map(([serviceName, serviceData]) => (
              <Card key={serviceName}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(serviceData.status)}`} />
                    <span className="capitalize">{serviceName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={serviceData.status === 'healthy' ? 'default' : 'destructive'}>
                    {serviceData.status}
                  </Badge>
                  {serviceData.details && (
                    <div className="mt-2 text-sm text-gray-600">
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(serviceData.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MemoryStick className="h-4 w-4" />
                  <span>Memory Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average:</span>
                  <span className="text-sm font-medium">
                    {metrics?.system?.memory?.avg ? formatBytes(metrics.system.memory.avg * 1024 * 1024) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Peak:</span>
                  <span className="text-sm font-medium">
                    {metrics?.system?.memory?.max ? formatBytes(metrics.system.memory.max * 1024 * 1024) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Samples:</span>
                  <span className="text-sm font-medium">
                    {metrics?.system?.memory?.count || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4" />
                  <span>Event Loop</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Lag:</span>
                  <span className="text-sm font-medium">
                    {metrics?.system?.eventLoopLag?.avg ? formatMs(metrics.system.eventLoopLag.avg) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Lag:</span>
                  <span className="text-sm font-medium">
                    {metrics?.system?.eventLoopLag?.max ? formatMs(metrics.system.eventLoopLag.max) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Samples:</span>
                  <span className="text-sm font-medium">
                    {metrics?.system?.eventLoopLag?.count || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Metrics:</span>
                  <span className="text-sm font-medium">
                    {metrics?.overview?.totalMetrics || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Timers:</span>
                  <span className="text-sm font-medium">
                    {metrics?.overview?.activeTimers || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant="default">
                    {metrics?.status || 'Unknown'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentStatus?.status?.performance && Object.entries(agentStatus.status.performance).map(([agentId, agentData]: [string, any]) => (
              <Card key={agentId}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <span className="capitalize">{agentId.replace('-', ' ')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(agentData).map(([operation, stats]: [string, any]) => (
                      <div key={operation} className="flex justify-between">
                        <span className="text-sm text-gray-600 capitalize">
                          {operation.replace('_', ' ')}:
                        </span>
                        <span className="text-sm font-medium">
                          {stats?.avg ? formatMs(stats.avg) : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Performance Recommendations</span>
              </CardTitle>
              <CardDescription>
                System optimization suggestions based on current metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.recommendations?.length > 0 ? (
                <div className="space-y-2">
                  {metrics.recommendations.map((recommendation: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-blue-800">{recommendation}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>System is running optimally!</p>
                  <p className="text-sm">No performance recommendations at this time.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}