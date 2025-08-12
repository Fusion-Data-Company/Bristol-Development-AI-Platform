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

interface BLSData {
  ok: boolean;
  params: {
    level: string;
    state: string;
    county: string;
    start: string;
    end: string;
    seriesId: string;
  };
  rows: Array<{
    date: string;
    value: number;
  }>;
  meta: {
    label: string;
    source: string;
  };
}

export function BLSTool() {
  const [level, setLevel] = useState("county");
  const [state, setState] = useState("37"); // Default to NC
  const [county, setCounty] = useState("119"); // Default to Mecklenberg
  const [msa, setMsa] = useState("");
  const [start, setStart] = useState("2020-01");
  const [end, setEnd] = useState("2024-12");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['/api/tools/bls', level, state, county, msa, start, end],
    queryFn: () => {
      const params = new URLSearchParams({
        level,
        state,
        county,
        msa,
        start,
        end
      });
      return fetch(`/api/tools/bls?${params}`, {
        credentials: 'include'
      }).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      });
    },
    enabled: false // Only fetch when user clicks Run
  });

  const handleRun = () => {
    console.log('BLS Tool: Running analysis with params:', { level, state, county, msa, start, end });
    refetch();
  };

  const handleSaveSnapshot = async () => {
    if (!data) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest('/api/snapshots', 'POST', {
        tool: 'bls',
        params: { level, state, county, msa, start, end },
        data
      });
      
      toast({
        title: "Snapshot Saved",
        description: "BLS data snapshot has been saved successfully."
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
      "Date,Unemployment Rate (%)\n" +
      data.rows.map((row: { date: string; value: number }) => `${row.date},${row.value}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bls_unemployment_${level}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = data ? {
    labels: data.rows.map((row: { date: string }) => row.date),
    datasets: [
      {
        label: data.meta.label,
        data: data.rows.map((row: { value: number }) => row.value),
        borderColor: '#D4A574', // Bristol gold
        backgroundColor: '#D4A574',
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
        ticks: { color: '#374151' },
        grid: { color: '#e5e7eb' }
      },
      y: {
        ticks: { color: '#374151' },
        grid: { color: '#e5e7eb' }
      }
    }
  };

  const formatChange = (value: number | null, isPercent = false) => {
    if (value === null) return "N/A";
    const formatted = isPercent ? `${Math.abs(value).toFixed(1)}%` : Math.abs(value).toFixed(1);
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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="level" className="text-slate-700 font-medium">Geographic Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="bg-white/90 border-blue-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-blue-200/60">
                <SelectItem value="county">County</SelectItem>
                <SelectItem value="msa">Metropolitan Area</SelectItem>
              </SelectContent>
            </Select>
          </div>

        {level === "county" && (
          <>
            <div>
              <Label htmlFor="state" className="text-slate-700 font-medium">State FIPS</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="37 (NC)"
                className="bg-white/90 border-blue-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors"
              />
            </div>
            <div>
              <Label htmlFor="county" className="text-slate-700 font-medium">County FIPS</Label>
              <Input
                id="county"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                placeholder="119 (Mecklenburg)"
                className="bg-white/90 border-blue-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors"
              />
            </div>
          </>
        )}

        {level === "msa" && (
            <div>
              <Label htmlFor="msa" className="text-slate-700 font-medium">MSA Code</Label>
              <Input
                id="msa"
                value={msa}
                onChange={(e) => setMsa(e.target.value)}
                placeholder="16740 (Charlotte)"
                className="bg-white/90 border-blue-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors"
              />
            </div>
        )}

          <div>
            <Label htmlFor="start" className="text-slate-700 font-medium">Start Date</Label>
            <Input
              id="start"
              type="month"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="bg-white/90 border-blue-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors"
            />
          </div>

          <div>
            <Label htmlFor="end" className="text-slate-700 font-medium">End Date</Label>
            <Input
              id="end"
              type="month"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="bg-white/90 border-blue-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={handleRun} 
          disabled={isLoading}
          className="bg-gradient-to-r from-bristol-gold to-yellow-400 text-slate-900 hover:from-bristol-gold/90 hover:to-yellow-400/90 border-0 shadow-lg font-semibold px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105"
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

      {/* Debug Info */}
      {isLoading && <div className="text-gray-600">Loading data...</div>}
      {error && <div className="text-red-600">Error: {error.message}</div>}
      {!isLoading && !data && !error && <div className="text-gray-600">Click "Run Analysis" to fetch data</div>}
      
      {/* Results */}
      {data && data.ok && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KPI Cards */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-gradient-to-br from-white/90 to-blue-50/50 border-blue-200/50 shadow-lg rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-600 font-medium">Current Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                  {data.rows.length > 0 ? `${data.rows[data.rows.length - 1].value.toFixed(1)}%` : 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/90 to-emerald-50/50 border-emerald-200/50 shadow-lg rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-600 font-medium">12-Month Change</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-slate-800">
                  {data.rows.length >= 12 ? 
                    formatChange(data.rows[data.rows.length - 1].value - data.rows[data.rows.length - 12].value)
                    : 'N/A'
                  }
                  <span className="text-sm text-slate-500 ml-1">pts</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/90 to-purple-50/50 border-purple-200/50 shadow-lg rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-600 font-medium">Data Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-slate-800">
                  {data.rows.length} months
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-white/90 to-slate-50/50 border-slate-200/50 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-800 font-semibold">{data.meta.label} Over Time</CardTitle>
                <CardDescription className="text-slate-600">
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
        </div>
      )}

      {/* Error Display */}
      {data && !data.ok && (
        <Card className="bg-red-50 border-red-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-700">
              {(data as any).error || 'Failed to fetch data'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}