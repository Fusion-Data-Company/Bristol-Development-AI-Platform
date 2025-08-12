import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, Save, Cloud, Thermometer, Droplets, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface NOAAData {
  params: {
    bbox: string;
    startDate: string;
    endDate: string;
  };
  rows: Array<{
    id: string;
    name: string;
    latitude?: number;
    longitude?: number;
    elevation?: number;
    mindate?: string;
    maxdate?: string;
    datacoverage?: number;
  }>;
  meta: {
    source: string;
    count?: number;
    station?: string;
  };
}

export function NOAATool() {
  const [lat, setLat] = useState("35.2271"); // Charlotte default
  const [lng, setLng] = useState("-80.8431");
  const [dataset, setDataset] = useState("daily-summaries");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Set to 30 days ago to ensure data exists
    return date.toISOString().slice(0, 10);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/tools/noaa', lat, lng, dataset, startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams({
        lat,
        lng,
        dataset,
        startDate,
        endDate
      });
      return fetch(`/api/tools/noaa?${params}`, {
        credentials: 'include'
      }).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      });
    },
    enabled: false // Only fetch when user clicks Run
  }) as { data: NOAAData; isLoading: boolean; refetch: any };

  const handleRun = () => {
    console.log('NOAA Tool: Running analysis with params:', { lat, lng, dataset, startDate, endDate });
    refetch();
  };

  const handleSaveSnapshot = async () => {
    if (!data) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest('/api/snapshots', 'POST', {
        tool: 'noaa',
        params: { lat, lng, dataset, startDate, endDate },
        data
      });
      
      toast({
        title: "Snapshot Saved",
        description: "NOAA climate data snapshot has been saved successfully."
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
      "ID,Name,Latitude,Longitude,Elevation,Min Date,Max Date,Data Coverage\n" +
      data.rows.map(item => 
        `"${item.id}","${item.name}","${item.latitude || ''}","${item.longitude || ''}","${item.elevation || ''}","${item.mindate || ''}","${item.maxdate || ''}","${item.datacoverage || ''}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `noaa_climate_${dataset}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  const getDataTypeIcon = (dataTypeId: string) => {
    if (dataTypeId.includes('TEMP') || dataTypeId.includes('TMAX') || dataTypeId.includes('TMIN')) {
      return <Thermometer className="h-3 w-3 text-orange-400" />;
    }
    if (dataTypeId.includes('PRCP') || dataTypeId.includes('RAIN')) {
      return <Droplets className="h-3 w-3 text-blue-400" />;
    }
    return <Cloud className="h-3 w-3 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="lat" className="text-slate-700 font-medium">Latitude</Label>
            <Input
              id="lat"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="35.2271"
              className="bg-white/90 border-cyan-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors"
            />
          </div>

          <div>
            <Label htmlFor="lng" className="text-slate-700 font-medium">Longitude</Label>
            <Input
              id="lng"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="-80.8431"
              className="bg-white/90 border-cyan-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors"
            />
          </div>

          <div>
            <Label htmlFor="dataset" className="text-slate-700 font-medium">Dataset</Label>
            <Select value={dataset} onValueChange={setDataset}>
              <SelectTrigger className="bg-white/90 border-cyan-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-cyan-200/60">
                <SelectItem value="daily-summaries">Daily Summaries</SelectItem>
                <SelectItem value="climate-normals">Climate Normals</SelectItem>
                <SelectItem value="global-summary">Global Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="startDate" className="text-slate-700 font-medium">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white/90 border-cyan-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors"
            />
          </div>

          <div>
            <Label htmlFor="endDate" className="text-slate-700 font-medium">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white/90 border-cyan-200/60 text-slate-700 shadow-sm hover:border-bristol-gold/40 transition-colors"
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

      {/* Results */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* KPI Cards */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.rows.length}</div>
                <div className="text-xs text-gray-400">Climate datasets found</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Stations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-white">{data.meta.count || data.rows.length}</div>
                <div className="text-xs text-gray-400">Weather stations</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Data Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white">
                    <Thermometer className="h-3 w-3 text-orange-400" />
                    <span className="text-xs">Temperature: Available</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Droplets className="h-3 w-3 text-blue-400" />
                    <span className="text-xs">Precipitation: Available</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Items Table */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Climate Data Items ({data.rows.length})
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Data from {data.meta.source} • Date Range: {data.params.startDate} - {data.params.endDate}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-white">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Location</th>
                        <th className="text-left py-2">Date Range</th>
                        <th className="text-left py-2">Data Types</th>
                        <th className="text-left py-2">Coverage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.slice(0, 50).map((item, index) => (
                        <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800">
                          <td className="py-2">
                            <div className="font-medium text-white">{item.name}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Station ID: {item.id}
                            </div>
                          </td>
                          <td className="py-2 text-gray-300">
                            {item.latitude && item.longitude ? 
                              `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}` : 'N/A'}
                            {item.elevation && (
                              <div className="text-xs text-gray-400">Elev: {item.elevation}m</div>
                            )}
                          </td>
                          <td className="py-2 text-gray-300 text-sm">
                            <div>{item.mindate || 'N/A'}</div>
                            <div>{item.maxdate || 'N/A'}</div>
                          </td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-1">
                              <div className="flex items-center gap-1 text-xs bg-gray-800 px-2 py-1 rounded">
                                <Thermometer className="h-3 w-3 text-orange-400" />
                                TEMP
                              </div>
                              <div className="flex items-center gap-1 text-xs bg-gray-800 px-2 py-1 rounded">
                                <Droplets className="h-3 w-3 text-blue-400" />
                                PRCP
                              </div>
                            </div>
                          </td>
                          <td className="py-2 text-gray-300">
                            {item.datacoverage ? 
                              `${(item.datacoverage * 100).toFixed(1)}%` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {data.rows.length > 50 && (
                  <div className="mt-4 text-center text-gray-400 text-sm">
                    Showing 50 of {data.rows.length} items. Export CSV for complete data.
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