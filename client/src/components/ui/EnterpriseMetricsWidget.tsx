import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  DollarSign, 
  Users, 
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface EnterpriseMetrics {
  portfolioValue: number;
  portfolioGrowth: number;
  totalSites: number;
  activeDevelopments: number;
  totalUnits: number;
  occupancyRate: number;
  avgBristolScore: number;
  revenueGrowth: number;
  marketShare: number;
  aiAnalyses: number;
}

export function EnterpriseMetricsWidget() {
  const { data: metrics, isLoading } = useQuery<EnterpriseMetrics>({
    queryKey: ['/api/analytics/enterprise-metrics'],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading || !metrics) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Enterprise Metrics
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

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-bristol-maroon" />
            Enterprise Metrics
          </div>
          <Badge className="bg-bristol-maroon text-white">Live Data</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-bristol-maroon" />
              <span className="text-sm font-medium text-gray-600">Portfolio Value</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-bristol-maroon">
                {formatCurrency(metrics.portfolioValue)}
              </span>
              <div className="flex items-center gap-1">
                {getGrowthIcon(metrics.portfolioGrowth)}
                <span className={`text-sm font-medium ${getGrowthColor(metrics.portfolioGrowth)}`}>
                  {formatPercentage(metrics.portfolioGrowth)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-bristol-maroon" />
              <span className="text-sm font-medium text-gray-600">Revenue Growth</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-bristol-maroon">
                {formatPercentage(metrics.revenueGrowth)}
              </span>
              {getGrowthIcon(metrics.revenueGrowth)}
            </div>
          </div>
        </div>

        {/* Portfolio Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-bristol-maroon">{metrics.totalSites}</div>
            <div className="text-sm text-gray-600">Total Sites</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-bristol-maroon">{metrics.activeDevelopments}</div>
            <div className="text-sm text-gray-600">Active Developments</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-bristol-maroon">{metrics.totalUnits.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Units</div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-bristol-maroon" />
                <span className="text-sm font-medium">Occupancy Rate</span>
              </div>
              <span className="text-sm font-bold">{metrics.occupancyRate}%</span>
            </div>
            <Progress value={metrics.occupancyRate} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-bristol-maroon" />
                <span className="text-sm font-medium">Bristol Score</span>
              </div>
              <span className="text-sm font-bold">{metrics.avgBristolScore}/100</span>
            </div>
            <Progress value={metrics.avgBristolScore} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-bristol-maroon" />
                <span className="text-sm font-medium">Market Share</span>
              </div>
              <span className="text-sm font-bold">{metrics.marketShare}%</span>
            </div>
            <Progress value={metrics.marketShare} className="h-2" />
          </div>
        </div>

        {/* AI Analytics */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-bristol-maroon" />
              <span className="text-sm font-medium text-gray-600">AI Analyses Completed</span>
            </div>
            <span className="text-lg font-bold text-bristol-maroon">
              {metrics.aiAnalyses.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}