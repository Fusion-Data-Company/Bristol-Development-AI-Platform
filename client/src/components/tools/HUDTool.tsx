import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, Save, TrendingUp, TrendingDown, Minus, Building, Map } from "lucide-react";
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

interface HUDData {
  params: {
    mode: string;
    zip: string;
  };
  rows: Array<{
    zip: string;
    state: string | null;
    county: string | null;
    cbsa: string | null;
    tract: string | null;
    res_ratio: number | null;
  }>;
  meta: {
    source: string;
  };
}

export function HUDTool() {
  const [mode, setMode] = useState("usps");
  const [zip, setZip] = useState("28202"); // Default to Charlotte downtown ZIP
  const [lookbackQ, setLookbackQ] = useState("8");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/tools/hud', mode, zip, lookbackQ],
    queryFn: () => {
      const params = new URLSearchParams({
        mode,
        zip,
        lookbackQ
      });
      return fetch(`/api/tools/hud/${mode}/${zip}/${lookbackQ}`, {
        credentials: 'include'
      }).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      });
    },
    enabled: false // Only fetch when user clicks Run
  }) as { data: HUDData; isLoading: boolean; refetch: any };

  const handleRun = () => {
    console.log('HUD Tool: Running analysis with params:', { mode, zip, lookbackQ });
    refetch();
  };

  // Debug logging when data changes
  React.useEffect(() => {
    console.log('HUD Tool: Data changed:', { hasData: !!data, data });
  }, [data]);

  const handleSaveSnapshot = async () => {
    if (!data) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest('/api/snapshots', 'POST', {
        tool: 'hud',
        params: { mode, zip, lookbackQ },
        data
      });
      
      toast({
        title: "Snapshot Saved",
        description: "HUD data snapshot has been saved successfully."
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
      "ZIP,State,County,CBSA,Census Tract,Residential Ratio\n" +
      data.rows.map(row => 
        `${row.zip},${row.state || 'N/A'},${row.county || 'N/A'},${row.cbsa || 'N/A'},${row.tract || 'N/A'},${row.res_ratio?.toFixed(4) || 'N/A'}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hud_crosswalk_${zip}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = data ? {
    labels: data.rows.map((row, index) => `Tract ${index + 1}`),
    datasets: [
      {
        label: 'Residential Ratio',
        data: data.rows.map(row => row.res_ratio || 0),
        borderColor: '#D97706', // Gold for Bristol branding
        backgroundColor: '#D97706',
        tension: 0.1,
        fill: false,
        yAxisID: 'y'
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: '#374151'
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#374151' },
        grid: { color: '#e5e7eb' }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        ticks: { 
          color: '#ffffff',
          callback: (value: any) => value.toFixed(2)
        },
        grid: { color: '#374151' }
      }
    }
  };

  const formatChange = (value: number | null) => {
    if (value === null) return "N/A";
    const formatted = `${Math.abs(value).toFixed(1)}%`;
    const icon = value > 0 ? <TrendingUp className="h-4 w-4 text-red-400" /> : 
                 value < 0 ? <TrendingDown className="h-4 w-4 text-green-400" /> :
                 <Minus className="h-4 w-4 text-gray-400" />;
    return (
      <div className="flex items-center gap-1">
        {icon}
        {formatted}
      </div>
    );
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="mode" className="text-gray-900">Data Mode</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="bg-white border-gray-300 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              <SelectItem value="usps">USPS Vacancy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="zip" className="text-gray-900">ZIP Code</Label>
          <Input
            id="zip"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="28202"
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div>
          <Label htmlFor="lookbackQ" className="text-gray-900">Quarters to Include</Label>
          <Select value={lookbackQ} onValueChange={setLookbackQ}>
            <SelectTrigger className="bg-white border-gray-300 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              <SelectItem value="4">4 Quarters (1 Year)</SelectItem>
              <SelectItem value="8">8 Quarters (2 Years)</SelectItem>
              <SelectItem value="12">12 Quarters (3 Years)</SelectItem>
              <SelectItem value="16">16 Quarters (4 Years)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={handleRun} 
          disabled={isLoading}
          className="relative bg-gradient-to-r from-red-900 to-red-700 text-white backdrop-blur-lg border-2 border-red-400/60 shadow-2xl font-bold text-lg px-12 py-4 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-red-500/40 hover:border-red-300/70 hover:from-red-800 hover:to-red-600 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-transparent before:rounded-2xl before:backdrop-blur-lg active:scale-95"
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
            <Card className="bg-gradient-to-br from-indigo-50/90 to-purple-100/60 border-2 border-indigo-200/50 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-indigo-700 font-semibold flex items-center gap-2">
                  <Building className="h-4 w-4 text-indigo-600" />
                  Target ZIP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-800 to-purple-600 bg-clip-text text-transparent">
                  {data.params.zip}
                </div>
                <div className="text-xs text-indigo-600 font-medium">Geographic identifier</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50/90 to-green-100/60 border-2 border-emerald-200/50 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-emerald-700 font-semibold flex items-center gap-2">
                  <Map className="h-4 w-4 text-emerald-600" />
                  Census Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-green-600 bg-clip-text text-transparent">
                  {formatNumber(data.rows.length)}
                </div>
                <div className="text-xs text-emerald-600 font-medium">
                  Tract mappings discovered
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50/90 to-amber-100/60 border-2 border-yellow-200/50 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-yellow-700 font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                  Residential Index
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold bg-gradient-to-r from-yellow-800 to-amber-600 bg-clip-text text-transparent">
                  {data.rows.length > 0 ? 
                    (data.rows.reduce((sum, row) => sum + (row.res_ratio || 0), 0) / data.rows.length).toFixed(3) 
                    : 'N/A'}
                </div>
                <div className="text-xs text-yellow-600 font-medium">Average residential ratio</div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-white/95 to-indigo-50/80 border-2 border-indigo-200/60 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-800 font-bold text-xl flex items-center gap-3">
                  <Building className="h-6 w-6 text-indigo-600" />
                  HUD Intelligence Dashboard
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  Real-time Data from {data.meta.source}
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
            <Card className="bg-gradient-to-br from-white/95 to-indigo-50/80 border-2 border-indigo-200/60 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-800 font-bold text-xl flex items-center gap-3">
                  <Map className="h-6 w-6 text-indigo-600" />
                  Census Intelligence Matrix
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  Geographic crosswalk data analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-gradient-to-r from-indigo-200 to-purple-300">
                        <th className="text-left py-4 px-3 bg-gradient-to-r from-indigo-100/80 to-purple-100/60 rounded-l-lg font-bold text-slate-700">ZIP Code</th>
                        <th className="text-left py-4 px-3 bg-gradient-to-r from-purple-100/60 to-emerald-100/60 font-bold text-slate-700">State</th>
                        <th className="text-left py-4 px-3 bg-gradient-to-r from-emerald-100/60 to-blue-100/60 font-bold text-slate-700">County</th>
                        <th className="text-left py-4 px-3 bg-gradient-to-r from-blue-100/60 to-yellow-100/60 font-bold text-slate-700">CBSA</th>
                        <th className="text-left py-4 px-3 bg-gradient-to-r from-yellow-100/60 to-pink-100/60 font-bold text-slate-700">Census Tract</th>
                        <th className="text-right py-4 px-3 bg-gradient-to-r from-pink-100/60 to-red-100/80 rounded-r-lg font-bold text-slate-700">Residential Ratio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, index) => (
                        <tr key={index} className={`border-b border-slate-200/50 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/30 transition-all duration-200 ${index % 2 === 0 ? 'bg-white/70' : 'bg-slate-50/50'}`}>
                          <td className="py-4 px-3">
                            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-2 rounded-lg border border-indigo-200/50 font-bold text-slate-800">
                              {row.zip}
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-2 rounded-lg border border-purple-200/50 font-semibold text-slate-800">
                              {row.state || 'N/A'}
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="bg-gradient-to-r from-emerald-100 to-teal-100 px-3 py-2 rounded-lg border border-emerald-200/50 font-semibold text-slate-800">
                              {row.county || 'N/A'}
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 px-3 py-2 rounded-lg border border-blue-200/50 font-semibold text-slate-800">
                              {row.cbsa || 'N/A'}
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-2 rounded-lg border border-yellow-200/50 font-mono text-sm font-bold text-slate-800">
                              {row.tract || 'N/A'}
                            </div>
                          </td>
                          <td className="py-4 px-3 text-right">
                            <div className="bg-gradient-to-r from-pink-100 to-red-100 px-4 py-2 rounded-lg border border-pink-200/50 inline-block">
                              <div className="text-lg font-bold text-red-800">
                                {row.res_ratio?.toFixed(4) || 'N/A'}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
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