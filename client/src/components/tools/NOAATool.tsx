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

  // Helper function for date formatting
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

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
          className="relative bg-gradient-to-r from-red-900 to-red-700 text-white border-2 border-red-400/60 shadow-2xl font-bold text-lg px-12 py-4 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-red-500/40 hover:border-red-300/70 hover:from-red-800 hover:to-red-600 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/5 before:to-transparent before:rounded-2xl before:pointer-events-none active:scale-95 z-10"
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
            <Card className="bg-gradient-to-br from-cyan-50/90 to-blue-100/60 border-2 border-cyan-200/50 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-cyan-700 font-semibold flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-cyan-600" />
                  Climate Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-800 to-blue-600 bg-clip-text text-transparent">
                  {data.rows.length}
                </div>
                <div className="text-xs text-cyan-600 font-medium">Data points discovered</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50/90 to-teal-100/60 border-2 border-emerald-200/50 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-emerald-700 font-semibold flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-emerald-600" />
                  Weather Stations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-teal-600 bg-clip-text text-transparent">
                  {data.meta.count || data.rows.length}
                </div>
                <div className="text-xs text-emerald-600 font-medium">Active monitoring sites</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50/90 to-indigo-100/60 border-2 border-purple-200/50 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-purple-700 font-semibold flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-purple-600" />
                  Data Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 px-3 py-2 rounded-lg border border-orange-200/50">
                    <Thermometer className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Temperature Data</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 px-3 py-2 rounded-lg border border-blue-200/50">
                    <Droplets className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Precipitation Data</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Items Table */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-to-br from-white/95 to-cyan-50/80 border-2 border-cyan-200/60 shadow-2xl rounded-xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-800 font-bold text-xl flex items-center gap-3">
                  <Cloud className="h-6 w-6 text-cyan-600" />
                  Climate Intelligence Matrix ({data.rows.length})
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  Live Data from {data.meta.source} • Temporal Range: {data.params.startDate} → {data.params.endDate}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-gradient-to-r from-cyan-200 to-blue-300">
                        <th className="text-left py-4 px-3 bg-gradient-to-r from-cyan-100/80 to-blue-100/60 rounded-l-lg font-bold text-slate-700">Station Identity</th>
                        <th className="text-left py-4 px-3 bg-gradient-to-r from-blue-100/60 to-emerald-100/60 font-bold text-slate-700">Geographic Coordinates</th>
                        <th className="text-left py-4 px-3 bg-gradient-to-r from-emerald-100/60 to-teal-100/60 font-bold text-slate-700">Temporal Coverage</th>
                        <th className="text-left py-4 px-3 bg-gradient-to-r from-teal-100/60 to-purple-100/60 font-bold text-slate-700">Data Streams</th>
                        <th className="text-left py-4 px-3 bg-gradient-to-r from-purple-100/60 to-pink-100/80 rounded-r-lg font-bold text-slate-700">Data Integrity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.slice(0, 50).map((item, index) => (
                        <tr key={item.id} className={`border-b border-slate-200/50 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-blue-50/30 transition-all duration-200 ${index % 2 === 0 ? 'bg-white/70' : 'bg-slate-50/50'}`}>
                          <td className="py-4 px-3">
                            <div className="font-bold text-slate-800 text-base">{item.name}</div>
                            <div className="text-sm text-cyan-600 font-medium bg-cyan-100/60 px-2 py-1 rounded-md inline-block mt-1">
                              ID: {item.id}
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="bg-gradient-to-r from-emerald-100 to-teal-100 px-3 py-2 rounded-lg border border-emerald-200/50">
                              <div className="font-semibold text-slate-800">
                                {item.latitude && item.longitude ? 
                                  `${item.latitude.toFixed(4)}°, ${item.longitude.toFixed(4)}°` : 'Coordinates Unavailable'}
                              </div>
                              {item.elevation && (
                                <div className="text-sm text-emerald-700 font-medium">Elevation: {item.elevation}m ASL</div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-2 rounded-lg border border-blue-200/50">
                              <div className="text-sm font-semibold text-blue-800">Start: {formatDate(item.mindate)}</div>
                              <div className="text-sm font-semibold text-blue-800">End: {formatDate(item.maxdate)}</div>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex flex-wrap gap-2">
                              <div className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 px-3 py-2 rounded-lg border border-orange-200/50 shadow-sm">
                                <Thermometer className="h-4 w-4 text-orange-600" />
                                <span className="text-sm font-bold text-orange-800">TEMP</span>
                              </div>
                              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 px-3 py-2 rounded-lg border border-blue-200/50 shadow-sm">
                                <Droplets className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-bold text-blue-800">PRECIP</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-lg border border-purple-200/50 text-center">
                              <div className="text-lg font-bold text-purple-800">
                                {item.datacoverage ? 
                                  `${(item.datacoverage * 100).toFixed(1)}%` : 'N/A'}
                              </div>
                              <div className="text-xs text-purple-600 font-medium">Coverage Rate</div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {data.rows.length > 50 && (
                  <div className="mt-6 text-center">
                    <div className="bg-gradient-to-r from-slate-100 to-blue-100 px-6 py-3 rounded-xl border border-slate-200/60 inline-block">
                      <div className="text-slate-700 font-semibold">
                        Displaying 50 of {data.rows.length} records
                      </div>
                      <div className="text-sm text-slate-600">Export CSV for complete intelligence dataset</div>
                    </div>
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