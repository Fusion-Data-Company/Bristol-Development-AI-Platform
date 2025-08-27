import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendDataPoint {
  month: string;
  value: number;
  secondary?: number;
}

interface EliteTrendChartProps {
  title: string;
  data: TrendDataPoint[];
  primaryColor?: string;
  secondaryColor?: string;
  showSecondary?: boolean;
  primaryLabel?: string;
  secondaryLabel?: string;
  height?: number;
}

export function EliteTrendChart({ 
  title, 
  data, 
  primaryColor = 'brand-cyan',
  secondaryColor = 'brand-gold', 
  showSecondary = false,
  primaryLabel = 'Primary',
  secondaryLabel = 'Secondary',
  height = 200 
}: EliteTrendChartProps) {
  
  if (!data || data.length === 0) {
    return (
      <Card className="bg-brand-ink/40 border-brand-cyan/30 backdrop-blur-xl">
        <CardContent className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-brand-stone mx-auto mb-4" />
          <p className="text-brand-stone">No trend data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate min/max for scaling with safety checks
  const allValues = data?.flatMap(d => [d?.value, d?.secondary].filter(v => v !== undefined && v !== null && typeof v === 'number')) as number[];
  const minValue = allValues?.length > 0 ? Math.min(...allValues) : 0;
  const maxValue = allValues?.length > 0 ? Math.max(...allValues) : 100;
  const range = maxValue - minValue || 1;
  const padding = range * 0.1;
  const scaledMin = minValue - padding;
  const scaledMax = maxValue + padding;
  const scaledRange = scaledMax - scaledMin;

  const getY = (value: number) => {
    return height - ((value - scaledMin) / scaledRange) * height;
  };

  // Generate SVG path for primary line with safety checks
  const primaryPath = data?.length > 0 ? data.map((point, index) => {
    const x = data.length > 1 ? (index / (data.length - 1)) * 100 : 50;
    const y = ((scaledMax - (point?.value || 0)) / scaledRange) * 100;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ') : 'M 0 50 L 100 50';

  // Generate SVG path for secondary line with safety checks
  const secondaryPath = showSecondary && data?.length > 0 && data.some(d => d?.secondary !== undefined) 
    ? data.map((point, index) => {
        const x = data.length > 1 ? (index / (data.length - 1)) * 100 : 50;
        const y = point?.secondary !== undefined 
          ? ((scaledMax - (point.secondary || 0)) / scaledRange) * 100
          : 50;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ')
    : '';

  // Generate area fill path for primary
  const areaPath = `${primaryPath} L 100 100 L 0 100 Z`;

  const latestValue = data && data.length > 0 ? (data[data.length - 1]?.value || 0) : 0;
  const previousValue = data && data.length > 1 ? (data[data.length - 2]?.value || latestValue) : latestValue;
  const change = previousValue !== 0 ? ((latestValue - previousValue) / previousValue) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <Card className="bg-brand-ink/40 border-brand-cyan/30 backdrop-blur-xl relative overflow-hidden group">
      {/* Animated glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/5 via-transparent to-brand-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-brand-cyan flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-brand-gold" />
            {title}
          </CardTitle>
          
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                isPositive ? 'border-green-400 text-green-300' : 'border-red-400 text-red-300'
              )}
            >
              {isPositive ? '+' : ''}{change.toFixed(1)}%
            </Badge>
            
            {showSecondary && (
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full bg-${primaryColor}`} />
                  <span className="text-brand-stone">{primaryLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full bg-${secondaryColor}`} />
                  <span className="text-brand-stone">{secondaryLabel}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="relative" style={{ height: `${height}px` }}>
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(69, 214, 202)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="rgb(69, 214, 202)" stopOpacity={0.05} />
              </linearGradient>
              
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(69, 214, 202)" />
                <stop offset="100%" stopColor="rgb(251, 191, 36)" />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            {[20, 40, 60, 80].map(y => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="rgb(100, 116, 139)"
                strokeOpacity={0.1}
                strokeWidth="0.5"
              />
            ))}
            
            {/* Area fill */}
            <path
              d={areaPath}
              fill="url(#primaryGradient)"
            />
            
            {/* Primary line */}
            <path
              d={primaryPath}
              stroke="url(#lineGradient)"
              strokeWidth="2"
              fill="none"
              className="drop-shadow-sm"
            />
            
            {/* Secondary line */}
            {secondaryPath && (
              <path
                d={secondaryPath}
                stroke="rgb(251, 191, 36)"
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="5,5"
                opacity={0.7}
              />
            )}
            
            {/* Data points */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = ((scaledMax - point.value) / scaledRange) * 100;
              
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="1.5"
                    fill="rgb(69, 214, 202)"
                    className="drop-shadow-sm"
                  />
                  
                  {/* Hover effect */}
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="transparent"
                    className="hover:fill-brand-cyan/20 cursor-pointer"
                  >
                    <title>{`${point.month}: ${point.value.toLocaleString()}`}</title>
                  </circle>
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-4 text-xs text-brand-stone">
          {data?.length > 0 && data.filter((_, index) => index % Math.ceil(data.length / 6) === 0).map((point, index) => (
            <span key={index}>{point?.month || `Period ${index + 1}`}</span>
          ))}
        </div>
        
        {/* Current value display */}
        <div className="mt-4 p-3 bg-brand-ink/60 rounded-lg border border-brand-cyan/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">
                {(latestValue || 0).toLocaleString()}
              </div>
              <div className="text-xs text-brand-stone">Current Value</div>
            </div>
            
            <div className="text-right">
              <div className={cn(
                "text-lg font-medium",
                isPositive ? 'text-green-400' : 'text-red-400'
              )}>
                {isPositive ? '+' : ''}{change.toFixed(1)}%
              </div>
              <div className="text-xs text-brand-stone">vs Previous</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}