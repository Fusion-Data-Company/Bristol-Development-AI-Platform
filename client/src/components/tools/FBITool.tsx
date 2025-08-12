import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, Save, TrendingUp, TrendingDown, Shield } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface FBIData {
  params: {
    geo: string;
    state: string;
    offense: string;
    from: string;
    to: string;
  };
  rows: Array<{
    year: number;
    offense: string;
    actual: number;
    cleared: number;
    clearance_rate: string;
  }>;
  metrics: {
    latest: number;
    latestYear: number;
    yoy: number | null;
    yoyPercent: string | null;
    trend: number;
    avgClearanceRate: string;
  };
  dataSource: string;
  lastUpdated: string;
}

export function FBITool() {
  const [geo, setGeo] = useState("state");
  const [state, setState] = useState("NC"); // Default to North Carolina
  const [offense, setOffense] = useState("violent-crime");
  const [from, setFrom] = useState("2014");
  const [to, setTo] = useState("2023");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/tools/fbi', geo, state, offense, from, to],
    queryFn: () => {
      return fetch(`/api/tools/fbi/${geo}/${state}/${offense}/${from}/${to}`, {
        credentials: 'include'
      }).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      });
    },
    enabled: false // Only fetch when user clicks Run
  }) as { data: FBIData; isLoading: boolean; refetch: any };

  const handleRun = () => {
    console.log('FBI Tool: Running analysis with params:', { geo, state, offense, from, to });
    refetch();
  };

  // Debug logging when data changes
  React.useEffect(() => {
    console.log('FBI Tool: Data changed:', { hasData: !!data, data });
  }, [data]);

  const handleSaveSnapshot = async () => {
    if (!data) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest('/api/snapshots', 'POST', {
        tool: 'fbi',
        params: { geo, state, offense, from, to },
        data
      });
      
      toast({
        title: "Snapshot Saved",
        description: "FBI crime data snapshot has been saved successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save snapshot. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Year,Offense,Actual,Cleared,Clearance Rate (%)\n" +
      data.rows.map(row => 
        `${row.year},${row.offense},${row.actual},${row.cleared},${row.clearance_rate}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fbi_crime_${state}_${offense}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = data ? {
    labels: data.rows.map(row => row.year.toString()),
    datasets: [
      {
        label: 'Actual Crimes',
        data: data.rows.map(row => row.actual),
        borderColor: '#DC2626', // Red
        backgroundColor: '#DC2626',
        tension: 0.1,
        fill: false
      },
      {
        label: 'Cleared Cases',
        data: data.rows.map(row => row.cleared),
        borderColor: '#059669', // Green
        backgroundColor: '#059669',
        tension: 0.1,
        fill: false
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#374151'
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#ffffff' },
        grid: { color: '#374151' }
      },
      y: {
        ticks: { color: '#ffffff' },
        grid: { color: '#374151' }
      }
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-red-400" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-green-400" />;
    return <Shield className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <Label htmlFor="geo" className="text-white">Geographic Level</Label>
          <Select value={geo} onValueChange={setGeo}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="state">State</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="state" className="text-white">State Code</Label>
          <Input
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value.toUpperCase())}
            placeholder="NC"
            className="bg-gray-700 border-gray-600 text-white"
            maxLength={2}
          />
        </div>

        <div>
          <Label htmlFor="offense" className="text-white">Crime Type</Label>
          <Select value={offense} onValueChange={setOffense}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="violent-crime">Violent Crime</SelectItem>
              <SelectItem value="property-crime">Property Crime</SelectItem>
              <SelectItem value="homicide">Homicide</SelectItem>
              <SelectItem value="rape">Rape</SelectItem>
              <SelectItem value="robbery">Robbery</SelectItem>
              <SelectItem value="burglary">Burglary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="from" className="text-white">From Year</Label>
          <Input
            id="from"
            type="number"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            min="2000"
            max="2030"
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        <div>
          <Label htmlFor="to" className="text-white">To Year</Label>
          <Input
            id="to"
            type="number"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            min="2000"
            max="2030"
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={handleRun} 
          disabled={isLoading}
          className="bg-bristol-gold text-black hover:bg-bristol-gold/90 border-2 border-bristol-gold shadow-lg font-semibold px-6 py-2"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Run Analysis
        </Button>
        
        {data && (
          <>
            <Button
              onClick={handleSaveSnapshot}
              disabled={isSubmitting}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Snapshot
            </Button>
            
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </>
        )}
      </div>

      {/* Results */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KPI Cards */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Latest ({data.metrics.latestYear})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatNumber(data.metrics.latest)}</div>
                <div className="text-xs text-gray-400">Reported incidents</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Year-over-Year</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-white flex items-center gap-2">
                  {data.metrics.yoy !== null ? (
                    <>
                      {data.metrics.yoy > 0 ? (
                        <TrendingUp className="h-4 w-4 text-red-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-green-400" />
                      )}
                      {data.metrics.yoyPercent}%
                    </>
                  ) : 'N/A'}
                </div>
                <div className="text-xs text-gray-400">
                  {data.metrics.yoy && `${data.metrics.yoy > 0 ? '+' : ''}${formatNumber(data.metrics.yoy)} cases`}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Clearance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-white">{data.metrics.avgClearanceRate}%</div>
                <div className="text-xs text-gray-400">Average across years</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-white flex items-center gap-2">
                  {getTrendIcon(data.metrics.trend)}
                  {Math.abs(data.metrics.trend).toFixed(1)}/year
                </div>
                <div className="text-xs text-gray-400">
                  {data.metrics.trend > 0 ? 'Increasing' : data.metrics.trend < 0 ? 'Decreasing' : 'Stable'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Crime Trends - {state}</CardTitle>
                <CardDescription className="text-gray-400">
                  {offense.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {data.dataSource}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData && (
                  <div className="h-64">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Annual Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-white">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2">Year</th>
                        <th className="text-right py-2">Actual</th>
                        <th className="text-right py-2">Cleared</th>
                        <th className="text-right py-2">Clearance Rate</th>
                        <th className="text-right py-2">YoY Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, index) => {
                        const prevRow = index > 0 ? data.rows[index - 1] : null;
                        const yoyChange = prevRow ? row.actual - prevRow.actual : null;
                        const yoyPercent = prevRow && prevRow.actual > 0 ? 
                          ((row.actual - prevRow.actual) / prevRow.actual * 100).toFixed(1) : null;
                        
                        return (
                          <tr key={row.year} className="border-b border-gray-800">
                            <td className="py-2 font-medium">{row.year}</td>
                            <td className="text-right py-2">{formatNumber(row.actual)}</td>
                            <td className="text-right py-2 text-green-400">{formatNumber(row.cleared)}</td>
                            <td className="text-right py-2">{row.clearance_rate}%</td>
                            <td className="text-right py-2">
                              {yoyPercent ? (
                                <span className={yoyChange && yoyChange > 0 ? 'text-red-400' : 'text-green-400'}>
                                  {yoyPercent}%
                                </span>
                              ) : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}