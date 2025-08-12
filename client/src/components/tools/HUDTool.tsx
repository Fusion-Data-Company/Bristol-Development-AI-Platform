import { useState } from "react";
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
  label: string;
  mode: string;
  zip: string;
  lookbackQuarters: number;
  rows: Array<{
    quarter: string;
    year: number;
    quarter_num: number;
    zip: string;
    total: number;
    vacant: number;
    occupied: number;
    no_stat: number;
    vacancy_rate: number | null;
    occupancy_rate: number | null;
  }>;
  metrics: {
    latest_vacancy_rate: number;
    latest_occupancy_rate: number;
    total_addresses: number;
    vacant_addresses: number;
    occupied_addresses: number;
    change_vacancy_rate_1yr: number | null;
    zip_code: string;
  };
  dataSource: string;
  lastUpdated: string;
}

export function HUDTool() {
  const [mode, setMode] = useState("usps");
  const [zip, setZip] = useState("28202"); // Default to Charlotte downtown ZIP
  const [lookbackQ, setLookbackQ] = useState("8");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/tools/hud', mode, zip, lookbackQ],
    enabled: false // Only fetch when user clicks Run
  }) as { data: HUDData; isLoading: boolean; refetch: any };

  const handleRun = () => {
    refetch();
  };

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
      "Quarter,Total Addresses,Vacant,Occupied,Vacancy Rate (%),Occupancy Rate (%)\n" +
      data.rows.map(row => 
        `${row.quarter},${row.total},${row.vacant},${row.occupied},${row.vacancy_rate?.toFixed(2) || 'N/A'},${row.occupancy_rate?.toFixed(2) || 'N/A'}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hud_vacancy_${zip}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = data ? {
    labels: data.rows.map(row => row.quarter),
    datasets: [
      {
        label: 'Vacancy Rate (%)',
        data: data.rows.map(row => row.vacancy_rate || 0),
        borderColor: '#DC2626', // Red for vacancy
        backgroundColor: '#DC2626',
        tension: 0.1,
        fill: false,
        yAxisID: 'y'
      },
      {
        label: 'Occupancy Rate (%)',
        data: data.rows.map(row => row.occupancy_rate || 0),
        borderColor: '#059669', // Green for occupancy
        backgroundColor: '#059669',
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
          callback: (value: any) => `${value}%`
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
          <Label htmlFor="mode" className="text-white">Data Mode</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="usps">USPS Vacancy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="zip" className="text-white">ZIP Code</Label>
          <Input
            id="zip"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="28202"
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        <div>
          <Label htmlFor="lookbackQ" className="text-white">Quarters to Include</Label>
          <Select value={lookbackQ} onValueChange={setLookbackQ}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
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
          className="bg-bristol-gold text-black hover:bg-bristol-gold/90"
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
                <CardTitle className="text-sm text-gray-300">Current Vacancy Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.metrics.latest_vacancy_rate.toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Total Addresses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-white">{formatNumber(data.metrics.total_addresses)}</div>
                <div className="text-sm text-gray-400">
                  {formatNumber(data.metrics.vacant_addresses)} vacant • {formatNumber(data.metrics.occupied_addresses)} occupied
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">1-Year Change</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-white">
                  {formatChange(data.metrics.change_vacancy_rate_1yr)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">{data.label} Over Time</CardTitle>
                <CardDescription className="text-gray-400">
                  Data from {data.dataSource} • Last updated: {new Date(data.lastUpdated).toLocaleDateString()}
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
                <CardTitle className="text-white">Quarterly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-white">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2">Quarter</th>
                        <th className="text-right py-2">Total</th>
                        <th className="text-right py-2">Vacant</th>
                        <th className="text-right py-2">Occupied</th>
                        <th className="text-right py-2">Vacancy %</th>
                        <th className="text-right py-2">Occupancy %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, index) => (
                        <tr key={index} className="border-b border-gray-800">
                          <td className="py-2">{row.quarter}</td>
                          <td className="text-right py-2">{formatNumber(row.total)}</td>
                          <td className="text-right py-2 text-red-400">{formatNumber(row.vacant)}</td>
                          <td className="text-right py-2 text-green-400">{formatNumber(row.occupied)}</td>
                          <td className="text-right py-2">{row.vacancy_rate?.toFixed(1) || 'N/A'}%</td>
                          <td className="text-right py-2">{row.occupancy_rate?.toFixed(1) || 'N/A'}%</td>
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