import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Layers, Zap, Search } from "lucide-react";

export default function Map() {
  const [searchValue, setSearchValue] = useState("");
  const [mapCenter, setMapCenter] = useState({ lat: 33.7490, lng: -84.3880 }); // Atlanta

  const handleSearch = () => {
    if (searchValue.trim()) {
      // Simulate search - in real app would use geocoding
      console.log("Searching for:", searchValue);
    }
  };

  return (
    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
      {/* Map Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-md">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search location..."
            className="border-0 focus:ring-0 p-0 w-48"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button size="sm" onClick={handleSearch}>Go</Button>
        </div>
        
        <div className="bg-white rounded-lg px-3 py-2 shadow-md">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Bristol Analytics</span>
          </div>
        </div>
      </div>

      {/* Map Layer Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button size="sm" variant="outline" className="bg-white shadow-md">
          <MapPin className="h-4 w-4 mr-2" />
          Sites
        </Button>
        <Button size="sm" variant="outline" className="bg-white shadow-md">
          <Zap className="h-4 w-4 mr-2" />
          Heat Map
        </Button>
      </div>

      {/* Map Placeholder */}
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Interactive Map Loading
          </h3>
          <p className="text-gray-500 max-w-md">
            MapLibre GL integration with site markers, demographic overlays, and market intelligence layers.
          </p>
          <div className="mt-4 text-sm text-gray-400">
            Center: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Site Markers Simulation */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="relative">
          <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
          <div className="absolute -top-8 -left-16 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            Sample Site
          </div>
        </div>
      </div>
    </div>
  );
}