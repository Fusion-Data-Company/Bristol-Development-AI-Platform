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
    actual: number;
    cleared: number;
    rate: number;
  }>;
  meta: {
    label: string;
    source: string;
    state: string;
  };
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
        `${row.year},${data.params.offense},${row.actual},${row.cleared},${((row.cleared / row.actual) * 100).toFixed(1)}%`
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
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="geo" className="text-slate-700 font-medium">Geographic Level</Label>
            <Select value={geo} onValueChange={setGeo}>
              <SelectTrigger className="bg-white/90 border-amber-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-amber-200/60">
                <SelectItem value="state">State</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="state" className="text-slate-700 font-medium">State Code</Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase())}
              placeholder="NC"
              className="bg-white/90 border-amber-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors"
              maxLength={2}
            />
          </div>

          <div>
            <Label htmlFor="offense" className="text-slate-700 font-medium">Crime Type</Label>
            <Select value={offense} onValueChange={setOffense}>
              <SelectTrigger className="bg-white/90 border-amber-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-amber-200/60">
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
            <Label htmlFor="from" className="text-slate-700 font-medium">From Year</Label>
            <Input
              id="from"
              type="number"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              min="2000"
              max="2030"
              className="bg-white/90 border-amber-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors"
            />
          </div>

          <div>
            <Label htmlFor="to" className="text-slate-700 font-medium">To Year</Label>
            <Input
              id="to"
              type="number"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min="2000"
              max="2030"
              className="bg-white/90 border-amber-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={handleRun} 
          disabled={isLoading}
          className="relative bg-gradient-to-r from-red-900 to-red-700 text-white border-2 border-red-400/70 shadow-2xl font-bold text-lg px-12 py-4 rounded-2xl transition-all duration-300 hover:scale-105 hover:border-red-300/80 hover:from-red-800 hover:to-red-600 active:scale-95 overflow-hidden before:absolute before:-inset-2 before:bg-red-500/20 before:blur-xl before:-z-10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 after:absolute after:inset-0 after:bg-gradient-to-r after:from-white/8 after:via-transparent after:to-transparent after:rounded-2xl after:pointer-events-none"
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
              className="border-slate-300 text-slate-700 bg-white/80 hover:bg-slate-50 hover:border-bristol-gold/50 rounded-xl px-6 py-3 shadow-md transition-all duration-200"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Snapshot
            </Button>
            
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="border-slate-300 text-slate-700 bg-white/80 hover:bg-slate-50 hover:border-bristol-gold/50 rounded-xl px-6 py-3 shadow-md transition-all duration-200"
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
            <Card className="bg-gradient-to-br from-amber-50/90 to-orange-100/60 border-2 border-amber-200/50 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-700 font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-600" />
                  Latest ({data.rows[data.rows.length - 1]?.year || 'N/A'})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-amber-800 to-red-600 bg-clip-text text-transparent">
                  {formatNumber(data.rows[data.rows.length - 1]?.actual || 0)}
                </div>
                <div className="text-xs text-amber-600 font-medium">Reported incidents</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50/90 to-pink-100/60 border-2 border-red-200/50 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-700 font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-600" />
                  Year-over-Year
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-red-800 flex items-center gap-2">
                  {data.rows.length >= 2 ? (
                    <>
                      {data.rows[data.rows.length - 1].actual > data.rows[data.rows.length - 2].actual ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-emerald-500" />
                      )}
                      <span className="font-bold">
                        {(((data.rows[data.rows.length - 1].actual - data.rows[data.rows.length - 2].actual) / data.rows[data.rows.length - 2].actual) * 100).toFixed(1)}%
                      </span>
                    </>
                  ) : 'N/A'}
                </div>
                <div className="text-xs text-red-600 font-medium">
                  {data.rows.length >= 2 && `${data.rows[data.rows.length - 1].actual > data.rows[data.rows.length - 2].actual ? '+' : ''}${formatNumber(data.rows[data.rows.length - 1].actual - data.rows[data.rows.length - 2].actual)} cases`}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50/90 to-green-100/60 border-2 border-emerald-200/50 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-emerald-700 font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  Clearance Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-green-600 bg-clip-text text-transparent">
                  {data.rows.length > 0 ? 
                    `${(data.rows.reduce((sum, row) => sum + (row.cleared / row.actual), 0) / data.rows.length * 100).toFixed(1)}%`
                    : 'N/A'}
                </div>
                <div className="text-xs text-emerald-600 font-medium">Average across years</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50/90 to-cyan-100/60 border-2 border-blue-200/50 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-700 font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Overall Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-blue-800 flex items-center gap-2">
                  {data.rows.length > 1 ? (
                    <>
                      {data.rows[data.rows.length - 1].actual > data.rows[0].actual ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-emerald-500" />
                      )}
                      <span className="font-bold">
                        {(((data.rows[data.rows.length - 1].actual - data.rows[0].actual) / data.rows[0].actual) * 100).toFixed(1)}%
                      </span>
                    </>
                  ) : 'N/A'}
                </div>
                <div className="text-xs text-blue-600 font-medium">Total change</div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-white/95 to-amber-50/80 border-2 border-amber-200/60 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-800 font-bold text-xl flex items-center gap-3">
                  <Shield className="h-6 w-6 text-amber-600" />
                  Crime Intelligence - {state}
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  {offense.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis • {data.meta.source}
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
                            <td className="text-right py-2">{((row.cleared / row.actual) * 100).toFixed(1)}%</td>
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