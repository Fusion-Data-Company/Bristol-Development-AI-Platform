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

interface BEAData {
  label: string;
  geo: string;
  msa: string;
  state: string;
  county: string;
  rows: Array<{
    year: number;
    value: number;
    unit: string;
  }>;
  metrics: {
    latest: number;
    change1Yr: number | null;
    changePercent1Yr: number | null;
    cagr5Yr: number | null;
    unit: string;
  };
  dataSource: string;
  lastUpdated: string;
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
      "Year,Value,Unit\n" +
      data.rows.map(row => `${row.year},${row.value},"${row.unit}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bea_${geo}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = data ? {
    labels: data.rows.map(row => row.year.toString()),
    datasets: [
      {
        label: data.label,
        data: data.rows.map(row => row.value),
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
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="geo" className="text-gray-900">Geographic Level</Label>
          <Select value={geo} onValueChange={setGeo}>
            <SelectTrigger className="bg-white border-gray-300 text-gray-900">
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
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            <div>
              <Label htmlFor="county" className="text-gray-900">County FIPS</Label>
              <Input
                id="county"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                placeholder="119 (Mecklenburg)"
                className="bg-white border-gray-300 text-gray-900"
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
              className="bg-white border-gray-300 text-gray-900"
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
            className="bg-white border-gray-300 text-gray-900"
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
            className="bg-white border-gray-300 text-gray-900"
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
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KPI Cards */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-white border-gray-300 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Latest Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.metrics.latest)}</div>
                <div className="text-xs text-gray-500">{data.metrics.unit}</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">1-Year Change</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-gray-900">
                  {formatChange(data.metrics.changePercent1Yr, true)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">5-Year CAGR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-gray-900">
                  {formatChange(data.metrics.cagr5Yr, true)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-gray-300 shadow-md">
              <CardHeader>
                <CardTitle className="text-gray-900">{data.label} Over Time</CardTitle>
                <CardDescription className="text-gray-600">
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
        </div>
      )}
    </div>
  );
}