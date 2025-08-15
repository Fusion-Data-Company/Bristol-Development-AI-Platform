import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { quantile } from 'd3-array';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, TrendingUp, Users, DollarSign, RefreshCw, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DemographicMapProps {
  className?: string;
  onEnrichComplete?: () => void;
}

type DemographicMetric = 'population' | 'median_income' | 'median_rent';

interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: string;
    name: string;
    status: string;
    address: string;
    cityState: string;
    units: number;
    completedYear: number;
    acs_year?: string;
    acs_profile?: {
      population?: number;
      median_income?: number;
      median_rent?: number;
    };
  };
}

interface SitesGeoJSON {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// Using free OpenStreetMap tiles - no tokens needed

// Quantile color stops for demographic visualization
function quantileStops(fc: SitesGeoJSON, key: string) {
  const vals = fc.features
    .map((f) => f.properties?.acs_profile?.[key as keyof typeof f.properties.acs_profile])
    .filter((v): v is number => Number.isFinite(v))
    .sort((a, b) => a - b);
    
  if (!vals.length) return [0, 0, 0, 0, 0];
  return [
    quantile(vals, 0.05)!,
    quantile(vals, 0.25)!,
    quantile(vals, 0.50)!,
    quantile(vals, 0.75)!,
    quantile(vals, 0.95)!
  ];
}

// Add/update circle layer with demographic color scale
function upsertPinsLayer(map: MapRef, sourceId: string, layerId: string, fc: SitesGeoJSON, metricKey: string) {
  if (!map || !fc) return;

  const mapInstance = map.getMap();
  if (!mapInstance) return;

  // Update source
  if (mapInstance.getSource(sourceId)) {
    (mapInstance.getSource(sourceId) as any).setData(fc);
  } else {
    mapInstance.addSource(sourceId, { type: 'geojson', data: fc });
  }

  const [q05, q25, q50, q75, q95] = quantileStops(fc, metricKey);

  const colorExpr: any = [
    'case',
    ['!', ['has', 'acs_profile']], '#9ca3af', // gray if no ACS
    ['!', ['has', metricKey, ['get', 'acs_profile']]], '#9ca3af',
    [
      'interpolate',
      ['linear'],
      ['get', metricKey, ['get', 'acs_profile']],
      q05, '#f1eef6',
      q25, '#bdc9e1', 
      q50, '#74a9cf',
      q75, '#2b8cbe',
      q95, '#045a8d'
    ]
  ];

  const radiusExpr: any = [
    'interpolate',
    ['linear'],
    ['zoom'],
    4, 4,
    8, 8,
    12, 12
  ];

  if (!mapInstance.getLayer(layerId)) {
    mapInstance.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': radiusExpr,
        'circle-color': colorExpr,
        'circle-stroke-color': '#111827',
        'circle-stroke-width': 1
      }
    });
  } else {
    mapInstance.setPaintProperty(layerId, 'circle-color', colorExpr);
    mapInstance.setPaintProperty(layerId, 'circle-radius', radiusExpr);
  }
}

export function DemographicMap({ className, onEnrichComplete }: DemographicMapProps) {
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);
  const [popupInfo, setPopupInfo] = useState<GeoJSONFeature | null>(null);
  const [metric, setMetric] = useState<DemographicMetric>('median_income');
  const [isEnriching, setIsEnriching] = useState(false);

  // Fetch sites with demographic data
  const { data: sitesData, isLoading, refetch } = useQuery<SitesGeoJSON>({
    queryKey: ['sites-geojson'],
    queryFn: async () => {
      const response = await fetch('/api/sites.geojson');
      if (!response.ok) throw new Error('Failed to fetch sites data');
      return response.json();
    }
  });

  // Update map when metric changes
  useEffect(() => {
    if (mapRef.current && sitesData) {
      upsertPinsLayer(mapRef.current, 'sites-src', 'sites-circles', sitesData, metric);
    }
  }, [sitesData, metric]);

  // Run ACS enrichment
  const handleEnrich = async () => {
    setIsEnriching(true);
    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Enrichment failed');
      
      const result = await response.json();
      console.log('Enrichment result:', result);
      
      // Refetch data and notify parent
      await refetch();
      onEnrichComplete?.();
    } catch (error) {
      console.error('Enrichment error:', error);
    } finally {
      setIsEnriching(false);
    }
  };

  // Handle map clicks
  const handleMapClick = useCallback((event: any) => {
    const features = event.features;
    if (features && features.length > 0) {
      const feature = features[0];
      const coordinates = feature.geometry.coordinates.slice();
      
      // Ensure coordinates are valid
      while (Math.abs(coordinates[0]) > 180) {
        coordinates[0] += coordinates[0] > 0 ? -360 : 360;
      }
      
      setPopupInfo({
        longitude: coordinates[0],
        latitude: coordinates[1],
        feature: feature
      });
    }
    
    // Also log click coordinates for debugging
    console.log('Map clicked at:', event.lngLat.lng, event.lngLat.lat);
  }, []);

  // Format demographic values for display
  const formatValue = (value: number | null | undefined, metric: DemographicMetric) => {
    if (value == null) return '—';
    
    switch (metric) {
      case 'population':
        return value.toLocaleString();
      case 'median_income':
      case 'median_rent':
        return `$${value.toLocaleString()}`;
      default:
        return value.toString();
    }
  };

  // Get color for demographic value
  const getMarkerColor = (feature: GeoJSONFeature, metric: DemographicMetric) => {
    const value = feature.properties.acs_profile?.[metric];
    if (!value) return '#9ca3af'; // gray if no data
    
    // Simple color scale
    if (metric === 'median_income') {
      if (value > 80000) return '#065f46'; // dark green
      if (value > 60000) return '#047857'; // green  
      if (value > 40000) return '#0891b2'; // blue
      if (value > 20000) return '#dc2626'; // red
      return '#991b1b'; // dark red
    }
    
    if (metric === 'population') {
      if (value > 50000) return '#065f46';
      if (value > 20000) return '#047857';
      if (value > 10000) return '#0891b2';
      if (value > 5000) return '#dc2626';
      return '#991b1b';
    }
    
    if (metric === 'median_rent') {
      if (value > 2000) return '#065f46';
      if (value > 1500) return '#047857';
      if (value > 1000) return '#0891b2';
      if (value > 500) return '#dc2626';
      return '#991b1b';
    }
    
    return '#0891b2';
  };

  return (
    <div className={cn("relative", className)}>
      {/* Control Panel */}
      <Card className="absolute top-4 left-4 z-10 bg-gray-900/90 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Demographics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-gray-300 mb-1 block">Metric</label>
            <Select value={metric} onValueChange={(value: DemographicMetric) => setMetric(value)}>
              <SelectTrigger className="border-gray-600 bg-gray-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="median_income" className="text-white hover:bg-gray-700">
                  Median Income
                </SelectItem>
                <SelectItem value="median_rent" className="text-white hover:bg-gray-700">
                  Median Rent
                </SelectItem>
                <SelectItem value="population" className="text-white hover:bg-gray-700">
                  Population
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleEnrich}
            disabled={isEnriching}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            size="sm"
          >
            {isEnriching ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Enriching...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Rebuild ACS
              </>
            )}
          </Button>

          {sitesData && (
            <div className="text-xs text-gray-400">
              {sitesData.features.length} sites loaded
              <br />
              {sitesData.features.filter(f => f.properties.acs_profile).length} with demographics
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <MapContainer 
        center={[33.7490, -82.4572]} 
        zoom={6} 
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Site markers */}
        {sitesData?.features.map((feature) => (
          <CircleMarker
            key={feature.properties.id}
            center={[feature.geometry.coordinates[1], feature.geometry.coordinates[0]]}
            radius={8}
            fillColor={getMarkerColor(feature, metric)}
            color="#fff"
            weight={2}
            fillOpacity={0.8}
            eventHandlers={{
              click: () => setPopupInfo(feature)
            }}
          >
            <Popup>
              <div style={{ minWidth: '220px' }} className="p-2">
                <div className="font-semibold text-gray-900">
                  {feature.properties.name}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {feature.properties.address}
                  <br />
                  {feature.properties.cityState}
                </div>
                
                <hr className="my-2" />
                
                <div className="space-y-1 text-sm">
                  <div className="font-medium">
                    ACS {feature.properties.acs_year || 'Data'}
                  </div>
                  <div>
                    Population: {formatValue(
                      feature.properties.acs_profile?.population, 
                      'population'
                    )}
                  </div>
                  <div>
                    Median Income: {formatValue(
                      feature.properties.acs_profile?.median_income,
                      'median_income'
                    )}
                  </div>
                  <div>
                    Median Rent: {formatValue(
                      feature.properties.acs_profile?.median_rent,
                      'median_rent'
                    )}
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}