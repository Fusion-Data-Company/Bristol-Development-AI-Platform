import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, Save, MapPin, Star } from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface FoursquareData {
  params: {
    lat: number;
    lng: number;
    radius: number;
    categories: string;
    limit: number;
  };
  rows: Array<{
    fsq_id: string;
    name: string;
    category: string;
    category_id: string | null;
    distance_m: number | null;
    lat: number | null;
    lng: number | null;
  }>;
  meta: {
    score: number;
    byCategory: Array<{
      name: string;
      id: number | null;
      count: number;
      weight: number;
    }>;
    source: string;
  };
}

export function FoursquareTool() {
  const [inputMode, setInputMode] = useState<'coordinates' | 'address'>('address');
  const [lat, setLat] = useState("35.2271"); // Charlotte default
  const [lng, setLng] = useState("-80.8431");
  const [address, setAddress] = useState("100 N Tryon St, Charlotte, NC"); // Charlotte default
  const [radius, setRadius] = useState("1600"); // ~1 mile in meters
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/tools/foursquare', lat, lng, radius],
    queryFn: () => {
      return fetch(`/api/tools/foursquare/${lat}/${lng}/${radius}`, {
        credentials: 'include'
      }).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      });
    },
    enabled: false // Only fetch when user clicks Run
  }) as { data: FoursquareData; isLoading: boolean; refetch: any };

  const geocodeAddress = async (addressStr: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Use OpenStreetMap Nominatim for free geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Bristol-Site-Intelligence/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const handleRun = async () => {
    if (inputMode === 'address') {
      if (!address.trim()) {
        toast({
          title: "Error",
          description: "Please enter an address.",
          variant: "destructive"
        });
        return;
      }

      setIsGeocoding(true);
      const coords = await geocodeAddress(address);
      setIsGeocoding(false);

      if (!coords) {
        toast({
          title: "Geocoding Failed",
          description: "Could not find coordinates for the provided address. Please try a different address or use coordinates directly.",
          variant: "destructive"
        });
        return;
      }

      // Update coordinates for display and future use
      setLat(coords.lat.toString());
      setLng(coords.lng.toString());
      
      console.log('Foursquare Tool: Running analysis with geocoded params:', { 
        address, 
        lat: coords.lat, 
        lng: coords.lng, 
        radius 
      });

      // Wait for state to update, then invalidate and refetch
      setTimeout(async () => {
        await queryClient.invalidateQueries({
          queryKey: ['/api/tools/foursquare']
        });
        refetch();
      }, 100);
    } else {
      console.log('Foursquare Tool: Running analysis with params:', { lat, lng, radius });
      refetch();
    }
  };

  // Debug logging when data changes
  React.useEffect(() => {
    console.log('Foursquare Tool: Data changed:', { hasData: !!data, data });
  }, [data]);

  const handleSaveSnapshot = async () => {
    if (!data) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest('/api/snapshots', 'POST', {
        tool: 'foursquare',
        params: { lat, lng, radius },
        data
      });
      
      toast({
        title: "Snapshot Saved",
        description: "Foursquare data snapshot has been saved successfully."
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
      "Name,Category,Distance (m),Latitude,Longitude\n" +
      data.rows.map(place => 
        `"${place.name}","${place.category}",${place.distance_m || 'N/A'},${place.lat || 'N/A'},${place.lng || 'N/A'}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `foursquare_places_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = data && data.meta?.byCategory ? {
    labels: data.meta.byCategory.slice(0, 8).map(cat => cat.name),
    datasets: [
      {
        label: 'Places Count',
        data: data.meta.byCategory.slice(0, 8).map(cat => cat.count),
        backgroundColor: '#D4A574', // Bristol gold
        borderColor: '#D4A574',
        borderWidth: 1
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

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="space-y-4">
        {/* Input Mode Selector */}
        <div>
          <Label className="text-gray-900">Location Input</Label>
          <Select value={inputMode} onValueChange={(value: 'coordinates' | 'address') => setInputMode(value)}>
            <SelectTrigger className="bg-white border-gray-300 text-gray-900 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              <SelectItem value="coordinates">Coordinates (Lat/Lng)</SelectItem>
              <SelectItem value="address">Address</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {inputMode === 'coordinates' ? (
            <>
              <div>
                <Label htmlFor="lat" className="text-gray-900">Latitude</Label>
                <Input
                  id="lat"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="35.2271"
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <Label htmlFor="lng" className="text-gray-900">Longitude</Label>
                <Input
                  id="lng"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="-80.8431"
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <Label htmlFor="address" className="text-gray-900">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="100 N Tryon St, Charlotte, NC"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          )}

          <div>
            <Label htmlFor="radius" className="text-gray-900">Radius (meters)</Label>
            <Input
              id="radius"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              placeholder="1600"
              className="bg-white border-gray-300 text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={handleRun} 
          disabled={isLoading || isGeocoding}
          className="bg-bristol-gold text-black hover:bg-bristol-gold/90 border-2 border-bristol-gold shadow-lg font-semibold px-6 py-2"
        >
          {(isLoading || isGeocoding) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isGeocoding ? 'Finding Location...' : 'Run Analysis'}
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
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                  <Star className="h-4 w-4 text-bristol-gold" />
                  Amenity Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-bristol-gold">{data.meta.score.toFixed(1)}</div>
                <div className="text-xs text-gray-400">Higher is better</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Total Places</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-white">{data.rows.length}</div>
                <div className="text-xs text-gray-400">Within {Math.round(parseInt(radius) / 1609.34 * 10) / 10} miles</div>
              </CardContent>
            </Card>

            {/* Top Categories */}
            {data.meta.byCategory.slice(0, 3).map((cat, index) => (
              <Card key={cat.id} className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-300">{cat.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg text-white">{cat.count} places</div>
                  <div className="text-xs text-gray-400">Weight: {cat.weight}x</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Places by Category</CardTitle>
                <CardDescription className="text-gray-400">
                  Data from {data.meta.source}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData && (
                  <div className="h-64">
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Places Table */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Top Places ({data.rows.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-white">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Category</th>
                        <th className="text-right py-2">Distance</th>
                        <th className="text-left py-2">Coordinates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.slice(0, 25).map((place, index) => (
                        <tr key={place.fsq_id} className="border-b border-gray-800 hover:bg-gray-800">
                          <td className="py-2 font-medium">{place.name}</td>
                          <td className="py-2 text-gray-300">{place.category}</td>
                          <td className="text-right py-2 text-bristol-gold">
                            {place.distance_m ? formatDistance(place.distance_m) : 'N/A'}
                          </td>
                          <td className="py-2 text-gray-400 text-sm">
                            {place.lat && place.lng ? `${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}` : 'N/A'}
                          </td>
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