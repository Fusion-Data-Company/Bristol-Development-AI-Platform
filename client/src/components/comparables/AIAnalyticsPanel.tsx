import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  BarChart3,
  Zap,
  Brain,
  Target
} from 'lucide-react';

interface CompRecord {
  id: string;
  source: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  assetType: string;
  subtype?: string;
  units?: number;
  yearBuilt?: number;
  rentPsf?: number;
  rentPu?: number;
  occupancyPct?: number;
  concessionPct?: number;
  amenityTags?: string[];
}

interface AIAnalyticsPanelProps {
  data: CompRecord[];
}

export function AIAnalyticsPanel({ data }: AIAnalyticsPanelProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('overview');

  // Calculate advanced analytics
  const analytics = useMemo(() => {
    if (!data.length) return null;

    const validRentPsf = data.filter(d => d.rentPsf && d.rentPsf > 0);
    const validOccupancy = data.filter(d => d.occupancyPct && d.occupancyPct > 0);
    const validUnits = data.filter(d => d.units && d.units > 0);
    const validYearBuilt = data.filter(d => d.yearBuilt && d.yearBuilt > 1900);

    const avgRentPsf = validRentPsf.reduce((sum, d) => sum + (d.rentPsf || 0), 0) / validRentPsf.length;
    const avgOccupancy = validOccupancy.reduce((sum, d) => sum + (d.occupancyPct || 0), 0) / validOccupancy.length;
    const totalUnits = validUnits.reduce((sum, d) => sum + (d.units || 0), 0);
    const avgYearBuilt = validYearBuilt.reduce((sum, d) => sum + (d.yearBuilt || 0), 0) / validYearBuilt.length;

    // Market position analysis
    const rentQuartiles = validRentPsf.map(d => d.rentPsf!).sort((a, b) => a - b);
    const q1Index = Math.floor(rentQuartiles.length * 0.25);
    const q3Index = Math.floor(rentQuartiles.length * 0.75);
    const q1Rent = rentQuartiles[q1Index];
    const q3Rent = rentQuartiles[q3Index];

    // Asset type distribution
    const assetTypes = data.reduce((acc, d) => {
      acc[d.assetType] = (acc[d.assetType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Subtype distribution
    const subtypes = data.reduce((acc, d) => {
      if (d.subtype) {
        acc[d.subtype] = (acc[d.subtype] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Popular amenities
    const amenityCount = data.reduce((acc, d) => {
      d.amenityTags?.forEach(amenity => {
        acc[amenity] = (acc[amenity] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topAmenities = Object.entries(amenityCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      overview: {
        avgRentPsf: avgRentPsf || 0,
        avgOccupancy: avgOccupancy || 0,
        totalUnits,
        avgYearBuilt: Math.round(avgYearBuilt || 0),
        propertyCount: data.length
      },
      marketPosition: {
        q1Rent: q1Rent || 0,
        q3Rent: q3Rent || 0,
        medianRent: rentQuartiles[Math.floor(rentQuartiles.length / 2)] || 0
      },
      distributions: {
        assetTypes,
        subtypes,
        topAmenities
      }
    };
  }, [data]);

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Market Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No data available for analysis</p>
            <p className="text-sm">Add comparable properties to see AI insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { overview, marketPosition, distributions } = analytics;

  return (
    <Card className="bg-gradient-to-br from-slate-50 via-white to-brand-gold/5 shadow-xl border border-brand-gold/20">
      <CardHeader className="pb-4 border-b border-brand-gold/10">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-brand-maroon to-brand-gold rounded-xl shadow-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-cinzel font-bold text-brand-maroon">AI Market Analytics</div>
              <div className="text-sm text-brand-stone">Live Intelligence Dashboard</div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-brand-maroon/10 text-brand-maroon border-brand-maroon/20">
            Live Analysis
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-8">
          {/* Key Metrics Grid - Clean & Spacious */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white/90 rounded-2xl border border-brand-gold/10 shadow-lg">
              <DollarSign className="h-6 w-6 text-brand-maroon mx-auto mb-3" />
              <div className="text-3xl font-bold text-brand-maroon mb-2">
                ${overview.avgRentPsf.toFixed(2)}
              </div>
              <div className="text-sm text-brand-stone font-medium">Avg Rent/SF</div>
              <div className="text-xs text-green-600 mt-1">Market Average</div>
            </div>

            <div className="text-center p-6 bg-white/90 rounded-2xl border border-brand-gold/10 shadow-lg">
              <TrendingUp className="h-6 w-6 text-brand-maroon mx-auto mb-3" />
              <div className="text-3xl font-bold text-brand-maroon mb-2">
                {overview.avgOccupancy.toFixed(1)}%
              </div>
              <div className="text-sm text-brand-stone font-medium">Avg Occupancy</div>
              <div className="text-xs text-green-600 mt-1">Strong Market</div>
            </div>

            <div className="text-center p-6 bg-white/90 rounded-2xl border border-brand-gold/10 shadow-lg">
              <Building2 className="h-6 w-6 text-brand-maroon mx-auto mb-3" />
              <div className="text-3xl font-bold text-brand-maroon mb-2">
                {overview.totalUnits.toLocaleString()}
              </div>
              <div className="text-sm text-brand-stone font-medium">Total Units</div>
              <div className="text-xs text-brand-stone mt-1">{overview.propertyCount} Properties</div>
            </div>

            <div className="text-center p-6 bg-white/90 rounded-2xl border border-brand-gold/10 shadow-lg">
              <BarChart3 className="h-6 w-6 text-brand-maroon mx-auto mb-3" />
              <div className="text-3xl font-bold text-brand-maroon mb-2">
                {overview.avgYearBuilt}
              </div>
              <div className="text-sm text-brand-stone font-medium">Avg Year Built</div>
              <div className="text-xs text-brand-stone mt-1">Modern Stock</div>
            </div>
          </div>

          {/* Market Position Analysis - Enhanced */}
          <div className="bg-white/90 rounded-2xl border border-brand-gold/10 shadow-lg p-6">
            <h4 className="text-lg font-semibold text-brand-maroon mb-6 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Market Position Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-brand-maroon/5 rounded-xl">
                <div className="text-sm text-brand-stone mb-2">Q1 (25th percentile)</div>
                <div className="text-2xl font-bold text-brand-maroon">${marketPosition.q1Rent.toFixed(2)}</div>
                <div className="text-xs text-brand-stone">per SF</div>
              </div>
              <div className="text-center p-4 bg-brand-gold/5 rounded-xl">
                <div className="text-sm text-brand-stone mb-2">Median (50th percentile)</div>
                <div className="text-2xl font-bold text-brand-maroon">${marketPosition.medianRent.toFixed(2)}</div>
                <div className="text-xs text-brand-stone">per SF</div>
              </div>
              <div className="text-center p-4 bg-brand-maroon/5 rounded-xl">
                <div className="text-sm text-brand-stone mb-2">Q3 (75th percentile)</div>
                <div className="text-2xl font-bold text-brand-maroon">${marketPosition.q3Rent.toFixed(2)}</div>
                <div className="text-xs text-brand-stone">per SF</div>
              </div>
            </div>
          </div>

          {/* Market Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Asset Types */}
            <div className="bg-white/90 rounded-2xl border border-brand-gold/10 shadow-lg p-6">
              <h4 className="text-lg font-semibold text-brand-maroon mb-4">Asset Distribution</h4>
              <div className="space-y-4">
                {Object.entries(distributions.assetTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between py-2">
                    <span className="text-brand-stone font-medium">{type}</span>
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-200 rounded-full h-2 w-24">
                        <div 
                          className="bg-brand-maroon h-2 rounded-full"
                          style={{ width: `${(count / overview.propertyCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-brand-maroon font-bold text-sm">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white/90 rounded-2xl border border-brand-gold/10 shadow-lg p-6">
              <h4 className="text-lg font-semibold text-brand-maroon mb-4">Popular Amenities</h4>
              <div className="flex flex-wrap gap-3">
                {distributions.topAmenities.map(([amenity, count]) => (
                  <Badge key={amenity} variant="secondary" className="bg-brand-gold/20 text-brand-maroon border-brand-gold/30 text-sm py-1 px-3">
                    {amenity} ({count})
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* AI Insights - Clean Layout */}
          <div className="bg-gradient-to-r from-brand-gold/10 to-brand-maroon/10 rounded-2xl border border-brand-gold/20 p-6">
            <h4 className="text-lg font-semibold text-brand-maroon mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Company AI Market Insights
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview.avgOccupancy > 95 && (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <div className="font-medium">Strong Market Performance</div>
                    <div>High occupancy at {overview.avgOccupancy.toFixed(1)}% indicates healthy demand</div>
                  </div>
                </div>
              )}
              {overview.avgYearBuilt > 2015 && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <div className="font-medium">Modern Asset Portfolio</div>
                    <div>Average construction year {overview.avgYearBuilt} suggests premium amenities</div>
                  </div>
                </div>
              )}
              {overview.avgRentPsf > 2.50 && (
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <DollarSign className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <div className="text-sm text-purple-800">
                    <div className="font-medium">Premium Market Positioning</div>
                    <div>${overview.avgRentPsf.toFixed(2)}/SF average indicates luxury segment</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-4 bg-brand-maroon/5 rounded-xl border border-brand-maroon/20">
                <Target className="h-5 w-5 text-brand-maroon flex-shrink-0" />
                <div className="text-sm text-brand-maroon">
                  <div className="font-medium">Portfolio Coverage</div>
                  <div>Analyzing {overview.propertyCount} properties across multiple markets</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AIAnalyticsPanel;