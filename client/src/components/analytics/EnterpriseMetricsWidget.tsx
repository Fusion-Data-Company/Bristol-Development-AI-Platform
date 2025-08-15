import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building2, 
  Users, 
  Target,
  BarChart3,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  description?: string;
  type?: 'currency' | 'percentage' | 'number';
}

export function EnterpriseMetricCard({ title, value, change, trend, icon, description, type = 'number' }: MetricProps) {
  const formatValue = (val: string | number) => {
    if (type === 'currency' && typeof val === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(val);
    }
    if (type === 'percentage' && typeof val === 'number') {
      return `${val.toFixed(1)}%`;
    }
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-400';
    if (trend === 'down') return 'text-red-400';
    return 'text-bristol-cyan';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  return (
    <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl relative overflow-hidden group hover:border-bristol-gold/40 transition-all duration-300">
      {/* Animated gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-bristol-cyan/10 via-transparent to-bristol-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-bristol-cyan font-medium text-sm">{title}</CardTitle>
          <div className="text-bristol-gold">{icon}</div>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="space-y-2">
          <div className="text-3xl font-bold text-white">
            {formatValue(value)}
          </div>
          
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 text-sm", getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(change).toFixed(1)}%</span>
              <span className="text-bristol-stone text-xs">vs last period</span>
            </div>
          )}
          
          {description && (
            <p className="text-bristol-stone text-xs leading-relaxed">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PerformanceGaugeProps {
  title: string;
  value: number;
  max: number;
  target?: number;
  unit?: string;
  color?: 'cyan' | 'gold' | 'green' | 'red';
}

export function PerformanceGauge({ title, value, max, target, unit = '', color = 'cyan' }: PerformanceGaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const targetPercentage = target ? Math.min((target / max) * 100, 100) : 0;
  
  const getColorClasses = () => {
    switch (color) {
      case 'gold': return 'from-bristol-gold to-yellow-400';
      case 'green': return 'from-green-400 to-emerald-400';
      case 'red': return 'from-red-400 to-pink-400';
      default: return 'from-bristol-cyan to-blue-400';
    }
  };

  return (
    <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-bristol-cyan text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative h-4 bg-bristol-ink/60 rounded-full overflow-hidden">
            {/* Target line */}
            {target && (
              <div 
                className="absolute top-0 w-0.5 h-full bg-white/60 z-10"
                style={{ left: `${targetPercentage}%` }}
              />
            )}
            
            {/* Progress bar */}
            <div 
              className={cn("h-full bg-gradient-to-r transition-all duration-500", getColorClasses())}
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-white font-medium">
              {value.toLocaleString()}{unit}
            </span>
            <span className="text-bristol-stone">
              {percentage.toFixed(1)}%
            </span>
          </div>
          
          {target && (
            <div className="text-xs text-bristol-stone">
              Target: {target.toLocaleString()}{unit}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface MarketHeatmapProps {
  markets: Array<{
    name: string;
    performance: number;
    exposure: number;
    risk: 'low' | 'medium' | 'high';
  }>;
}

export function MarketHeatmap({ markets }: MarketHeatmapProps) {
  const getPerformanceColor = (performance: number) => {
    if (performance >= 80) return 'bg-green-500/20 border-green-500/40 text-green-300';
    if (performance >= 60) return 'bg-bristol-cyan/20 border-bristol-cyan/40 text-bristol-cyan';
    if (performance >= 40) return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300';
    return 'bg-red-500/20 border-red-500/40 text-red-300';
  };

  const getRiskIndicator = (risk: string) => {
    switch (risk) {
      case 'low': return <div className="w-2 h-2 rounded-full bg-green-400" />;
      case 'medium': return <div className="w-2 h-2 rounded-full bg-yellow-400" />;
      case 'high': return <div className="w-2 h-2 rounded-full bg-red-400" />;
      default: return <div className="w-2 h-2 rounded-full bg-bristol-stone" />;
    }
  };

  return (
    <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-bristol-cyan flex items-center gap-3">
          <Target className="h-5 w-5 text-bristol-gold" />
          Market Performance Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {markets.map((market, index) => (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 cursor-pointer",
                getPerformanceColor(market.performance)
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{market.name}</div>
                  {getRiskIndicator(market.risk)}
                </div>
                
                <div className="text-xs opacity-80">
                  Performance: {market.performance}%
                </div>
                
                <div className="text-xs opacity-80">
                  Exposure: {market.exposure} properties
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface AlertsPanelProps {
  alerts: Array<{
    type: 'opportunity' | 'risk' | 'neutral';
    title: string;
    message: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const getAlertColor = (type: string, severity: string) => {
    if (type === 'opportunity') return 'border-l-green-400 bg-green-900/20';
    if (type === 'risk' && severity === 'high') return 'border-l-red-400 bg-red-900/20';
    if (type === 'risk') return 'border-l-yellow-400 bg-yellow-900/20';
    return 'border-l-bristol-cyan bg-bristol-ink/20';
  };

  const getAlertIcon = (type: string) => {
    if (type === 'opportunity') return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (type === 'risk') return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Activity className="h-4 w-4 text-bristol-cyan" />;
  };

  return (
    <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-bristol-cyan flex items-center gap-3">
          <Activity className="h-5 w-5 text-bristol-gold" />
          Real-time Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {alerts.length > 0 ? (
            alerts.map((alert, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-lg border-l-4",
                  getAlertColor(alert.type, alert.severity)
                )}
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-white">{alert.title}</div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          alert.severity === 'high' ? 'border-red-400 text-red-300' :
                          alert.severity === 'medium' ? 'border-yellow-400 text-yellow-300' :
                          'border-bristol-cyan text-bristol-cyan'
                        )}
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-bristol-stone">{alert.message}</div>
                    <div className="text-xs text-bristol-stone/60">{alert.timestamp}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-bristol-stone mx-auto mb-2" />
              <p className="text-bristol-stone">No active alerts</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}