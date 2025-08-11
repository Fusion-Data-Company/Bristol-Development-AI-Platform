import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  Users,
  Building2,
  Percent
} from 'lucide-react';
import { type SiteMetric } from '@shared/schema';
import { format } from 'date-fns';

interface MetricsTableProps {
  metrics: SiteMetric[];
  loading?: boolean;
  compact?: boolean;
}

export function MetricsTable({ 
  metrics, 
  loading = false,
  compact = false 
}: MetricsTableProps) {
  
  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'demographics':
        return <Users className="h-4 w-4" />;
      case 'economics':
        return <DollarSign className="h-4 w-4" />;
      case 'housing':
        return <Building2 className="h-4 w-4" />;
      case 'competition':
        return <Percent className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (value < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const formatValue = (value: any, unit?: string) => {
    if (value === null || value === undefined) return 'N/A';
    
    if (unit === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      }).format(value);
    }
    
    if (unit === 'percent') {
      return `${value.toFixed(1)}%`;
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return value;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-bristol-maroon"></div>
          Loading metrics...
        </div>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No metrics available for this site yet.
      </div>
    );
  }

  if (compact) {
    // Compact view for dashboard
    return (
      <div className="space-y-4">
        {metrics.slice(0, 5).map((metric) => (
          <div key={metric.id} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {getMetricIcon(metric.type)}
              <div>
                <p className="font-medium text-sm">{metric.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatValue(metric.value, metric.unit)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {metric.trend && getTrendIcon(metric.trend)}
              {metric.score && (
                <Badge className={getScoreColor(metric.score)} variant="secondary">
                  {metric.score}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Full table view
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Metric</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Trend</TableHead>
            <TableHead>Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((metric) => (
            <TableRow key={metric.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {getMetricIcon(metric.type)}
                  {metric.name}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {metric.type}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-semibold">
                  {formatValue(metric.value, metric.unit)}
                </span>
              </TableCell>
              <TableCell>
                {metric.score ? (
                  <div className="flex items-center gap-2">
                    <Progress value={metric.score} className="w-16 h-2" />
                    <span className={`text-sm font-medium ${getScoreColor(metric.score).split(' ')[0]}`}>
                      {metric.score}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {metric.trend ? (
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend)}
                    <span className={`text-sm ${
                      metric.trend > 0 ? 'text-green-600' : 
                      metric.trend < 0 ? 'text-red-600' : 
                      'text-gray-400'
                    }`}>
                      {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(1)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(metric.createdAt), 'MMM d, yyyy')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}