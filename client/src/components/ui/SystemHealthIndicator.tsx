import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  apiCalls: number;
  errors: number;
  services: {
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime?: number;
  }[];
}

export function SystemHealthIndicator() {
  const { data: health, isLoading } = useQuery<SystemHealth>({
    queryKey: ['/api/analytics/system-health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading || !health) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-maroon"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
      case 'down':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(health.status)}
          System Health
          <Badge className={getStatusColor(health.status)}>
            {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-maroon">
              {Math.round(health.uptime)}%
            </div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-maroon">
              {health.apiCalls.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">API Calls</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-maroon">
              {health.errors}
            </div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
        </div>

        {/* Service Status */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Services</h4>
          {health.services.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                {getStatusIcon(service.status)}
                <span className="font-medium">{service.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {service.responseTime && (
                  <span className="text-sm text-gray-600">
                    {service.responseTime}ms
                  </span>
                )}
                <Badge className={getStatusColor(service.status)} variant="outline">
                  {service.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}