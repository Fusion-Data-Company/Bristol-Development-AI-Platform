import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Zap, 
  Database, 
  Cpu, 
  Globe,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface RealTimeMetrics {
  timestamp: string;
  apiCalls: number;
  responseTime: number;
  errorRate: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
  status: 'healthy' | 'warning' | 'critical';
}

export function RealTimeMetricsWidget() {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [previousMetrics, setPreviousMetrics] = useState<RealTimeMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to real-time metrics stream
    const connectToMetricsStream = () => {
      const eventSource = new EventSource('/api/analytics/metrics-stream');
      
      eventSource.onopen = () => {
        setIsConnected(true);
      };
      
      eventSource.onmessage = (event) => {
        try {
          const newMetrics = JSON.parse(event.data);
          setPreviousMetrics(metrics);
          setMetrics({
            timestamp: new Date().toISOString(),
            apiCalls: newMetrics.apiCalls || 0,
            responseTime: newMetrics.performance?.avgResponseTime || 0,
            errorRate: newMetrics.performance?.errorRate || 0,
            activeConnections: newMetrics.services?.length || 0,
            memoryUsage: newMetrics.memory?.percentage || 0,
            cpuUsage: Math.random() * 100, // Simulated for demo
            status: newMetrics.status || 'healthy'
          });
        } catch (error) {
          console.error('Error parsing metrics:', error);
        }
      };
      
      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        // Reconnect after 5 seconds
        setTimeout(connectToMetricsStream, 5000);
      };
      
      return eventSource;
    };

    const eventSource = connectToMetricsStream();
    
    return () => {
      eventSource.close();
    };
  }, [metrics]);

  const getTrendIcon = (current: number, previous: number | undefined) => {
    if (!previous) return <Minus className="h-3 w-3 text-gray-400" />;
    if (current > previous) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!metrics) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-Time Metrics
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
              Connecting...
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bristol-maroon"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-Time Metrics
          <Badge className={getStatusColor(metrics.status)}>
            {isConnected ? 'Live' : 'Disconnected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Response Time</span>
              </div>
              {getTrendIcon(metrics.responseTime, previousMetrics?.responseTime)}
            </div>
            <div className="text-2xl font-bold text-bristol-maroon">
              {metrics.responseTime}ms
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">API Calls</span>
              </div>
              {getTrendIcon(metrics.apiCalls, previousMetrics?.apiCalls)}
            </div>
            <div className="text-2xl font-bold text-bristol-maroon">
              {metrics.apiCalls.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              <span className="text-sm text-gray-600">{metrics.memoryUsage}%</span>
            </div>
            <Progress value={metrics.memoryUsage} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium">Error Rate</span>
              </div>
              <span className="text-sm text-gray-600">{metrics.errorRate.toFixed(2)}%</span>
            </div>
            <Progress 
              value={metrics.errorRate} 
              className="h-2"
              // Custom color for error rate - red when high
            />
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between p-2 rounded bg-gray-50">
          <span className="text-sm font-medium">Active Connections</span>
          <span className="text-sm font-bold text-bristol-maroon">
            {metrics.activeConnections}
          </span>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 text-center">
          Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}