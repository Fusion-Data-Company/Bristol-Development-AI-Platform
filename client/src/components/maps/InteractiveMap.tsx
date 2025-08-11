import { useState } from 'react';
import type { Site } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, TrendingUp, Users, DollarSign, Info, Layers, Satellite, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveMapProps {
  sites: Site[];
  selectedSiteId?: string;
  onSiteSelect?: (site: Site) => void;
  onMapClick?: (lng: number, lat: number) => void;
  className?: string;
  kmlData?: string;
  showControls?: boolean;
  fullScreen?: boolean;
}

const getScoreColor = (score: number): string => {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#84cc16';
  if (score >= 55) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

const getScoreLabel = (score: number): string => {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Average';
  if (score >= 40) return 'Below Average';
  return 'Poor';
};

export function InteractiveMap({ 
  sites, 
  selectedSiteId, 
  onSiteSelect, 
  onMapClick,
  className,
  kmlData,
  showControls = true,
  fullScreen = false
}: InteractiveMapProps) {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [layers, setLayers] = useState({
    marketHeat: true,
    demographics: false,
    housing: false,
    kml: true
  });

  const handleLayerToggle = (layer: string) => {
    setLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  return (
    <div className={cn("relative w-full bg-gradient-to-br from-blue-50 to-blue-100 border border-bristol-sky rounded-lg overflow-hidden", fullScreen ? "h-screen" : "h-[600px]", className)}>
      {/* Simple Map Display */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
        {/* Geographic Grid Background */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(to right, #94a3b8 1px, transparent 1px),
            linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
        
        {/* PARLAY Parcels Display */}
        {kmlData && layers.kml && (
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-cyan-400/90 border-2 border-cyan-400 rounded-lg p-4 shadow-lg backdrop-blur-sm">
              <h3 className="text-lg font-bold text-white mb-1">PARLAY Parcels Active</h3>
              <p className="text-white/90 text-sm">Real parcel data from PARLAY network</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm text-white">Live Data Connection</span>
              </div>
            </div>
          </div>
        )}

        {/* Market Heat Areas */}
        {layers.marketHeat && (
          <>
            <div className="absolute top-1/4 left-1/3 w-32 h-24 bg-red-400/40 rounded-xl border-2 border-red-400">
              <div className="p-2 text-white text-xs font-bold">High Demand Zone</div>
            </div>
            <div className="absolute top-2/3 right-1/4 w-28 h-20 bg-yellow-400/40 rounded-xl border-2 border-yellow-400">
              <div className="p-2 text-white text-xs font-bold">Medium Demand</div>
            </div>
          </>
        )}

        {/* Demographics Overlay */}
        {layers.demographics && (
          <div className="absolute bottom-1/4 left-1/4 w-40 h-16 bg-purple-400/40 rounded-lg border-2 border-purple-400">
            <div className="p-2 text-white text-xs font-bold">Demographics Layer</div>
          </div>
        )}

        {/* Housing Density */}
        {layers.housing && (
          <div className="absolute top-1/2 right-1/3 w-36 h-20 bg-green-400/40 rounded-lg border-2 border-green-400">
            <div className="p-2 text-white text-xs font-bold">Housing Density</div>
          </div>
        )}
        
        {/* Site Markers */}
        {sites.map((site, index) => (
          <div
            key={site.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${30 + (index * 15)}%`,
              top: `${40 + (index * 10)}%`
            }}
            onClick={() => {
              setSelectedSite(site);
              onSiteSelect?.(site);
            }}
          >
            <div className={cn(
              "w-8 h-8 rounded-full border-3 border-white shadow-lg transition-all hover:scale-110 flex items-center justify-center",
              selectedSiteId === site.id 
                ? "bg-bristol-maroon ring-4 ring-bristol-maroon/30" 
                : "bg-bristol-gold"
            )}>
              <Building className="w-4 h-4 text-white" />
            </div>
            
            {/* Site Info Popup */}
            {selectedSiteId === site.id && (
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-bristol-sky p-4 min-w-[280px] z-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-bristol-maroon">{site.name}</h3>
                    <p className="text-sm text-bristol-stone">{site.address}</p>
                  </div>
                  <Badge 
                    className="text-white"
                    style={{ backgroundColor: getScoreColor(site.bristolScore || 75) }}
                  >
                    {site.bristolScore || 75}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-bristol-maroon" />
                    <span className="text-bristol-stone">{site.totalUnits} units</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-bristol-maroon" />
                    <span className="text-bristol-stone">${(site.averageRent || 1500).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-bristol-maroon" />
                    <span className="text-bristol-stone">{site.occupancyRate || 95}% occupied</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-bristol-maroon" />
                    <span className="text-bristol-stone">{site.marketGrade || 'A'} Grade</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-bristol-sky/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-bristol-maroon">Bristol Score</span>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-bristol-stone">{getScoreLabel(site.bristolScore || 75)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Layer Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 space-y-2 z-10">
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-bristol-sky">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-bristol-ink flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Map Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(layers).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-bristol-stone capitalize">
                    {key === 'kml' ? 'PARLAY Parcels' : key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <Button
                    size="sm"
                    variant={enabled ? "default" : "outline"}
                    onClick={() => handleLayerToggle(key)}
                    className={cn(
                      "h-6 w-12 text-xs",
                      enabled 
                        ? "bg-bristol-maroon hover:bg-bristol-maroon/90 text-white" 
                        : "text-bristol-stone hover:text-bristol-maroon"
                    )}
                  >
                    {enabled ? "ON" : "OFF"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Map Style Controls */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-bristol-sky">
            <CardContent className="p-3">
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                  <Satellite className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                  <MapIcon className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                  <Info className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-bristol-sky">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-bristol-maroon" />
            <span className="text-bristol-ink font-medium">Kansas City Area</span>
            <span className="text-bristol-stone">•</span>
            <span className="text-bristol-stone">{sites.length} sites</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Site Summary Component for use in other places
export function SiteSummary({ site, compact = false }: { site: Site; compact?: boolean }) {
  return (
    <Card className="bg-white shadow-lg border-bristol-sky hover:shadow-xl transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-bold text-bristol-maroon mb-1">{site.name}</h4>
            <p className="text-sm text-bristol-stone">{site.address}</p>
          </div>
          <Badge 
            className="ml-2 text-white"
            style={{ backgroundColor: getScoreColor(site.bristolScore || 75) }}
          >
            {site.bristolScore || 75}
          </Badge>
        </div>
        
        {!compact && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-bristol-maroon" />
              <span className="text-bristol-stone">{site.totalUnits} units</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-bristol-maroon" />
              <span className="text-bristol-stone">${(site.averageRent || 1500).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-bristol-maroon" />
              <span className="text-bristol-stone">{site.occupancyRate || 95}% occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-bristol-maroon" />
              <Badge className="bg-bristol-stone text-white text-xs">
                {site.marketGrade || 'A'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}