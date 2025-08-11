import { useEffect, useRef, useState } from 'react';
import Map, { NavigationControl, GeolocateControl, Marker, Popup, Source, Layer } from 'react-map-gl';
import type { MapRef, MapboxEvent } from 'react-map-gl';
import type { Site } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, TrendingUp, Users, DollarSign, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveMapProps {
  sites: Site[];
  selectedSiteId?: string;
  onSiteSelect?: (site: Site) => void;
  onMapClick?: (longitude: number, latitude: number) => void;
  className?: string;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.your_token_here';

// Bristol Site Scoring Color Scale
const getScoreColor = (score: number): string => {
  if (score >= 85) return '#22c55e'; // Green - Excellent
  if (score >= 70) return '#84cc16'; // Light Green - Good
  if (score >= 55) return '#eab308'; // Yellow - Average
  if (score >= 40) return '#f97316'; // Orange - Below Average
  return '#ef4444'; // Red - Poor
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
  className 
}: InteractiveMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [viewport, setViewport] = useState({
    longitude: -82.4572, // Atlanta/Sunbelt center
    latitude: 33.7490,
    zoom: 6
  });

  // Heat map data for market opportunities
  const marketHeatData = {
    type: 'FeatureCollection' as const,
    features: sites.map(site => ({
      type: 'Feature' as const,
      properties: {
        score: site.bristolScore || 50,
        density: Math.random() * 100 // Would be actual market density data
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [site.longitude || -82.4572, site.latitude || 33.7490]
      }
    }))
  };

  const heatmapLayer = {
    id: 'market-heat',
    type: 'heatmap' as const,
    source: 'market-opportunities',
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'score'], 0, 0, 100, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(139, 21, 56, 0)',
        0.2, 'rgba(139, 21, 56, 0.2)',
        0.4, 'rgba(255, 178, 0, 0.4)',
        0.6, 'rgba(255, 140, 0, 0.6)',
        0.8, 'rgba(255, 69, 0, 0.8)',
        1, 'rgba(139, 21, 56, 1)'
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 40],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 15, 0.6]
    }
  };

  const handleSiteClick = (site: Site) => {
    setSelectedSite(site);
    onSiteSelect?.(site);
    
    // Fly to site location
    if (mapRef.current && site.longitude && site.latitude) {
      mapRef.current.flyTo({
        center: [site.longitude, site.latitude],
        zoom: 14,
        duration: 1500
      });
    }
  };

  const handleMapClick = (event: MapboxEvent) => {
    const { lng, lat } = event.lngLat;
    onMapClick?.(lng, lat);
  };

  return (
    <Card className={cn("h-full overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-bristol-ink">
          <MapPin className="w-5 h-5 text-bristol-maroon" />
          Bristol Market Intelligence Map
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[600px] relative">
        <Map
          ref={mapRef}
          {...viewport}
          onMove={evt => setViewport(evt.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          onClick={handleMapClick}
          interactiveLayerIds={['market-heat']}
          projection={{ name: 'mercator' }}
        >
          {/* Market Heat Map Layer */}
          <Source id="market-opportunities" type="geojson" data={marketHeatData}>
            <Layer {...heatmapLayer} />
          </Source>

          {/* Site Markers */}
          {sites.map((site) => (
            <Marker
              key={site.id}
              longitude={site.longitude || -82.4572}
              latitude={site.latitude || 33.7490}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleSiteClick(site);
              }}
            >
              <div className="relative cursor-pointer group">
                <div 
                  className={cn(
                    "w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all",
                    selectedSiteId === site.id ? "scale-125 ring-2 ring-bristol-gold" : "hover:scale-110",
                  )}
                  style={{ backgroundColor: getScoreColor(site.bristolScore || 50) }}
                >
                  <Building className="w-3 h-3 text-white" />
                </div>
                
                {/* Score badge */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge 
                    variant="secondary" 
                    className="text-xs whitespace-nowrap bg-white/90 text-bristol-ink border border-bristol-stone"
                  >
                    {site.bristolScore || 50}
                  </Badge>
                </div>
              </div>
            </Marker>
          ))}

          {/* Site Info Popup */}
          {selectedSite && selectedSite.longitude && selectedSite.latitude && (
            <Popup
              longitude={selectedSite.longitude}
              latitude={selectedSite.latitude}
              anchor="top"
              onClose={() => setSelectedSite(null)}
              closeButton={true}
              className="bristol-popup"
            >
              <div className="p-4 min-w-[300px]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-bristol-ink">
                      {selectedSite.name}
                    </h3>
                    <p className="text-sm text-bristol-stone">
                      {selectedSite.address}, {selectedSite.city}, {selectedSite.state}
                    </p>
                  </div>
                  <Badge 
                    className="ml-2"
                    style={{ backgroundColor: getScoreColor(selectedSite.bristolScore || 50) }}
                  >
                    {selectedSite.bristolScore || 50}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-bristol-maroon" />
                    <span className="text-bristol-stone">Score:</span>
                    <span className="font-medium text-bristol-ink">
                      {getScoreLabel(selectedSite.bristolScore || 50)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="w-4 h-4 text-bristol-maroon" />
                    <span className="text-bristol-stone">Zoning:</span>
                    <span className="font-medium text-bristol-ink">
                      {selectedSite.zoning || 'Not specified'}
                    </span>
                  </div>
                  
                  {selectedSite.acreage && (
                    <div className="flex items-center gap-2 text-sm">
                      <Info className="w-4 h-4 text-bristol-maroon" />
                      <span className="text-bristol-stone">Acreage:</span>
                      <span className="font-medium text-bristol-ink">
                        {selectedSite.acreage} acres
                      </span>
                    </div>
                  )}
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full bg-bristol-maroon hover:bg-bristol-maroon/90"
                  onClick={() => onSiteSelect?.(selectedSite)}
                >
                  View Full Analysis
                </Button>
              </div>
            </Popup>
          )}

          {/* Map Controls */}
          <NavigationControl position="top-right" />
          <GeolocateControl
            position="top-right"
            trackUserLocation={true}
            showUserHeading={true}
          />
        </Map>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-bristol-stone">
          <h4 className="font-semibold text-sm text-bristol-ink mb-2">Bristol Score Legend</h4>
          <div className="space-y-1">
            {[
              { range: '85-100', label: 'Excellent', color: '#22c55e' },
              { range: '70-84', label: 'Good', color: '#84cc16' },
              { range: '55-69', label: 'Average', color: '#eab308' },
              { range: '40-54', label: 'Below Average', color: '#f97316' },
              { range: '0-39', label: 'Poor', color: '#ef4444' },
            ].map(({ range, label, color }) => (
              <div key={range} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-bristol-stone">{range}</span>
                <span className="text-bristol-ink font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}