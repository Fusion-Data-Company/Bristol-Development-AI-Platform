import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calculator,
  Target,
  Zap
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

interface CompAnalysisWidgetProps {
  data: CompRecord[];
}

export function CompAnalysisWidget({ data }: CompAnalysisWidgetProps) {
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  const analysis = useMemo(() => {
    if (!data.length) return null;

    const validRentData = data.filter(d => d.rentPsf && d.rentPsf > 0);
    const validOccupancyData = data.filter(d => d.occupancyPct && d.occupancyPct > 0);
    
    if (!validRentData.length) return null;

    // Calculate quartiles for rent/sf
    const rentValues = validRentData.map(d => d.rentPsf!).sort((a, b) => a - b);
    const q1Index = Math.floor(rentValues.length * 0.25);
    const q2Index = Math.floor(rentValues.length * 0.5);
    const q3Index = Math.floor(rentValues.length * 0.75);
    
    const q1 = rentValues[q1Index];
    const median = rentValues[q2Index];
    const q3 = rentValues[q3Index];
    const min = rentValues[0];
    const max = rentValues[rentValues.length - 1];
    const avg = rentValues.reduce((sum, val) => sum + val, 0) / rentValues.length;

    // Calculate occupancy metrics
    const avgOccupancy = validOccupancyData.reduce((sum, d) => sum + (d.occupancyPct || 0), 0) / validOccupancyData.length;
    
    // Market strength indicators
    const highOccupancyCount = validOccupancyData.filter(d => (d.occupancyPct || 0) > 95).length;
    const lowOccupancyCount = validOccupancyData.filter(d => (d.occupancyPct || 0) < 85).length;
    
    // Premium properties (top quartile rent)
    const premiumProperties = validRentData.filter(d => d.rentPsf! >= q3);
    
    // Value properties (bottom quartile rent)
    const valueProperties = validRentData.filter(d => d.rentPsf! <= q1);

    return {
      rent: { min, q1, median, q3, max, avg },
      occupancy: { avg: avgOccupancy, highCount: highOccupancyCount, lowCount: lowOccupancyCount },
      segments: { premium: premiumProperties, value: valueProperties },
      marketStrength: avgOccupancy > 95 ? 'Strong' : avgOccupancy > 90 ? 'Stable' : 'Soft'
    };
  }, [data]);

  if (!analysis) {
    return (
      <Card className="border-bristol-gold/20">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <Calculator className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No data for analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-bristol-gold/20 bg-gradient-to-br from-bristol-gold/5 to-bristol-maroon/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-bristol-maroon" />
            Market Analysis
          </div>
          <Badge variant="secondary" className="text-xs">
            {data.length} props
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="text-lg font-bold text-bristol-maroon">
              ${analysis.rent.median.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">Median Rent/SF</div>
          </div>
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="text-lg font-bold text-bristol-maroon">
              {analysis.occupancy.avg.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">Avg Occupancy</div>
          </div>
        </div>

        {/* Market Strength */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Market Strength:</span>
          <Badge 
            variant={analysis.marketStrength === 'Strong' ? 'default' : 'secondary'}
            className="text-xs"
          >
            <Target className="h-3 w-3 mr-1" />
            {analysis.marketStrength}
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Range:</span>
            <span>${analysis.rent.min.toFixed(2)} - ${analysis.rent.max.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">High Occ (95%+):</span>
            <span>{analysis.occupancy.highCount} properties</span>
          </div>
        </div>

        <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <BarChart3 className="h-3 w-3 mr-2" />
              Detailed Analysis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Comprehensive Market Analysis</DialogTitle>
              <DialogDescription>
                Detailed breakdown of {data.length} comparable properties
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Rent Distribution */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Rent/SF Distribution
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-5 gap-4 text-center text-sm">
                    <div>
                      <div className="font-medium">Min</div>
                      <div className="text-gray-600">${analysis.rent.min.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="font-medium">Q1</div>
                      <div className="text-gray-600">${analysis.rent.q1.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="font-medium">Median</div>
                      <div className="text-bristol-maroon font-bold">${analysis.rent.median.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="font-medium">Q3</div>
                      <div className="text-gray-600">${analysis.rent.q3.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="font-medium">Max</div>
                      <div className="text-gray-600">${analysis.rent.max.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-sm text-gray-600">
                      Average: <strong>${analysis.rent.avg.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Market Segments */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Premium Segment (Top 25%)</h4>
                  <div className="bg-green-50 p-3 rounded border">
                    <div className="text-lg font-bold text-green-800">
                      {analysis.segments.premium.length}
                    </div>
                    <div className="text-xs text-green-600">
                      Properties ≥ ${analysis.rent.q3.toFixed(2)}/SF
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Value Segment (Bottom 25%)</h4>
                  <div className="bg-blue-50 p-3 rounded border">
                    <div className="text-lg font-bold text-blue-800">
                      {analysis.segments.value.length}
                    </div>
                    <div className="text-xs text-blue-600">
                      Properties ≤ ${analysis.rent.q1.toFixed(2)}/SF
                    </div>
                  </div>
                </div>
              </div>

              {/* Occupancy Analysis */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Occupancy Performance
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded border">
                    <div className="text-lg font-bold text-green-800">
                      {analysis.occupancy.highCount}
                    </div>
                    <div className="text-xs text-green-600">High Occupancy (95%+)</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded border">
                    <div className="text-lg font-bold text-gray-800">
                      {data.length - analysis.occupancy.highCount - analysis.occupancy.lowCount}
                    </div>
                    <div className="text-xs text-gray-600">Stable (85-95%)</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded border">
                    <div className="text-lg font-bold text-orange-800">
                      {analysis.occupancy.lowCount}
                    </div>
                    <div className="text-xs text-orange-600">Challenged (<85%)</div>
                  </div>
                </div>
              </div>

              {/* Market Insights */}
              <div className="bg-gradient-to-r from-bristol-gold/10 to-bristol-maroon/10 p-4 rounded-lg border border-bristol-gold/20">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-bristol-maroon" />
                  Key Insights
                </h4>
                <div className="space-y-2 text-sm">
                  {analysis.occupancy.avg > 95 && (
                    <div className="flex items-center gap-2 text-green-700">
                      <TrendingUp className="h-3 w-3" />
                      Strong market with high occupancy rates
                    </div>
                  )}
                  {analysis.rent.max - analysis.rent.min > 1.5 && (
                    <div className="flex items-center gap-2 text-blue-700">
                      <BarChart3 className="h-3 w-3" />
                      Wide rent spread indicates diverse market segments
                    </div>
                  )}
                  {analysis.segments.premium.length > analysis.segments.value.length && (
                    <div className="flex items-center gap-2 text-purple-700">
                      <Target className="h-3 w-3" />
                      Market skews toward premium properties
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default CompAnalysisWidget;