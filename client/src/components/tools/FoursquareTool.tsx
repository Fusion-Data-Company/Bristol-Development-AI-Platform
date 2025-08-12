import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { apiRequest } from "@/lib/queryClient";

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
    lat: string;
    lng: string;
    radius: string;
    categories: string;
    limit: string;
  };
  amenityScore: number;
  byCategory: Array<{
    name: string;
    id: string;
    count: number;
    weight: number;
  }>;
  places: Array<{
    fsq_id: string;
    name: string;
    category: string;
    distance_m: number;
    address: string;
  }>;
  totalPlaces: number;
  dataSource: string;
  lastUpdated: string;
}

export function FoursquareTool() {
  const [lat, setLat] = useState("35.2271"); // Charlotte default
  const [lng, setLng] = useState("-80.8431");
  const [radius, setRadius] = useState("1600"); // ~1 mile in meters
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/tools/foursquare', lat, lng, radius],
    enabled: false // Only fetch when user clicks Run
  }) as { data: FoursquareData; isLoading: boolean; refetch: any };

  const handleRun = () => {
    refetch();
  };

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
      "Name,Category,Distance (m),Address\n" +
      data.places.map(place => 
        `"${place.name}","${place.category}",${place.distance_m},"${place.address || ''}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `foursquare_places_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = data ? {
    labels: data.byCategory.slice(0, 8).map(cat => cat.name),
    datasets: [
      {
        label: 'Places Count',
        data: data.byCategory.slice(0, 8).map(cat => cat.count),
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                  <Star className="h-4 w-4 text-bristol-gold" />
                  Amenity Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-bristol-gold">{data.amenityScore}</div>
                <div className="text-xs text-gray-400">Higher is better</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Total Places</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg text-white">{data.totalPlaces}</div>
                <div className="text-xs text-gray-400">Within {Math.round(parseInt(radius) / 1609.34 * 10) / 10} miles</div>
              </CardContent>
            </Card>

            {/* Top Categories */}
            {data.byCategory.slice(0, 3).map((cat, index) => (
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
                  Data from {data.dataSource} • Last updated: {new Date(data.lastUpdated).toLocaleDateString()}
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
                  Top Places ({data.places.length})
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
                        <th className="text-left py-2">Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.places.slice(0, 25).map((place, index) => (
                        <tr key={place.fsq_id} className="border-b border-gray-800 hover:bg-gray-800">
                          <td className="py-2 font-medium">{place.name}</td>
                          <td className="py-2 text-gray-300">{place.category}</td>
                          <td className="text-right py-2 text-bristol-gold">
                            {formatDistance(place.distance_m)}
                          </td>
                          <td className="py-2 text-gray-400 text-sm">
                            {place.address || 'Address not available'}
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