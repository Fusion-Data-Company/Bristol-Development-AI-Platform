import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, Save, TrendingUp, TrendingDown, Minus, BarChart3, Cpu } from "lucide-react";
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

interface BEAData {
  ok: boolean;
  params: {
    geo: string;
    msa: string;
    state: string;
    county: string;
    startYear: string;
    endYear: string;
    table: string;
    geoFips: string;
  };
  rows: Array<{
    year: number;
    value: number;
  }>;
  meta: {
    label: string;
    source: string;
  };
}

export function BEATool() {
  const [geo, setGeo] = useState("msa");
  const [state, setState] = useState("37"); // Default to NC
  const [county, setCounty] = useState("119"); // Default to Mecklenberg
  const [msa, setMsa] = useState("16740"); // Default to Charlotte MSA
  const [startYear, setStartYear] = useState("2015");
  const [endYear, setEndYear] = useState("2023");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['/api/tools/bea', geo, state, county, msa, startYear, endYear],
    queryFn: () => {
      const params = new URLSearchParams({
        geo,
        state,
        county,
        msa,
        startYear,
        endYear
      });
      return fetch(`/api/tools/bea?${params}`, {
        credentials: 'include'
      }).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      });
    },
    enabled: false // Only fetch when user clicks Run
  });

  const handleRun = () => {
    console.log('BEA Tool: Running analysis with params:', { geo, state, county, msa, startYear, endYear });
    refetch();
  };

  const handleSaveSnapshot = async () => {
    if (!data) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest('/api/snapshots', 'POST', {
        tool: 'bea',
        params: { geo, state, county, msa, startYear, endYear },
        data
      });
      
      toast({
        title: "Snapshot Saved",
        description: "BEA data snapshot has been saved successfully."
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
      "Year,Value\n" +
      data.rows.map((row: { year: number; value: number }) => `${row.year},${row.value}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bea_${geo}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = data ? {
    labels: data.rows.map((row: { year: number }) => row.year.toString()),
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
        ticks: { 
          color: '#374151',
          callback: (value: any) => {
            if (value >= 1000000) return `$${(value/1000000).toFixed(1)}M`;
            if (value >= 1000) return `$${(value/1000).toFixed(0)}K`;
            return `$${value}`;
          }
        },
        grid: { color: '#e5e7eb' }
      }
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `$${(value/1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value/1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value/1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatChange = (value: number | null, isPercent = false) => {
    if (value === null) return "N/A";
    const formatted = isPercent ? `${Math.abs(value).toFixed(1)}%` : formatCurrency(Math.abs(value));
    const icon = value > 0 ? <TrendingUp className="h-4 w-4 text-green-400" /> : 
                 value < 0 ? <TrendingDown className="h-4 w-4 text-red-400" /> :
                 <Minus className="h-4 w-4 text-gray-400" />;
    return (
      <div className="flex items-center gap-1">
        {icon}
        {formatted}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* MEGA HEADER */}
      <div className="text-center space-y-6 bristol-enterprise-card p-8 rounded-3xl border-4 border-bristol-gold/40 shadow-2xl bg-gradient-to-br from-white/95 via-emerald-50/50 to-green-50/50 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-bristol-gold/10 animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 shadow-xl animate-bounce">
              <TrendingUp className="h-16 w-16 text-emerald-600 drop-shadow-lg" />
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-emerald-800 via-bristol-gold to-green-600 bg-clip-text text-transparent drop-shadow-lg tracking-tight">
              💰 Bureau of Economic Analysis
            </h1>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-emerald-600 tracking-wide animate-pulse">
              ✨ Real-Time GDP & Income Intelligence Platform
            </h2>
            <div className="flex items-center justify-center gap-8 text-lg font-bold text-emerald-700/90">
              <span>📈 Live GDP Data • 💼 Regional Income • 📊 Economic Insights • 🎯 Bristol-Powered Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="geo" className="text-gray-900">Geographic Level</Label>
          <Select value={geo} onValueChange={setGeo}>
            <SelectTrigger className="bristol-form-enhanced">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              <SelectItem value="msa">Metropolitan Area</SelectItem>
              <SelectItem value="county">County</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {geo === "county" && (
          <>
            <div>
              <Label htmlFor="state" className="text-gray-900">State FIPS</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="37 (NC)"
                className="bristol-form-enhanced"
              />
            </div>
            <div>
              <Label htmlFor="county" className="text-gray-900">County FIPS</Label>
              <Input
                id="county"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                placeholder="119 (Mecklenburg)"
                className="bristol-form-enhanced"
              />
            </div>
          </>
        )}

        {geo === "msa" && (
          <div>
            <Label htmlFor="msa" className="text-gray-900">MSA Code</Label>
            <Input
              id="msa"
              value={msa}
              onChange={(e) => setMsa(e.target.value)}
              placeholder="16740 (Charlotte)"
              className="bristol-form-enhanced"
            />
          </div>
        )}

        <div>
          <Label htmlFor="startYear" className="text-gray-900">Start Year</Label>
          <Input
            id="startYear"
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            min="2005"
            max="2030"
            className="bristol-form-enhanced"
          />
        </div>

        <div>
          <Label htmlFor="endYear" className="text-gray-900">End Year</Label>
          <Input
            id="endYear"
            type="number"
            value={endYear}
            onChange={(e) => setEndYear(e.target.value)}
            min="2005"
            max="2030"
            className="bristol-form-enhanced"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={handleRun} 
          disabled={isLoading}
          className="group relative bg-gradient-to-r from-bristol-maroon via-red-800 to-bristol-maroon text-white border-4 border-bristol-gold/60 shadow-2xl font-black text-xl px-16 py-6 rounded-3xl transition-all duration-500 hover:scale-110 hover:border-bristol-gold/90 hover:from-bristol-maroon/90 hover:to-red-700 active:scale-95 overflow-hidden before:absolute before:-inset-3 before:bg-bristol-gold/30 before:blur-2xl before:-z-10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-700 after:absolute after:inset-0 after:bg-gradient-to-r after:from-white/12 after:via-transparent after:to-transparent after:rounded-3xl after:pointer-events-none bristol-enterprise-card"
        >
          <div className="relative flex items-center justify-center gap-4 z-10">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-bristol-gold drop-shadow-lg" />
            ) : (
              <div className="p-2 rounded-xl bg-gradient-to-br from-bristol-gold/30 to-amber-400/20 shadow-inner group-hover:animate-pulse">
                <Cpu className="h-6 w-6 text-bristol-gold drop-shadow-lg animate-pulse" />
              </div>
            )}
            <div className="text-center">
              <div className="font-black text-xl tracking-wide drop-shadow-lg">
                {isLoading ? 'ANALYZING...' : 'RUN ANALYSIS'}
              </div>
              <div className="text-xs text-amber-300 font-medium -mt-1">
                Bristol Intelligence
              </div>
            </div>
            <Cpu className="h-4 w-4 text-amber-300/70" />
          </div>
        </Button>
        
        {data && (
          <>
            <Button
              onClick={handleSaveSnapshot}
              disabled={isSubmitting}
              variant="outline"
              className="border-gray-300 text-gray-900 hover:bg-gray-100"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Snapshot
            </Button>
            
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="border-gray-300 text-gray-900 hover:bg-gray-100"
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
            <Card className="bg-gradient-to-br from-green-50/90 to-emerald-100/60 border-2 border-green-200/50 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-700 font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Current Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-800 to-emerald-600 bg-clip-text text-transparent">
                  {data.rows.length > 0 ? formatCurrency(data.rows[data.rows.length - 1].value) : 'N/A'}
                </div>
                <div className="text-xs text-green-600 font-medium">USD Economic Value</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50/90 to-cyan-100/60 border-2 border-blue-200/50 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-700 font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Annual Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-blue-800 font-bold">
                  {data.rows.length >= 2 ? 
                    formatChange(((data.rows[data.rows.length - 1].value - data.rows[data.rows.length - 2].value) / data.rows[data.rows.length - 2].value) * 100, true) 
                    : 'N/A'
                  }
                </div>
                <div className="text-xs text-blue-600 font-medium">Year-over-year change</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50/90 to-indigo-100/60 border-2 border-purple-200/50 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-purple-700 font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  Data Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-800 to-indigo-600 bg-clip-text text-transparent">
                  {data.rows.length} years
                </div>
                <div className="text-xs text-purple-600 font-medium">Historical dataset</div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-white/95 to-green-50/80 border-2 border-green-200/60 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-800 font-bold text-xl flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  Economic Intelligence - {data.meta.label}
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  Real-time Data Analysis • {data.meta.source}
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
    </div>
  );
}