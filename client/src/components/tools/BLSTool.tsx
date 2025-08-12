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
  label: string;
  level: string;
  state: string;
  county: string;
  msa: string;
  rows: Array<{
    date: string;
    value: number;
    year: number;
    month: number;
  }>;
  metrics: {
    latest: number;
    change12Mo: number | null;
    change24Mo: number | null;
    changePercent12Mo: number | null;
    changePercent24Mo: number | null;
  };
  dataSource: string;
  lastUpdated: string;
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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/tools/bls', level, state, county, msa, start, end],
    enabled: false // Only fetch when user clicks Run
  }) as { data: BLSData; isLoading: boolean; refetch: any };

  const handleRun = () => {
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
      data.rows.map(row => `${row.date},${row.value}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bls_unemployment_${level}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = data ? {
    labels: data.rows.map(row => row.date),
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="level" className="text-gray-900">Geographic Level</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="bg-white border-gray-300 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              <SelectItem value="county">County</SelectItem>
              <SelectItem value="msa">Metropolitan Area</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {level === "county" && (
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

        {level === "msa" && (
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
          <Label htmlFor="start" className="text-gray-900">Start Date</Label>
          <Input
            id="start"
            type="month"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>

        <div>
          <Label htmlFor="end" className="text-gray-900">End Date</Label>
          <Input
            id="end"
            type="month"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="bg-white border-gray-300 text-gray-900"
          />
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

      {/* Results */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KPI Cards */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-white border-gray-300 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Current Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{data.metrics.latest.toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">12-Month Change</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-gray-900">
                  {formatChange(data.metrics.change12Mo)} 
                  <span className="text-sm text-gray-500">pts</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-300 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">24-Month Change</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-gray-900">
                  {formatChange(data.metrics.change24Mo)}
                  <span className="text-sm text-gray-500">pts</span>
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