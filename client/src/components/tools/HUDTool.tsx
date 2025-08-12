import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, Save, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
                <CardTitle className="text-sm text-gray-300">ZIP Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.params.zip}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Census Tracts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-white">{formatNumber(data.rows.length)}</div>
                <div className="text-sm text-gray-400">
                  Crosswalk mappings found
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Avg Residential Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-white">
                  {data.rows.length > 0 ? 
                    (data.rows.reduce((sum, row) => sum + (row.res_ratio || 0), 0) / data.rows.length).toFixed(3) 
                    : 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">HUD USPS Crosswalk Data</CardTitle>
                <CardDescription className="text-gray-400">
                  Data from {data.meta.source}
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
                <CardTitle className="text-white">Census Tract Crosswalk Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-white">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2">ZIP Code</th>
                        <th className="text-left py-2">State</th>
                        <th className="text-left py-2">County</th>
                        <th className="text-left py-2">CBSA</th>
                        <th className="text-left py-2">Census Tract</th>
                        <th className="text-right py-2">Res. Ratio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, index) => (
                        <tr key={index} className="border-b border-gray-800">
                          <td className="py-2">{row.zip}</td>
                          <td className="py-2">{row.state || 'N/A'}</td>
                          <td className="py-2">{row.county || 'N/A'}</td>
                          <td className="py-2">{row.cbsa || 'N/A'}</td>
                          <td className="py-2 font-mono text-sm">{row.tract || 'N/A'}</td>
                          <td className="text-right py-2 text-yellow-400">{row.res_ratio?.toFixed(4) || 'N/A'}</td>
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