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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Market Analytics
          <Badge variant="secondary" className="ml-2">
            Live Analysis
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Avg Rent/SF</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                ${overview.avgRentPsf.toFixed(2)}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Market average
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Occupancy</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {overview.avgOccupancy.toFixed(1)}%
              </div>
              <div className="text-xs text-green-700 mt-1">
                Market average
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Total Units</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {overview.totalUnits.toLocaleString()}
              </div>
              <div className="text-xs text-purple-700 mt-1">
                Across {overview.propertyCount} properties
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Avg Year</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {overview.avgYearBuilt}
              </div>
              <div className="text-xs text-orange-700 mt-1">
                Average construction year
              </div>
            </div>
          </div>

          {/* Market Position Analysis */}
          <div className="bg-gradient-to-r from-bristol-maroon/5 to-bristol-gold/5 p-4 rounded-lg border">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Market Position Analysis
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Q1 (25th percentile)</div>
                <div className="font-semibold">${marketPosition.q1Rent.toFixed(2)}/SF</div>
              </div>
              <div>
                <div className="text-gray-600">Median (50th percentile)</div>
                <div className="font-semibold">${marketPosition.medianRent.toFixed(2)}/SF</div>
              </div>
              <div>
                <div className="text-gray-600">Q3 (75th percentile)</div>
                <div className="font-semibold">${marketPosition.q3Rent.toFixed(2)}/SF</div>
              </div>
            </div>
          </div>

          {/* Asset Type Distribution */}
          <div>
            <h4 className="font-semibold mb-3">Asset Type Distribution</h4>
            <div className="space-y-2">
              {Object.entries(distributions.assetTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-200 rounded-full h-2 w-20">
                      <div 
                        className="bg-bristol-maroon h-2 rounded-full"
                        style={{ width: `${(count / overview.propertyCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Amenities */}
          <div>
            <h4 className="font-semibold mb-3">Most Popular Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {distributions.topAmenities.map(([amenity, count]) => (
                <Badge key={amenity} variant="secondary" className="text-xs">
                  {amenity} ({count})
                </Badge>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-r from-bristol-gold/10 to-bristol-maroon/10 p-4 rounded-lg border border-bristol-gold/20">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-bristol-maroon" />
              AI Market Insights
            </h4>
            <div className="space-y-2 text-sm">
              {overview.avgOccupancy > 95 && (
                <div className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-3 w-3" />
                  Strong market with high occupancy rates ({overview.avgOccupancy.toFixed(1)}%)
                </div>
              )}
              {overview.avgOccupancy < 85 && (
                <div className="flex items-center gap-2 text-orange-700">
                  <TrendingDown className="h-3 w-3" />
                  Market showing vacancy concerns ({overview.avgOccupancy.toFixed(1)}% occupancy)
                </div>
              )}
              {overview.avgYearBuilt > 2015 && (
                <div className="flex items-center gap-2 text-blue-700">
                  <Building2 className="h-3 w-3" />
                  Newer construction stock (avg {overview.avgYearBuilt}) suggests modern amenities
                </div>
              )}
              {overview.avgRentPsf > 2.50 && (
                <div className="flex items-center gap-2 text-purple-700">
                  <DollarSign className="h-3 w-3" />
                  Premium market positioning (${overview.avgRentPsf.toFixed(2)}/SF avg)
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AIAnalyticsPanel;