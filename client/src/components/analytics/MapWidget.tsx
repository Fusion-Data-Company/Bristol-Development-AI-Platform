import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Layers, ToggleLeft, ToggleRight, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: "active" | "under_review" | "archived";
  bristolScore?: number;
  address: string;
}

interface MapWidgetProps {
  sites?: MapSite[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onSiteClick?: (site: MapSite) => void;
}

export function MapWidget({ 
  sites = [], 
  center = { lat: 36.0622, lng: -86.7816 }, // Franklin, TN
  zoom = 11,
  className,
  onSiteClick 
}: MapWidgetProps) {
  const [mapProvider, setMapProvider] = useState<"maplibre" | "arcgis">("maplibre");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<MapSite | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Mock sites data for demonstration
  const mockSites: MapSite[] = [
    {
      id: "franklin-main",
      name: "Franklin Main Street",
      latitude: 36.0618,
      longitude: -86.7816,
      status: "active",
      bristolScore: 87,
      address: "123 Main Street, Franklin, TN"
    },
    {
      id: "brentwood-commons", 
      name: "Brentwood Commons",
      latitude: 36.0331,
      longitude: -86.7828,
      status: "under_review",
      bristolScore: 72,
      address: "456 Commons Blvd, Brentwood, TN"
    },
    {
      id: "cool-springs",
      name: "Cool Springs District",
      latitude: 36.0256,
      longitude: -86.8208,
      status: "active", 
      bristolScore: 91,
      address: "789 Cool Springs Blvd, Franklin, TN"
    }
  ];

  const displaySites = sites.length > 0 ? sites : mockSites;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "under_review":
        return "bg-yellow-500";
      case "archived":
        return "bg-gray-500";
      default:
        return "bg-bristol-maroon";
    }
  };

  const getBristolScoreColor = (score?: number) => {
    if (!score) return "text-bristol-stone";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const toggleMapProvider = () => {
    setMapProvider(prev => prev === "maplibre" ? "arcgis" : "maplibre");
  };

  const handleSiteSelect = (site: MapSite) => {
    setSelectedSite(site);
    onSiteClick?.(site);
  };

  useEffect(() => {
    // Here you would initialize the actual map based on the provider
    // For now, we'll just simulate the map loading
    console.log(`Loading ${mapProvider} map with center:`, center, "zoom:", zoom);
    
    // Simulate map initialization delay
    const timer = setTimeout(() => {
      console.log("Map loaded successfully");
    }, 1000);

    return () => clearTimeout(timer);
  }, [mapProvider, center, zoom]);

  return (
    <Card className={cn(
      "bg-white border-bristol-sky shadow-lg overflow-hidden",
      isFullscreen && "fixed inset-4 z-50",
      className
    )}>
      <CardHeader className="p-4 border-b border-bristol-sky">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-lg font-semibold text-bristol-ink flex items-center gap-2">
            <MapPin className="w-5 h-5 text-bristol-maroon" />
            Interactive Site Maps
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Map Provider Toggle */}
            <div className="flex items-center gap-2 bg-bristol-fog rounded-lg p-1">
              <Button
                variant={mapProvider === "maplibre" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMapProvider("maplibre")}
                className={cn(
                  "text-xs px-3 py-1",
                  mapProvider === "maplibre" 
                    ? "bg-bristol-maroon text-white" 
                    : "text-bristol-stone hover:text-bristol-maroon"
                )}
              >
                MapLibre
              </Button>
              <Button
                variant={mapProvider === "arcgis" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMapProvider("arcgis")}
                className={cn(
                  "text-xs px-3 py-1",
                  mapProvider === "arcgis" 
                    ? "bg-bristol-maroon text-white" 
                    : "text-bristol-stone hover:text-bristol-maroon"
                )}
              >
                ArcGIS
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-bristol-stone hover:text-bristol-maroon"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        {/* Map Container */}
        <div 
          ref={mapContainerRef}
          className={cn(
            "relative bg-gradient-to-br from-bristol-sky to-bristol-fog",
            isFullscreen ? "h-[calc(100vh-120px)]" : "h-64"
          )}
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400')`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          {/* Map Overlay */}
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Site Markers */}
          {displaySites.map((site, index) => (
            <button
              key={site.id}
              onClick={() => handleSiteSelect(site)}
              className={cn(
                "absolute transform -translate-x-1/2 -translate-y-1/2 z-10",
                "hover:scale-110 transition-transform duration-200"
              )}
              style={{
                left: `${30 + (index * 25)}%`,
                top: `${40 + (index * 15)}%`
              }}
            >
              <div className="relative">
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 border-white shadow-lg",
                  getStatusColor(site.status)
                )} />
                
                {site.bristolScore && (
                  <Badge 
                    variant="secondary"
                    className="absolute -top-8 -left-4 bg-white/90 text-xs font-bold shadow-md"
                  >
                    {site.bristolScore}
                  </Badge>
                )}
              </div>
            </button>
          ))}

          {/* Map Center Indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-20 h-20 bg-black/50 text-white rounded-lg flex flex-col items-center justify-center">
              <MapPin className="w-6 h-6 text-bristol-gold mb-1" />
              <p className="text-xs font-semibold">Franklin, TN</p>
              <p className="text-xs">{displaySites.length} Sites</p>
            </div>
          </div>

          {/* Map Provider Indicator */}
          <div className="absolute bottom-4 left-4">
            <Badge variant="secondary" className="bg-white/90 text-bristol-ink">
              {mapProvider === "maplibre" ? "MapLibre GL" : "ArcGIS Maps SDK"}
            </Badge>
          </div>
        </div>

        {/* Site Info Panel */}
        {selectedSite && (
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-bristol-sky max-w-xs">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-serif font-semibold text-bristol-ink">{selectedSite.name}</h4>
                <p className="text-sm text-bristol-stone">{selectedSite.address}</p>
              </div>
              <button 
                onClick={() => setSelectedSite(null)}
                className="text-bristol-stone hover:text-bristol-maroon"
              >
                ×
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn("text-xs", getStatusColor(selectedSite.status), "text-white border-0")}
              >
                {selectedSite.status.replace("_", " ")}
              </Badge>
              
              {selectedSite.bristolScore && (
                <Badge 
                  variant="outline"
                  className={cn("text-xs font-bold", getBristolScoreColor(selectedSite.bristolScore))}
                >
                  Bristol Score: {selectedSite.bristolScore}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
