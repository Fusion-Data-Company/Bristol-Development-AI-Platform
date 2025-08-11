import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricData {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
  color?: "green" | "red" | "yellow" | "blue" | "maroon";
  description?: string;
}

interface MetricsCardProps {
  title: string;
  metrics: MetricData[];
  className?: string;
}

export function MetricsCard({ title, metrics, className }: MetricsCardProps) {
  const colorClasses = {
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600", 
    yellow: "bg-yellow-100 text-yellow-600",
    blue: "bg-blue-100 text-blue-600",
    maroon: "bg-bristol-maroon/10 text-bristol-maroon"
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4" />;
      case "down":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-bristol-stone";
    }
  };

  return (
    <Card className={cn("bg-white border-bristol-sky shadow-lg hover:shadow-xl transition-all", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg font-semibold text-bristol-ink">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-bristol-fog rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-bristol-stone">{metric.label}</p>
                {metric.trend && (
                  <Badge variant="outline" className={cn("text-xs", getTrendColor(metric.trend))}>
                    {getTrendIcon(metric.trend)}
                    {metric.trendValue && <span className="ml-1">{metric.trendValue}</span>}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-bristol-ink">
                  {typeof metric.value === 'number' 
                    ? metric.value.toLocaleString() 
                    : metric.value
                  }
                </p>
                {metric.unit && (
                  <span className="text-sm text-bristol-stone">{metric.unit}</span>
                )}
              </div>
              
              {metric.description && (
                <p className="text-xs text-bristol-stone mt-1">{metric.description}</p>
              )}
            </div>

            {metric.icon && (
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                metric.color ? colorClasses[metric.color] : "bg-bristol-maroon/10 text-bristol-maroon"
              )}>
                {metric.icon}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Preset metric configurations for common Bristol use cases
export const bristolMetrics = {
  demographics: (data: any) => [
    {
      label: "Median Household Income",
      value: data.medianIncome || 0,
      unit: "",
      trend: data.incomeGrowth > 0 ? "up" : "down",
      trendValue: `${Math.abs(data.incomeGrowth || 0)}%`,
      color: "green" as const,
      description: "Annual household income (ACS 5-year)"
    },
    {
      label: "Population Growth",
      value: data.populationGrowth || 0,
      unit: "%",
      trend: data.populationGrowth > 0 ? "up" : "down",
      color: data.populationGrowth > 2 ? "green" : "yellow" as const,
      description: "5-year population change"
    },
    {
      label: "College Educated",
      value: data.collegeEducated || 0,
      unit: "%",
      color: "blue" as const,
      description: "Bachelor's degree or higher"
    }
  ],

  housing: (data: any) => [
    {
      label: "Vacancy Rate",
      value: data.vacancyRate || 0,
      unit: "%",
      trend: data.vacancyRate < 5 ? "up" : "down",
      color: data.vacancyRate < 5 ? "green" : "red" as const,
      description: "Rental unit vacancy rate"
    },
    {
      label: "Rent Growth",
      value: data.rentGrowth || 0,
      unit: "%",
      trend: data.rentGrowth > 0 ? "up" : "down",
      color: data.rentGrowth > 3 ? "green" : "yellow" as const,
      description: "Year-over-year rent change"
    },
    {
      label: "Average Rent",
      value: data.averageRent || 0,
      unit: "/month",
      color: "maroon" as const,
      description: "Market rate multifamily"
    }
  ],

  economic: (data: any) => [
    {
      label: "Employment Growth",
      value: data.employmentGrowth || 0,
      unit: "%",
      trend: data.employmentGrowth > 0 ? "up" : "down",
      color: data.employmentGrowth > 2 ? "green" : "yellow" as const,
      description: "Annual job growth (BLS data)"
    },
    {
      label: "Unemployment Rate",
      value: data.unemploymentRate || 0,
      unit: "%",
      trend: data.unemploymentRate < 4 ? "up" : "down",
      color: data.unemploymentRate < 4 ? "green" : "red" as const,
      description: "Current unemployment rate"
    },
    {
      label: "Major Employers",
      value: data.majorEmployers || 0,
      unit: "companies",
      color: "blue" as const,
      description: "Fortune 500 companies in market"
    }
  ]
};
