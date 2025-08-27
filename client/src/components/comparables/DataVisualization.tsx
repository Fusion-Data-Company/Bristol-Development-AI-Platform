import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3,
  TrendingUp,
  MapPin,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';

interface CompRecord {
  id: string;
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

interface DataVisualizationProps {
  data: CompRecord[];
}

export function DataVisualization({ data }: DataVisualizationProps) {
  const analysis = useMemo(() => {
    if (!data.length) return null;

    // Calculate metrics
    const validData = data.filter(d => d.rentPsf && d.rentPsf > 0);
    const avgRent = validData.reduce((sum, d) => sum + (d.rentPsf || 0), 0) / validData.length;
    const totalUnits = data.reduce((sum, d) => sum + (d.units || 0), 0);
    
    // Geographic distribution
    const cityDistribution = data.reduce((acc, d) => {
      const city = d.city || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Asset type distribution
    const assetTypeDistribution = data.reduce((acc, d) => {
      acc[d.assetType] = (acc[d.assetType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Year built distribution
    const yearRanges = {
      'Pre-2000': 0,
      '2000-2010': 0,
      '2010-2020': 0,
      '2020+': 0
    };
    
    data.forEach(d => {
      if (d.yearBuilt) {
        if (d.yearBuilt < 2000) yearRanges['Pre-2000']++;
        else if (d.yearBuilt < 2010) yearRanges['2000-2010']++;
        else if (d.yearBuilt < 2020) yearRanges['2010-2020']++;
        else yearRanges['2020+']++;
      }
    });

    // Rent distribution
    const rentRanges = {
      'Under $2.00': 0,
      '$2.00-$2.50': 0,
      '$2.50-$3.00': 0,
      '$3.00+': 0
    };

    validData.forEach(d => {
      if (d.rentPsf! < 2.00) rentRanges['Under $2.00']++;
      else if (d.rentPsf! < 2.50) rentRanges['$2.00-$2.50']++;
      else if (d.rentPsf! < 3.00) rentRanges['$2.50-$3.00']++;
      else rentRanges['$3.00+']++;
    });

    return {
      avgRent,
      totalUnits,
      cityDistribution,
      assetTypeDistribution,
      yearRanges,
      rentRanges
    };
  }, [data]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No data available for visualization</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...Object.values(analysis.cityDistribution));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Data Visualization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Avg Rent/SF</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              ${analysis.avgRent.toFixed(2)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Units</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {analysis.totalUnits.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Geographic Distribution
          </h4>
          <div className="space-y-2">
            {Object.entries(analysis.cityDistribution)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([city, count]) => (
                <div key={city} className="flex items-center justify-between">
                  <span className="text-sm">{city}</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-200 rounded-full h-2 w-32">
                      <div 
                        className="bg-brand-maroon h-2 rounded-full"
                        style={{ width: `${(count / maxValue) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-8">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Asset Type Distribution */}
        <div>
          <h4 className="font-semibold mb-3">Asset Type Distribution</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(analysis.assetTypeDistribution).map(([type, count]) => (
              <Badge key={type} variant="secondary">
                {type}: {count}
              </Badge>
            ))}
          </div>
        </div>

        {/* Construction Year Ranges */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Construction Year Distribution
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(analysis.yearRanges).map(([range, count]) => (
              <div key={range} className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{range}</span>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rent Distribution */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Rent/SF Distribution
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(analysis.rentRanges).map(([range, count]) => (
              <div key={range} className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{range}</span>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DataVisualization;