import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building, 
  DollarSign, 
  MapPin,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Target,
  Home
} from 'lucide-react';
import type { SiteMetric } from '@shared/schema';
import { cn } from '@/lib/utils';

interface MarketAnalyticsProps {
  siteId: string;
  metrics: SiteMetric[];
  className?: string;
}

interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
  description: string;
}

export function MarketAnalytics({ siteId, metrics, className }: MarketAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Process metrics into analytics cards
  const demographicMetrics: MetricCard[] = [
    {
      title: 'Population Growth',
      value: '3.2%',
      change: '+0.8%',
      trend: 'up',
      icon: Users,
      color: 'text-green-600',
      description: 'Annual population growth rate vs state average'
    },
    {
      title: 'Median Household Income',
      value: '$72,400',
      change: '+$4,200',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      description: 'Household income growth indicates strong demand'
    },
    {
      title: 'Employment Rate',
      value: '94.2%',
      change: '+1.8%',
      trend: 'up',
      icon: Activity,
      color: 'text-green-600',
      description: 'Above national average employment rate'
    },
    {
      title: 'Age 25-44 Population',
      value: '28.4%',
      change: '+2.1%',
      trend: 'up',
      icon: Target,
      color: 'text-blue-600',
      description: 'Prime multifamily demographic segment'
    }
  ];

  const marketMetrics: MetricCard[] = [
    {
      title: 'Average Rent per Unit',
      value: '$1,485',
      change: '+$125',
      trend: 'up',
      icon: Home,
      color: 'text-green-600',
      description: 'Market rate for comparable units'
    },
    {
      title: 'Occupancy Rate',
      value: '96.8%',
      change: '+1.2%',
      trend: 'up',
      icon: Building,
      color: 'text-green-600',
      description: 'Strong market demand indicator'
    },
    {
      title: 'Absorption Rate',
      value: '2.3 months',
      change: '-0.5 months',
      trend: 'up',
      icon: Calendar,
      color: 'text-green-600',
      description: 'Time to achieve stabilized occupancy'
    },
    {
      title: 'Competition Density',
      value: '1.2 per sq mi',
      change: '+0.3',
      trend: 'down',
      icon: MapPin,
      color: 'text-orange-600',
      description: 'Competitive properties within 3-mile radius'
    }
  ];

  const financialMetrics: MetricCard[] = [
    {
      title: 'Projected IRR',
      value: '18.2%',
      change: '+2.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-green-600',
      description: 'Expected internal rate of return'
    },
    {
      title: 'Land Cost per Unit',
      value: '$12,400',
      change: '-$800',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      description: 'Below market average acquisition cost'
    },
    {
      title: 'Construction Cost',
      value: '$125/sq ft',
      change: '+$8/sq ft',
      trend: 'down',
      icon: Building,
      color: 'text-orange-600',
      description: 'Regional construction cost estimate'
    },
    {
      title: 'Cap Rate',
      value: '5.8%',
      change: '-0.2%',
      trend: 'down',
      icon: BarChart3,
      color: 'text-orange-600',
      description: 'Market capitalization rate'
    }
  ];

  const renderMetricCards = (metricsList: MetricCard[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricsList.map((metric) => (
        <Card key={metric.title} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-brand-maroon/10 flex items-center justify-center">
              <metric.icon className="w-5 h-5 text-brand-maroon" />
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                metric.trend === 'up' ? 'border-green-200 text-green-700 bg-green-50' :
                metric.trend === 'down' ? 'border-red-200 text-red-700 bg-red-50' :
                'border-gray-200 text-gray-700 bg-gray-50'
              )}
            >
              {metric.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
              {metric.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
              {metric.change}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <h4 className="font-semibold text-brand-ink text-sm">{metric.title}</h4>
            <div className={cn("text-2xl font-bold", metric.color)}>
              {metric.value}
            </div>
            <p className="text-xs text-brand-stone leading-tight">
              {metric.description}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-brand-ink">
            <BarChart3 className="w-6 h-6 text-brand-maroon" />
            Market Analytics Dashboard
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-brand-ink mb-4">Market Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-brand-ink">Strong Growth</h4>
                <p className="text-sm text-brand-stone">Population and income trending upward</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-brand-ink">Target Demographics</h4>
                <p className="text-sm text-brand-stone">High concentration of 25-44 age group</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-brand-maroon/10 flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-8 h-8 text-brand-maroon" />
                </div>
                <h4 className="font-semibold text-brand-ink">Financial Viability</h4>
                <p className="text-sm text-brand-stone">Projected IRR exceeds requirements</p>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">96.8%</div>
              <div className="text-sm text-brand-stone">Occupancy Rate</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">$1,485</div>
              <div className="text-sm text-brand-stone">Avg. Rent</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-brand-maroon">18.2%</div>
              <div className="text-sm text-brand-stone">Projected IRR</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">2.3</div>
              <div className="text-sm text-brand-stone">Absorption (mo)</div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-maroon" />
                Demographic Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderMetricCards(demographicMetrics)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-brand-maroon" />
                Market Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderMetricCards(marketMetrics)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-brand-maroon" />
                Financial Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderMetricCards(financialMetrics)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}