import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  Zap,
  Shield,
  Database,
  Cpu,
  RefreshCw,
  Download
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PerformanceData {
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    slowestEndpoints: any[];
    fastestEndpoints: any[];
  };
  trends: {
    requestsOverTime: { timestamp: string; count: number }[];
    responseTimeOverTime: { timestamp: string; averageTime: number }[];
  };
  profiles: any[];
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  apiCalls: number;
  errors: number;
  services: any[];
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  performance: {
    avgResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  };
}

export function EnterprisePerformanceMonitor() {
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: performanceData, refetch: refetchPerformance } = useQuery<PerformanceData>({
    queryKey: ['/api/analytics/performance'],
    refetchInterval: autoRefresh ? 30000 : false
  });

  const { data: systemHealth, refetch: refetchHealth } = useQuery<SystemHealth>({
    queryKey: ['/api/analytics/system-health'],
    refetchInterval: autoRefresh ? 15000 : false
  });

  const { data: alerts } = useQuery({
    queryKey: ['/api/analytics/performance-alerts'],
    refetchInterval: autoRefresh ? 30000 : false
  });

  const handleRefresh = () => {
    refetchPerformance();
    refetchHealth();
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/analytics/export-metrics?format=${format}`);
      const data = await response.text();
      
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brand-performance-metrics.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'text-green-600';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600';
      case 'critical':
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return <CheckCircle className={`h-4 w-4 ${getStatusColor(status)}`} />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className={`h-4 w-4 ${getStatusColor(status)}`} />;
      case 'critical':
      case 'down':
        return <AlertTriangle className={`h-4 w-4 ${getStatusColor(status)}`} />;
      default:
        return <Activity className={`h-4 w-4 ${getStatusColor(status)}`} />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand-maroon" />
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
          {systemHealth && (
            <Badge className={`${getStatusColor(systemHealth.status)} border-current`} variant="outline">
              {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {alerts && Array.isArray(alerts) && alerts.length > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-800">Performance Alerts</h3>
            </div>
            <div className="space-y-1">
              {Array.isArray(alerts) && alerts.map((alert: any, index: number) => (
                <div key={index} className="text-sm text-red-700">
                  <span className="font-medium">{alert.type}:</span> {alert.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {systemHealth && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Uptime
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-brand-maroon">
                    {systemHealth.uptime.toFixed(1)}h
                  </div>
                  <div className="text-xs text-gray-600">
                    {systemHealth.performance.requestsPerSecond.toFixed(1)} req/s
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    API Calls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-brand-maroon">
                    {systemHealth.apiCalls.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {systemHealth.errors} errors
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Response Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-brand-maroon">
                    {systemHealth.performance.avgResponseTime}ms
                  </div>
                  <div className="text-xs text-gray-600">
                    Average response
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    Memory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-brand-maroon">
                    {systemHealth.memory.percentage}%
                  </div>
                  <div className="text-xs text-gray-600">
                    {systemHealth.memory.used}MB / {systemHealth.memory.total}MB
                  </div>
                  <Progress value={systemHealth.memory.percentage} className="mt-2" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Performance Trends */}
          {performanceData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Request Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={performanceData.trends.requestsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} />
                      <YAxis />
                      <Tooltip labelFormatter={formatTimestamp} />
                      <Line type="monotone" dataKey="count" stroke="#8B2635" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response Time Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={performanceData.trends.responseTimeOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} />
                      <YAxis />
                      <Tooltip labelFormatter={formatTimestamp} />
                      <Line type="monotone" dataKey="averageTime" stroke="#D4A574" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          {systemHealth && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemHealth.services.map((service, index) => (
                <Card key={index} className="relative">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(service.status)}
                        {service.name}
                      </div>
                      <Badge className={`${getStatusColor(service.status)} border-current`} variant="outline">
                        {service.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {service.responseTime && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Response Time:</span>
                          <span className="font-medium">{service.responseTime}ms</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Requests:</span>
                        <span className="font-medium">{service.requests || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Errors:</span>
                        <span className="font-medium">{service.errors || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Check:</span>
                        <span className="font-medium text-xs">
                          {new Date(service.lastCheck).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {performanceData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-brand-maroon">
                      {performanceData.summary.totalRequests.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-brand-maroon">
                      {performanceData.summary.averageResponseTime}ms
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-brand-maroon">
                      {performanceData.summary.errorRate.toFixed(2)}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-6">
          {performanceData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    Slowest Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {performanceData.summary.slowestEndpoints.map((endpoint, index) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded bg-gray-50">
                        <div className="text-sm font-medium truncate">{endpoint.endpoint}</div>
                        <div className="text-sm text-red-600 font-medium">
                          {Math.round(endpoint.averageTime)}ms
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Fastest Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {performanceData.summary.fastestEndpoints.map((endpoint, index) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded bg-gray-50">
                        <div className="text-sm font-medium truncate">{endpoint.endpoint}</div>
                        <div className="text-sm text-green-600 font-medium">
                          {Math.round(endpoint.averageTime)}ms
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}