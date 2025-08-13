import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, Save, TrendingUp, TrendingDown, Minus, BarChart3, Brain, Cpu, Briefcase } from "lucide-react";
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
    <div className="space-y-8">
      {/* MEGA HEADER */}
      <div className="text-center space-y-6 bristol-enterprise-card p-12 rounded-3xl border-4 border-bristol-gold/40 shadow-2xl bg-gradient-to-br from-white/95 via-blue-50/50 to-purple-50/50 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-bristol-gold/10 animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl animate-bounce">
              <Briefcase className="h-16 w-16 text-blue-600 drop-shadow-lg" />
            </div>
            <h1 className="text-7xl font-black bg-gradient-to-r from-blue-800 via-purple-600 via-bristol-gold to-indigo-800 bg-clip-text text-transparent drop-shadow-lg tracking-tight">
              📊 Bureau of Labor Statistics
            </h1>
          </div>
          <div className="space-y-4">
            <p className="text-slate-800 text-3xl font-black max-w-5xl mx-auto leading-relaxed">
              🚀 <span className="bg-gradient-to-r from-bristol-gold to-amber-600 bg-clip-text text-transparent">Real-Time Employment Intelligence Platform</span>
            </p>
            <p className="text-slate-700 text-xl font-bold max-w-4xl mx-auto leading-relaxed">
              💼 Live Employment Data • 📈 Unemployment Rates • 🎯 Labor Market Intelligence 
              <br />
              ⚡ Workforce Analysis • 🔍 Economic Insights • 📊 Bristol-Powered Analytics
            </p>
          </div>
        </div>
      </div>

      {/* ENHANCED Controls */}
      <div className="bristol-enterprise-card rounded-3xl p-12 shadow-2xl border-4 border-bristol-gold/40 bg-gradient-to-br from-white/98 via-blue-50/30 to-bristol-gold/10 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-bristol-gold/5 to-transparent animate-pulse"></div>
        <div className="relative z-10">
          <h3 className="text-3xl font-black text-slate-900 mb-8 text-center bg-gradient-to-r from-bristol-maroon to-bristol-gold bg-clip-text text-transparent">
            🎛️ Intelligence Configuration Panel
          </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="level" className="text-slate-900 font-black text-xl tracking-wide flex items-center gap-2">
              📍 Geographic Level
            </Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="bg-gradient-to-r from-bristol-gold/10 via-white/95 to-amber-50/80 border-3 border-bristol-gold/40 text-slate-900 font-black shadow-xl hover:border-bristol-gold/70 hover:scale-105 hover:shadow-2xl transition-all duration-300 rounded-2xl h-16 text-lg backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gradient-to-br from-white/98 to-bristol-gold/10 border-3 border-bristol-gold/50 rounded-2xl shadow-2xl backdrop-blur-xl p-2">
                <SelectItem value="county">County</SelectItem>
                <SelectItem value="msa">Metropolitan Area</SelectItem>
              </SelectContent>
            </Select>
          </div>

        {level === "county" && (
          <>
            <div>
              <Label htmlFor="state" className="text-slate-900 font-black text-xl tracking-wide flex items-center gap-2">
                🏛️ State FIPS Code
              </Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="37 (NC) 🌟"
                className="bg-gradient-to-r from-red-50/80 via-white/95 to-pink-50/80 border-3 border-red-400/50 text-slate-900 font-black shadow-xl hover:border-red-500/70 hover:scale-105 hover:shadow-2xl focus:border-bristol-gold/70 focus:ring-4 focus:ring-bristol-gold/20 transition-all duration-300 rounded-2xl h-16 text-lg backdrop-blur-sm"
              />
            </div>
            <div>
              <Label htmlFor="county" className="text-slate-900 font-black text-xl tracking-wide flex items-center gap-2">
                🏘️ County FIPS Code
              </Label>
              <Input
                id="county"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                placeholder="119 (Mecklenburg) ✨"
                className="bg-gradient-to-r from-green-50/80 via-white/95 to-emerald-50/80 border-3 border-green-400/50 text-slate-900 font-black shadow-xl hover:border-green-500/70 hover:scale-105 hover:shadow-2xl focus:border-bristol-gold/70 focus:ring-4 focus:ring-bristol-gold/20 transition-all duration-300 rounded-2xl h-16 text-lg backdrop-blur-sm"
              />
            </div>
          </>
        )}

        {level === "msa" && (
            <div>
              <Label htmlFor="msa" className="text-slate-900 font-black text-xl tracking-wide flex items-center gap-2">
                🌆 Metro Area Code
              </Label>
              <Input
                id="msa"
                value={msa}
                onChange={(e) => setMsa(e.target.value)}
                placeholder="16740 (Charlotte) 🚀"
                className="bg-gradient-to-r from-purple-50/80 via-white/95 to-indigo-50/80 border-3 border-purple-400/50 text-slate-900 font-black shadow-xl hover:border-purple-500/70 hover:scale-105 hover:shadow-2xl focus:border-bristol-gold/70 focus:ring-4 focus:ring-bristol-gold/20 transition-all duration-300 rounded-2xl h-16 text-lg backdrop-blur-sm"
              />
            </div>
        )}

          <div>
            <Label htmlFor="start" className="text-slate-900 font-black text-xl tracking-wide flex items-center gap-2">
              📅 Start Date
            </Label>
            <Input
              id="start"
              type="month"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="bg-gradient-to-r from-orange-50/80 via-white/95 to-amber-50/80 border-3 border-orange-400/50 text-slate-900 font-black shadow-xl hover:border-orange-500/70 hover:scale-105 hover:shadow-2xl focus:border-bristol-gold/70 focus:ring-4 focus:ring-bristol-gold/20 transition-all duration-300 rounded-2xl h-16 text-lg backdrop-blur-sm"
            />
          </div>

          <div>
            <Label htmlFor="end" className="text-slate-900 font-black text-xl tracking-wide flex items-center gap-2">
              🏁 End Date
            </Label>
            <Input
              id="end"
              type="month"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="bg-gradient-to-r from-teal-50/80 via-white/95 to-cyan-50/80 border-3 border-teal-400/50 text-slate-900 font-black shadow-xl hover:border-teal-500/70 hover:scale-105 hover:shadow-2xl focus:border-bristol-gold/70 focus:ring-4 focus:ring-bristol-gold/20 transition-all duration-300 rounded-2xl h-16 text-lg backdrop-blur-sm"
            />
          </div>
        </div>
        </div>
      </div>

      {/* 🚀 ENHANCED Action Buttons */}
      <div className="flex gap-6 justify-center">
        <Button 
          onClick={handleRun} 
          disabled={isLoading}
          className="bristol-elite-button relative text-white font-black text-lg px-12 py-6 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden shadow-2xl min-h-[80px]"
        >
          <div className="flex items-center gap-3">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            ) : (
              <div className="relative">
                <Brain className="h-6 w-6 text-cyan-400 drop-shadow-lg" />
                <div className="absolute inset-0 animate-pulse opacity-50">
                  <Brain className="h-6 w-6 text-cyan-300" />
                </div>
              </div>
            )}
            <div>
              <div className="text-cyan-400 font-black tracking-wide">
                RUN ANALYSIS
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
              className="bristol-enterprise-card border-2 border-bristol-gold/30 text-slate-800 font-bold hover:bg-bristol-gold/10 hover:border-bristol-gold/60 hover:scale-105 rounded-2xl px-8 py-4 shadow-lg transition-all duration-300"
            >
              {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin text-bristol-gold" />}
              <Save className="mr-2 h-5 w-5 text-bristol-gold" />
              Save Snapshot
            </Button>
            
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="bristol-enterprise-card border-2 border-bristol-gold/30 text-slate-800 font-bold hover:bg-bristol-gold/10 hover:border-bristol-gold/60 hover:scale-105 rounded-2xl px-8 py-4 shadow-lg transition-all duration-300"
            >
              <Download className="mr-2 h-5 w-5 text-bristol-gold" />
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
            <Card className="bristol-enterprise-card border-3 border-bristol-gold/40 shadow-2xl rounded-2xl backdrop-blur-lg bg-gradient-to-br from-white/95 via-bristol-gold/5 to-amber-50/80">
              <CardHeader className="pb-3 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-bristol-gold to-amber-400 rounded-t-2xl"></div>
                <CardTitle className="text-lg text-slate-800 font-black flex items-center gap-3 mt-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-bristol-gold/20 to-amber-400/20 shadow-lg">
                    <BarChart3 className="h-6 w-6 text-bristol-gold drop-shadow-md" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-bristol-maroon to-bristol-gold bg-clip-text text-transparent">Employment Rate</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black bg-gradient-to-r from-bristol-maroon via-bristol-gold to-amber-600 bg-clip-text text-transparent drop-shadow-lg">
                  {data.rows.length > 0 ? `${data.rows[data.rows.length - 1].value.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-slate-700 font-bold mt-2 tracking-wide">Current Labor Market Status</div>
              </CardContent>
            </Card>

            <Card className="bristol-enterprise-card border-3 border-emerald-400/40 shadow-2xl rounded-2xl backdrop-blur-lg bg-gradient-to-br from-white/95 via-emerald-50/20 to-green-50/80">
              <CardHeader className="pb-3 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-400 rounded-t-2xl"></div>
                <CardTitle className="text-lg text-slate-800 font-black flex items-center gap-3 mt-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400/20 to-green-400/20 shadow-lg">
                    <TrendingUp className="h-6 w-6 text-emerald-600 drop-shadow-md" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">Annual Change</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black bg-gradient-to-r from-emerald-700 via-green-600 to-teal-600 bg-clip-text text-transparent drop-shadow-lg">
                  {data.rows.length >= 12 ? 
                    formatChange(data.rows[data.rows.length - 1].value - data.rows[data.rows.length - 12].value)
                    : 'N/A'
                  }
                  <span className="text-lg text-emerald-600 font-bold ml-1">pts</span>
                </div>
                <div className="text-sm text-slate-700 font-bold mt-2 tracking-wide">12-Month Trend Analysis</div>
              </CardContent>
            </Card>

            <Card className="bristol-enterprise-card border-3 border-purple-400/40 shadow-2xl rounded-2xl backdrop-blur-lg bg-gradient-to-br from-white/95 via-purple-50/20 to-indigo-50/80">
              <CardHeader className="pb-3 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-400 rounded-t-2xl"></div>
                <CardTitle className="text-lg text-slate-800 font-black flex items-center gap-3 mt-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-indigo-400/20 shadow-lg">
                    <BarChart3 className="h-6 w-6 text-purple-600 drop-shadow-md" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">Dataset Coverage</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black bg-gradient-to-r from-purple-700 via-indigo-600 to-violet-600 bg-clip-text text-transparent drop-shadow-lg">
                  {data.rows.length} <span className="text-lg">months</span>
                </div>
                <div className="text-sm text-slate-700 font-bold mt-2 tracking-wide">Historical Data Points</div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2">
            <Card className="bristol-enterprise-card border-3 border-bristol-gold/40 shadow-2xl rounded-2xl backdrop-blur-lg bg-gradient-to-br from-white/98 via-blue-50/30 to-bristol-gold/10">
              <CardHeader className="relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-bristol-gold via-blue-500 to-purple-600 rounded-t-2xl"></div>
                <CardTitle className="text-2xl text-slate-800 font-black flex items-center gap-4 mt-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-bristol-gold/20 to-blue-400/20 shadow-xl">
                    <BarChart3 className="h-8 w-8 text-bristol-gold drop-shadow-lg" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-bristol-maroon via-bristol-gold to-blue-600 bg-clip-text text-transparent">Employment Intelligence</span>
                    <div className="text-lg font-bold text-slate-700 mt-1">{data.meta.label}</div>
                  </div>
                </CardTitle>
                <CardDescription className="text-slate-700 font-bold text-lg mt-4 leading-relaxed">
                  <span className="bg-gradient-to-r from-bristol-gold to-amber-600 bg-clip-text text-transparent">Real-time Labor Market Data</span> • {data.meta.source}
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