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
    lat: string;
    lng: string;
    dataset: string;
    bbox: string;
    startDate: string;
    endDate: string;
  };
  count: number;
  items: Array<{
    id: string;
    name: string;
    summary: string | null;
    station: any;
    stationId: string | null;
    dataTypes: Array<{
      id: string;
      name?: string;
    }>;
    startDate: string | null;
    endDate: string | null;
    bbox: string | null;
    links: Array<{
      rel: string;
      href: string;
      type?: string;
    }>;
  }>;
  metrics: {
    totalItems: number;
    uniqueStations: number;
    hasTemperature: boolean;
    hasPrecipitation: boolean;
    dateRange: string;
  };
  dataSource: string;
  lastUpdated: string;
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
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/tools/noaa', lat, lng, dataset, startDate, endDate],
    enabled: false // Only fetch when user clicks Run
  }) as { data: NOAAData; isLoading: boolean; refetch: any };

  const handleRun = () => {
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
      "ID,Name,Station ID,Start Date,End Date,Data Types\n" +
      data.items.map(item => 
        `"${item.id}","${item.name}","${item.stationId || ''}","${item.startDate || ''}","${item.endDate || ''}","${item.dataTypes.map(dt => dt.id).join('; ')}"`
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <Label htmlFor="lat" className="text-white">Latitude</Label>
          <Input
            id="lat"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="35.2271"
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        <div>
          <Label htmlFor="lng" className="text-white">Longitude</Label>
          <Input
            id="lng"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="-80.8431"
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        <div>
          <Label htmlFor="dataset" className="text-white">Dataset</Label>
          <Select value={dataset} onValueChange={setDataset}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="daily-summaries">Daily Summaries</SelectItem>
              <SelectItem value="climate-normals">Climate Normals</SelectItem>
              <SelectItem value="global-summary">Global Summary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="startDate" className="text-white">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        <div>
          <Label htmlFor="endDate" className="text-white">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* KPI Cards */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.metrics.totalItems}</div>
                <div className="text-xs text-gray-400">Climate datasets found</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Stations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-white">{data.metrics.uniqueStations}</div>
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
                    <span className="text-xs">Temperature: {data.metrics.hasTemperature ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Droplets className="h-3 w-3 text-blue-400" />
                    <span className="text-xs">Precipitation: {data.metrics.hasPrecipitation ? 'Yes' : 'No'}</span>
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
                  Climate Data Items ({data.count})
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Data from {data.dataSource} • Date Range: {data.metrics.dateRange}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-white">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Station ID</th>
                        <th className="text-left py-2">Date Range</th>
                        <th className="text-left py-2">Data Types</th>
                        <th className="text-left py-2">Links</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.slice(0, 50).map((item, index) => (
                        <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800">
                          <td className="py-2">
                            <div className="font-medium text-white">{item.name}</div>
                            {item.summary && (
                              <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                {item.summary}
                              </div>
                            )}
                          </td>
                          <td className="py-2 text-gray-300">
                            {item.stationId || 'N/A'}
                          </td>
                          <td className="py-2 text-gray-300 text-sm">
                            <div>{formatDate(item.startDate)}</div>
                            <div>{formatDate(item.endDate)}</div>
                          </td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-1">
                              {item.dataTypes.slice(0, 3).map((dt, dtIndex) => (
                                <div key={dtIndex} className="flex items-center gap-1 text-xs bg-gray-800 px-2 py-1 rounded">
                                  {getDataTypeIcon(dt.id)}
                                  {dt.id}
                                </div>
                              ))}
                              {item.dataTypes.length > 3 && (
                                <div className="text-xs text-gray-400">+{item.dataTypes.length - 3} more</div>
                              )}
                            </div>
                          </td>
                          <td className="py-2">
                            {item.links.slice(0, 2).map((link, linkIndex) => (
                              <a
                                key={linkIndex}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-bristol-gold hover:text-bristol-gold/80 mr-2"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {link.rel || 'Data'}
                              </a>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {data.items.length > 50 && (
                  <div className="mt-4 text-center text-gray-400 text-sm">
                    Showing 50 of {data.items.length} items. Export CSV for complete data.
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