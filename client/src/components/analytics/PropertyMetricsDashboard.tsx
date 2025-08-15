import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Target,
  MapPin,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyMetric {
  id: string;
  name: string;
  market: string;
  currentValue: number;
  acquisitionCost: number;
  totalReturn: number;
  annualizedReturn: number;
  cashFlow: number;
  occupancyRate: number;
  rentPerSqFt: number;
  noiMargin: number;
  capRate: number;
  riskScore: number;
  appreciation: number;
}

interface PropertyMetricsDashboardProps {
  properties: PropertyMetric[];
  loading?: boolean;
}

export function PropertyMetricsDashboard({ properties = [], loading = false }: PropertyMetricsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof PropertyMetric>('totalReturn');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterMarket, setFilterMarket] = useState('all');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: value > 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number, decimals = 1) => {
    return `${value.toFixed(decimals)}%`;
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value >= threshold * 1.2) return 'text-green-400';
    if (value >= threshold) return 'text-bristol-gold';
    return 'text-red-400';
  };

  const getRiskBadge = (score: number) => {
    if (score <= 3) return { label: 'Low', color: 'bg-green-900/50 text-green-300 border-green-600' };
    if (score <= 6) return { label: 'Medium', color: 'bg-yellow-900/50 text-yellow-300 border-yellow-600' };
    return { label: 'High', color: 'bg-red-900/50 text-red-300 border-red-600' };
  };

  // Filter and sort properties
  const filteredProperties = properties
    .filter(prop => {
      const matchesSearch = prop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prop.market.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMarket = filterMarket === 'all' || prop.market === filterMarket;
      return matchesSearch && matchesMarket;
    })
    .sort((a, b) => {
      const aValue = a[sortBy] as number;
      const bValue = b[sortBy] as number;
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

  const uniqueMarkets = Array.from(new Set(properties.map(p => p.market)));

  const portfolioSummary = {
    totalValue: properties.reduce((sum, p) => sum + p.currentValue, 0),
    totalCashFlow: properties.reduce((sum, p) => sum + p.cashFlow, 0),
    avgReturn: properties.reduce((sum, p) => sum + p.totalReturn, 0) / properties.length,
    avgCapRate: properties.reduce((sum, p) => sum + p.capRate, 0) / properties.length,
    highPerformers: properties.filter(p => p.totalReturn > 15).length,
    riskCount: properties.filter(p => p.riskScore > 6).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bristol-cyan"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
          <CardContent className="text-center py-6">
            <div className="text-2xl font-bold text-bristol-cyan mb-1">
              {formatCurrency(portfolioSummary.totalValue)}
            </div>
            <div className="text-xs text-bristol-stone">Total Portfolio Value</div>
          </CardContent>
        </Card>

        <Card className="bg-bristol-ink/40 border-bristol-gold/30 backdrop-blur-xl">
          <CardContent className="text-center py-6">
            <div className="text-2xl font-bold text-bristol-gold mb-1">
              {formatPercentage(portfolioSummary.avgReturn)}
            </div>
            <div className="text-xs text-bristol-stone">Average Total Return</div>
          </CardContent>
        </Card>

        <Card className="bg-bristol-ink/40 border-green-600/30 backdrop-blur-xl">
          <CardContent className="text-center py-6">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {portfolioSummary.highPerformers}
            </div>
            <div className="text-xs text-bristol-stone">High Performers (&gt;15%)</div>
          </CardContent>
        </Card>

        <Card className="bg-bristol-ink/40 border-red-600/30 backdrop-blur-xl">
          <CardContent className="text-center py-6">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {portfolioSummary.riskCount}
            </div>
            <div className="text-xs text-bristol-stone">High Risk Properties</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-bristol-cyan flex items-center gap-3">
            <Building2 className="h-5 w-5 text-bristol-gold" />
            Property Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-bristol-stone" />
                <Input
                  placeholder="Search properties or markets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-bristol-ink/60 border-bristol-cyan/30 text-white"
                />
              </div>
            </div>
            
            <select
              value={filterMarket}
              onChange={(e) => setFilterMarket(e.target.value)}
              className="px-4 py-2 bg-bristol-ink/60 border border-bristol-cyan/30 rounded-lg text-white"
            >
              <option value="all">All Markets</option>
              {uniqueMarkets.map(market => (
                <option key={market} value={market}>{market}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as keyof PropertyMetric)}
              className="px-4 py-2 bg-bristol-ink/60 border border-bristol-cyan/30 rounded-lg text-white"
            >
              <option value="totalReturn">Total Return</option>
              <option value="currentValue">Value</option>
              <option value="cashFlow">Cash Flow</option>
              <option value="capRate">Cap Rate</option>
              <option value="riskScore">Risk Score</option>
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="border-bristol-cyan/30 text-bristol-cyan hover:bg-bristol-cyan/20"
            >
              {sortOrder === 'desc' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            </Button>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProperties.map((property) => {
              const riskBadge = getRiskBadge(property.riskScore);
              
              return (
                <Card 
                  key={property.id} 
                  className="bg-bristol-ink/60 border-bristol-cyan/20 backdrop-blur-xl hover:border-bristol-gold/40 transition-all duration-300 group"
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-bristol-cyan/5 via-transparent to-bristol-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
                  
                  <CardHeader className="relative pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">{property.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3 text-bristol-stone" />
                          <span className="text-bristol-stone text-sm">{property.market}</span>
                        </div>
                      </div>
                      <Badge className={cn("text-xs", riskBadge.color)}>
                        {riskBadge.label} Risk
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-bristol-ink/40 rounded-lg">
                        <div className="text-lg font-bold text-bristol-cyan">
                          {formatCurrency(property.currentValue)}
                        </div>
                        <div className="text-xs text-bristol-stone">Current Value</div>
                      </div>
                      
                      <div className="text-center p-3 bg-bristol-ink/40 rounded-lg">
                        <div className={cn(
                          "text-lg font-bold",
                          getPerformanceColor(property.totalReturn, 12)
                        )}>
                          {formatPercentage(property.totalReturn)}
                        </div>
                        <div className="text-xs text-bristol-stone">Total Return</div>
                      </div>
                    </div>
                    
                    {/* Performance Metrics */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-bristol-stone text-sm">Cash Flow:</span>
                        <span className={cn(
                          "font-medium",
                          property.cashFlow > 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {formatCurrency(property.cashFlow)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-bristol-stone text-sm">Cap Rate:</span>
                        <span className="text-bristol-gold">{formatPercentage(property.capRate)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-bristol-stone text-sm">Occupancy:</span>
                        <span className={cn(
                          "font-medium",
                          getPerformanceColor(property.occupancyRate, 90)
                        )}>
                          {formatPercentage(property.occupancyRate)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-bristol-stone text-sm">NOI Margin:</span>
                        <span className="text-bristol-cyan">{formatPercentage(property.noiMargin)}</span>
                      </div>
                    </div>
                    
                    {/* Performance Indicator */}
                    <div className="pt-2 border-t border-bristol-cyan/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-bristol-stone">Performance:</span>
                        <div className="flex items-center gap-2">
                          {property.totalReturn > 15 ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : property.totalReturn > 10 ? (
                            <Target className="h-4 w-4 text-bristol-gold" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          )}
                          <span className={cn(
                            "text-xs font-medium",
                            property.totalReturn > 15 ? "text-green-400" :
                            property.totalReturn > 10 ? "text-bristol-gold" : "text-red-400"
                          )}>
                            {property.totalReturn > 15 ? "Excellent" :
                             property.totalReturn > 10 ? "Good" : "Below Target"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {filteredProperties.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-bristol-stone mx-auto mb-4" />
              <p className="text-bristol-stone">No properties match your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}