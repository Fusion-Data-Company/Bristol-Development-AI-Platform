import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  DollarSign, 
  Users, 
  Building2,
  Activity,
  Target
} from 'lucide-react';
import Chrome from '@/components/brand/SimpleChrome';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMarket, setSelectedMarket] = useState('all');

  // Fetch dashboard analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/dashboard', { timeRange, market: selectedMarket }]
  });

  const marketData = [
    { name: 'Charlotte', value: 35, growth: 12.5 },
    { name: 'Atlanta', value: 28, growth: 8.3 },
    { name: 'Nashville', value: 22, growth: 15.2 },
    { name: 'Austin', value: 15, growth: 6.7 }
  ];

  const performanceData = [
    { month: 'Jan', bristolScore: 72, marketAvg: 65 },
    { month: 'Feb', bristolScore: 75, marketAvg: 67 },
    { month: 'Mar', bristolScore: 78, marketAvg: 68 },
    { month: 'Apr', bristolScore: 82, marketAvg: 70 },
    { month: 'May', bristolScore: 85, marketAvg: 71 },
    { month: 'Jun', bristolScore: 88, marketAvg: 73 }
  ];

  const COLORS = ['#9e1b32', '#d4a574', '#3b4d61', '#87ceeb'];

  return (
    <Chrome>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Market insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMarket} onValueChange={setSelectedMarket}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Markets</SelectItem>
              <SelectItem value="charlotte">Charlotte</SelectItem>
              <SelectItem value="atlanta">Atlanta</SelectItem>
              <SelectItem value="nashville">Nashville</SelectItem>
              <SelectItem value="austin">Austin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics as any)?.summary?.totalSites || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Bristol Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics as any)?.summary?.avgBristolScore || 0}</div>
            <Progress value={(analytics as any)?.summary?.avgBristolScore || 0} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Median Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((analytics as any)?.metrics?.medianIncome || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Target market average
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacancy Rate</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics as any)?.metrics?.vacancyRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">-2.1%</span> from last quarter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Bristol Score Trend</CardTitle>
            <CardDescription>
              Your sites vs market average over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="bristolScore" 
                  stroke="#9e1b32" 
                  name="Your Score"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="marketAvg" 
                  stroke="#d4a574" 
                  name="Market Avg"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Market Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Market Distribution</CardTitle>
            <CardDescription>
              Site distribution across target markets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={marketData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {marketData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="economics">Economics</TabsTrigger>
          <TabsTrigger value="competition">Competition</TabsTrigger>
          <TabsTrigger value="housing">Housing</TabsTrigger>
        </TabsList>

        <TabsContent value="demographics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Population Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={marketData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="growth" fill="#9e1b32" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="economics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Employment Growth</p>
                    <p className="text-2xl font-bold">{(analytics as any)?.metrics?.employmentGrowth || 0}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Job Diversity Index</p>
                    <p className="text-2xl font-bold">7.8</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">GDP Growth</p>
                    <p className="text-2xl font-bold">4.2%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Landscape</CardTitle>
              <CardDescription>
                Analysis of competing properties in your markets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Rent Premium</span>
                  <Badge className="bg-green-600">+12%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Market Saturation</span>
                  <Badge variant="secondary">Medium</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">New Supply Pipeline</span>
                  <Badge variant="outline">3,200 units</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="housing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Housing Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Rent/SF</span>
                    <span className="font-semibold">$1.85</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                    <span className="font-semibold">94.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Rent Growth YoY</span>
                    <span className="font-semibold">6.2%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Unit Size</span>
                    <span className="font-semibold">985 SF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Absorption Rate</span>
                    <span className="font-semibold">18 units/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Days on Market</span>
                    <span className="font-semibold">21 days</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </Chrome>
  );
}