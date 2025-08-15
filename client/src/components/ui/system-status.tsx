import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Database, 
  Brain, 
  Server, 
  MemoryStick,
  Clock,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemStatusProps {
  className?: string;
}

interface SystemStatusData {
  services?: Record<string, any>;
  circuitBreakers?: Array<any>;
  recommendations?: string[];
  timestamp?: string;
}

export function SystemStatus({ className }: SystemStatusProps) {
  const { data: systemStatus, isLoading } = useQuery<SystemStatusData>({
    queryKey: ['/api/system-status'],
    refetchInterval: 10000 // Update every 10 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'unhealthy': return XCircle;
      default: return AlertTriangle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'unhealthy': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case 'database': return Database;
      case 'agents': return Brain;
      case 'mcp': return Server;
      case 'memory': return MemoryStick;
      default: return Activity;
    }
  };

  if (isLoading || !systemStatus) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Status
          <Badge variant={systemStatus?.services?.database?.status === 'healthy' ? 'default' : 'destructive'}>
            {Object.values(systemStatus?.services || {}).every((s: any) => s?.status === 'healthy') ? 'All Healthy' : 'Issues Detected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(systemStatus?.services || {}).map(([serviceName, serviceData]: [string, any]) => {
            const StatusIcon = getStatusIcon(serviceData?.status || 'unknown');
            const ServiceIcon = getServiceIcon(serviceName);
            
            return (
              <div key={serviceName} className="flex items-center gap-2 p-3 rounded-lg border">
                <ServiceIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize truncate">{serviceName}</p>
                  <div className="flex items-center gap-1">
                    <StatusIcon className={cn("h-3 w-3", getStatusColor(serviceData?.status || 'unknown'))} />
                    <span className={cn("text-xs", getStatusColor(serviceData?.status || 'unknown'))}>
                      {serviceData?.status || 'unknown'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Detailed Service Information */}
        <div className="space-y-3">
          {Object.entries(systemStatus?.services || {}).map(([serviceName, serviceData]: [string, any]) => (
            <div key={serviceName} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium capitalize">{serviceName} Service</h4>
                <Badge variant={serviceData?.status === 'healthy' ? 'default' : 'destructive'}>
                  {serviceData?.status || 'unknown'}
                </Badge>
              </div>
              
              {/* Service-specific details */}
              {serviceName === 'memory' && serviceData?.details && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Heap Usage</span>
                    <span>{serviceData.details?.heapUsagePercent || 0}%</span>
                  </div>
                  <Progress value={serviceData.details?.heapUsagePercent || 0} className="h-2" />
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Used: {serviceData.details?.heapUsed || 0}MB</span>
                    <span>Total: {serviceData.details?.heapTotal || 0}MB</span>
                  </div>
                </div>
              )}

              {serviceName === 'database' && serviceData?.details && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Response Time</span>
                  <span>{serviceData.details?.responseTime || 0}ms</span>
                </div>
              )}

              {serviceName === 'agents' && serviceData?.details && (
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Active Agents: {serviceData.details?.activeAgents || 0}</span>
                  <span>Running Tasks: {serviceData.details?.runningTasks || 0}</span>
                </div>
              )}

              {serviceName === 'mcp' && serviceData?.details && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">MCP Servers:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(serviceData.details?.servers || {}).map(([server, status]: [string, any]) => (
                      <div key={server} className="flex justify-between text-xs">
                        <span>{server}</span>
                        <span className={status?.status === 'healthy' ? 'text-green-500' : 'text-red-500'}>
                          {status?.status || 'unknown'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {serviceData?.lastCheck && (
                <p className="text-xs text-muted-foreground">
                  Last checked: {new Date(serviceData.lastCheck).toLocaleTimeString()}
                </p>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Circuit Breakers */}
        {systemStatus?.circuitBreakers && systemStatus.circuitBreakers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Circuit Breakers
            </h4>
            <div className="space-y-1">
              {systemStatus.circuitBreakers.map((cb: any) => (
                <div key={cb?.name} className="flex justify-between items-center text-xs">
                  <span>{cb?.name}</span>
                  <Badge variant={cb?.status?.isOpen ? 'destructive' : 'default'}>
                    {cb?.status?.isOpen ? 'Open' : 'Closed'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Recommendations */}
        {systemStatus?.recommendations && systemStatus.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Recommendations
            </h4>
            <div className="space-y-1">
              {systemStatus.recommendations.map((rec: string, index: number) => (
                <p key={index} className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded">
                  {rec}
                </p>
              ))}
            </div>
          </div>
        )}

        {systemStatus?.timestamp && (
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(systemStatus.timestamp).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}