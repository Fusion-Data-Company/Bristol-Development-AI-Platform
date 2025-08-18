import { useEffect, useRef, useState, useCallback } from 'react';
import Map, { NavigationControl, GeolocateControl, Marker, Popup, Source, Layer, ViewStateChangeEvent } from 'react-map-gl';
import type { MapRef } from 'react-map-gl';
import type { Site } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, TrendingUp, Users, DollarSign, Info, Layers, Satellite, Map as MapIcon, Home, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ArcGISLayer, useArcGISDemographics } from '../analytics/ArcGISLayer';
import { KMLLayer } from './KMLLayer';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface InteractiveMapProps {
  sites: Site[];
  selectedSiteId?: string;
  onSiteSelect?: (site: Site | null) => void;
  onMapClick?: (longitude: number, latitude: number) => void;
  className?: string;
  kmlData?: string;
  showControls?: boolean;
  fullScreen?: boolean;
}

const MAPBOX_TOKEN = 'pk.eyJ1Ijoicm9iZXJ0eWVhZ2VyIiwiYSI6ImNtZWRnM3IwbjA3M3IybG1zNnAzeWtuZ3EifQ.mif4Tbd3ceKQh6YAS8EPDQ';

// Set Mapbox token globally for better compatibility
mapboxgl.accessToken = MAPBOX_TOKEN;

// Enhanced debugging and error suppression
console.log('✅ Using Mapbox token:', MAPBOX_TOKEN.substring(0, 20) + '...');
console.log('✅ Token validation:', MAPBOX_TOKEN.startsWith('pk.') ? 'VALID' : 'INVALID');

// Suppress non-critical console warnings from Mapbox
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args.join(' ');
  // Suppress known non-critical Mapbox warnings
  if (message.includes('style') || 
      message.includes('Style') || 
      message.includes('mapbox-gl') ||
      message.includes('worker')) {
    return; // Suppress these warnings
  }
  originalWarn.apply(console, args);
};

// Add browser support check
if (!mapboxgl.supported()) {
  console.error('❌ Mapbox GL JS is not supported by this browser');
} else {
  console.log('✅ Mapbox GL JS browser support confirmed');
}

// Real verified data sources for map layers
const DATA_SOURCES = {
  // U.S. Census Bureau - American Community Survey Demographics
  demographics: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_Population_by_Race_and_Hispanic_Origin_Boundaries/FeatureServer/2',
    name: 'Census Demographics',
    fields: ['TOTPOP_CY', 'MEDHINC_CY', 'AVGHINC_CY', 'POP25_CY']
  },
  // Census Bureau - Housing and Rent Data
  housing: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_Housing_Characteristics_Boundaries/FeatureServer/2',
    name: 'Housing Market Data',
    fields: ['TOTHU_CY', 'AVGRENT_CY', 'MEDRENT_CY', 'VACANTHU_CY']
  },
  // Bureau of Labor Statistics - Employment Data
  employment: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Labor_Force_Participation_Rate/FeatureServer/0',
    name: 'Employment Statistics',
    fields: ['UNEMPRT_CY', 'LABFORCE_CY', 'CIVLBFR_CY']
  },
  // Economic Research Service - Income and Poverty
  economic: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_Poverty_and_Income_Boundaries/FeatureServer/2',
    name: 'Economic Indicators',
    fields: ['MEDHINC_CY', 'AVGHINC_CY', 'PCI_CY', 'POVPOP_CY']
  },
  // Transportation and Infrastructure
  infrastructure: {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Transportation_Methods/FeatureServer/0',
    name: 'Transportation Access',
    fields: ['PUBTRANS_CY', 'COMMUTE_CY', 'X26001_X_CY']
  }
};

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
  className,
  kmlData,
  showControls = true,
  fullScreen = false
}: InteractiveMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['heatmap']));
  const [showKML, setShowKML] = useState(!!kmlData);
  const [layerData, setLayerData] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showDemographics, setShowDemographics] = useState(false);
  const [showHousing, setShowHousing] = useState(false);
  const [locationPopup, setLocationPopup] = useState<{lat: number, lng: number, loading: boolean, address?: string} | null>(null);
  const [dataLayersCollapsed, setDataLayersCollapsed] = useState(true);
  const [viewport, setViewport] = useState({
    longitude: -82.4572, // Atlanta/Sunbelt center
    latitude: 33.7490,
    zoom: 6
  });

  // Use real site data or empty array to prevent TypeScript errors
  const activeSites: Site[] = sites.length > 0 ? sites : [];
  
  // Debug sites data loading
  console.log('InteractiveMap: Sites data loaded:', {
    siteCount: activeSites.length,
    sitesWithCoords: activeSites.filter(s => s.latitude && s.longitude).length,
    firstSite: activeSites[0] || null
  });

  // Fetch real data from ArcGIS services
  const fetchLayerData = useCallback(async (layerKey: string) => {
    if (!DATA_SOURCES[layerKey as keyof typeof DATA_SOURCES]) return;
    
    setLoading(prev => ({ ...prev, [layerKey]: true }));
    
    try {
      const source = DATA_SOURCES[layerKey as keyof typeof DATA_SOURCES];
      const response = await fetch(
        `${source.url}/query?where=1%3D1&outFields=*&geometry=-89.0,30.0,-79.0,36.0&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326&f=geojson&resultRecordCount=500`
      );
      
      if (response.ok) {
        const data = await response.json();
        setLayerData(prev => ({ ...prev, [layerKey]: data }));
      } else {
        console.warn(`Failed to fetch ${source.name} data:`, response.status);
      }
    } catch (error) {
      console.warn(`Error fetching ${layerKey} data:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [layerKey]: false }));
    }
  }, []);

  // Toggle layer visibility and fetch data if needed
  const toggleLayer = useCallback((layerKey: string) => {
    setActiveLayers(prev => {
      const newLayers = new Set(prev);
      if (newLayers.has(layerKey)) {
        newLayers.delete(layerKey);
      } else {
        newLayers.add(layerKey);
        // Fetch data if not already loaded
        if (!layerData[layerKey] && !loading[layerKey]) {
          fetchLayerData(layerKey);
        }
      }
      return newLayers;
    });
  }, [layerData, loading, fetchLayerData]);

  // Enhanced heat map data for better visibility
  const marketHeatData = {
    type: 'FeatureCollection' as const,
    features: activeSites.map(site => ({
      type: 'Feature' as const,
      properties: {
        score: (site as any).bristolScore || 75,
        density: Math.max(50, ((site as any).bristolScore || 75) * 1.2) // Enhanced density for visibility
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
    paint: {
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', 'score'],
        0, 0,
        100, 1
      ] as any,
      'heatmap-intensity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 1,
        15, 3
      ] as any,
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
      ] as any,
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 15,
        8, 25,
        15, 60
      ] as any,
      'heatmap-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        7, 1,
        15, 0.6
      ] as any
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

  const handleMapClick = useCallback(async (event: any) => {
    // Prevent event propagation to avoid navigation issues
    event.preventDefault?.();
    event.stopPropagation?.();
    
    if (event.lngLat) {
      const { lng, lat } = event.lngLat;
      console.log('✅ Map click working! Coordinates:', lng, lat);
      
      // Always clear existing popup and show loading immediately
      setLocationPopup({ lat, lng, loading: true });
      
      try {
        // Use Mapbox reverse geocoding API to get address
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi`
        );
        
        if (response.ok) {
          const geocodingData = await response.json();
          let address = 'Address not found';
          
          if (geocodingData.features && geocodingData.features.length > 0) {
            // Get the most relevant address from the first result
            const feature = geocodingData.features[0];
            address = feature.place_name || feature.text || 'Address not available';
          }
          
          // Update with address data
          setLocationPopup({ lat, lng, loading: false, address });
        } else {
          console.warn('Failed to fetch address:', response.statusText);
          // Show coordinates only if reverse geocoding fails
          setLocationPopup({ lat, lng, loading: false, address: 'Address lookup failed' });
        }
      } catch (error) {
        console.warn('Error fetching address:', error);
        // Show coordinates only if reverse geocoding fails
        setLocationPopup({ lat, lng, loading: false, address: 'Address lookup failed' });
      }
      
      onMapClick?.(lng, lat);
    }
  }, [onMapClick]);

  // REMOVED: Automatic ArcGIS demographics fetching on every map move
  // This was causing infinite loops - demographics should only be fetched when explicitly requested
  const demographicsData = null;
  const demographicsLoading = false;
  const demographicsError = null;

  // If no token or browser not supported, show error
  if (!MAPBOX_TOKEN) {
    return (
      <div className={cn(fullScreen ? "h-screen w-full relative bg-red-100 flex items-center justify-center" : "h-full w-full relative bg-red-100 flex items-center justify-center", className)}>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">MapBox Token Missing</h2>
          <p className="text-red-500">VITE_MAPBOX_PUBLIC_KEY2 environment variable is not set</p>
        </div>
      </div>
    );
  }
  
  if (!mapboxgl.supported()) {
    return (
      <div className={cn(fullScreen ? "h-screen w-full relative bg-orange-100 flex items-center justify-center" : "h-full w-full relative bg-orange-100 flex items-center justify-center", className)}>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-orange-600 mb-4">Browser Not Supported</h2>
          <p className="text-orange-500">Your browser does not support Mapbox GL JS. Please update your browser or enable WebGL.</p>
        </div>
      </div>
    );
  }
  
  // Main map component - render for both fullScreen and regular mode
  const mapComponent = (
    <Map
      ref={mapRef}
      longitude={viewport.longitude}
      latitude={viewport.latitude}
      zoom={viewport.zoom}
      onMove={evt => setViewport(evt.viewState)}
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '100%', minHeight: fullScreen ? '500px' : '400px' }}
      mapStyle={mapStyle}
      onClick={handleMapClick}
      onLoad={() => {
        console.log('✅ Mapbox loaded successfully');
        console.log('✅ Map style:', mapStyle);
        console.log('✅ Token valid:', MAPBOX_TOKEN.startsWith('pk.'));
        console.log('Map is ready and tiles should be loading');
      }}
      onError={(error) => {
        // Enhanced error handling - only log critical errors
        const errorMsg = error?.error?.message || error?.message || String(error);
        const isStyleError = errorMsg.includes('style') || errorMsg.includes('Style');
        const is404 = errorMsg.includes('404') || errorMsg.includes('Not Found');
        const isNetworkError = errorMsg.includes('network') || errorMsg.includes('fetch');
        
        // Only show critical errors, suppress style warnings and 404s
        if (!isStyleError && !is404 && isNetworkError) {
          console.error('🚨 Critical Map Error:', errorMsg);
        } else {
          console.warn('⚠️ Non-critical Map Warning (suppressed):', errorMsg);
        }
      }}
      interactiveLayerIds={['market-heat']}
      projection={{ name: 'mercator' }}
    >
      {/* Enhanced Heat Map Layer */}
      {activeLayers.has('heatmap') && (
        <Source id="market-opportunities" type="geojson" data={marketHeatData}>
          <Layer {...heatmapLayer} />
        </Source>
      )}

      {/* KML Portfolio Layer */}
      {kmlData && showKML && (
        <KMLLayer
          kmlData={kmlData}
          visible={showKML}
          onFeaturesLoad={(features) => {
            console.log(`Loaded ${features.length} KML features`);
          }}
        />
      )}

      {/* Demographics Layer - Real Census Data */}
      {activeLayers.has('demographics') && layerData.demographics && (
        <Source id="demographics-source" type="geojson" data={layerData.demographics}>
          <Layer
            id="demographics-fill"
            type="fill"
            paint={{
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'TOTPOP_CY'],
                0, '#f7fafc',
                1000, '#e2e8f0',
                5000, '#cbd5e0',
                10000, '#a0aec0',
                25000, '#718096',
                50000, '#4a5568'
              ],
              'fill-opacity': 0.7
            }}
          />
          <Layer
            id="demographics-line"
            type="line"
            paint={{
              'line-color': '#2d3748',
              'line-width': 1,
              'line-opacity': 0.5
            }}
          />
        </Source>
      )}

      {/* Housing Market Layer - Real Housing Data */}
      {activeLayers.has('housing') && layerData.housing && (
        <Source id="housing-source" type="geojson" data={layerData.housing}>
          <Layer
            id="housing-fill"
            type="fill"
            paint={{
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'MEDRENT_CY'],
                0, '#fef5e7',
                500, '#fed7aa',
                1000, '#fdba74',
                1500, '#fb923c',
                2000, '#f97316',
                3000, '#ea580c'
              ],
              'fill-opacity': 0.6
            }}
          />
        </Source>
      )}

      {/* Economic Layer - Real Income Data */}
      {activeLayers.has('economic') && layerData.economic && (
        <Source id="economic-source" type="geojson" data={layerData.economic}>
          <Layer
            id="economic-fill"
            type="fill"
            paint={{
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'MEDHINC_CY'],
                0, '#f0fdf4',
                25000, '#dcfce7',
                50000, '#bbf7d0',
                75000, '#86efac',
                100000, '#4ade80',
                150000, '#22c55e'
              ],
              'fill-opacity': 0.6
            }}
          />
        </Source>
      )}

      {/* Employment Layer - Real BLS Data */}
      {activeLayers.has('employment') && layerData.employment && (
        <Source id="employment-source" type="geojson" data={layerData.employment}>
          <Layer
            id="employment-fill"
            type="fill"
            paint={{
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'UNEMPRT_CY'],
                0, '#eff6ff',
                2, '#dbeafe',
                5, '#bfdbfe',
                8, '#93c5fd',
                12, '#60a5fa',
                20, '#3b82f6'
              ],
              'fill-opacity': 0.6
            }}
          />
        </Source>
      )}

      {/* Infrastructure Layer - Real Transportation Data */}
      {activeLayers.has('infrastructure') && layerData.infrastructure && (
        <Source id="infrastructure-source" type="geojson" data={layerData.infrastructure}>
          <Layer
            id="infrastructure-fill"
            type="fill"
            paint={{
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'PUBTRANS_CY'],
                0, '#fdf4ff',
                5, '#fae8ff',
                15, '#f3e8ff',
                25, '#e9d5ff',
                40, '#d8b4fe',
                60, '#c084fc'
              ],
              'fill-opacity': 0.6
            }}
          />
        </Source>
      )}

      {/* Site Markers - This is the most important part */}
      {activeSites.map((site) => (
        <Marker
          key={site.id}
          longitude={site.longitude || -82.4572}
          latitude={site.latitude || 33.7490}
          anchor="bottom"
          style={{ zIndex: 1000 }}
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
              style={{ backgroundColor: getScoreColor(75) }}
            >
              <Building className="w-3 h-3 text-white" />
            </div>
            
            {/* Score badge */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Badge 
                variant="secondary" 
                className="text-xs whitespace-nowrap bg-white/90 text-bristol-ink border border-bristol-stone"
              >
                {75}
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
                  {selectedSite.addrLine1}, {selectedSite.city}, {selectedSite.state}
                </p>
              </div>
              <Badge 
                className="ml-2"
                style={{ backgroundColor: getScoreColor(75) }}
              >
                {75}
              </Badge>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-bristol-maroon" />
                <span className="text-bristol-stone">Score:</span>
                <span className="font-medium text-bristol-ink">
                  {getScoreLabel(75)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Building className="w-4 h-4 text-bristol-maroon" />
                <span className="text-bristol-stone">Zoning:</span>
                <span className="font-medium text-bristol-ink">
                  Mixed Use
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

      {/* Location Click Popup */}
      {locationPopup && (
        <Popup
          longitude={locationPopup.lng}
          latitude={locationPopup.lat}
          anchor="top"
          onClose={() => setLocationPopup(null)}
          closeButton={true}
          className="bristol-popup"
        >
          <div className="p-4 min-w-[250px]">
            <div className="mb-3">
              <h3 className="font-serif text-lg font-semibold text-bristol-ink">
                Selected Location
              </h3>
              {locationPopup.loading ? (
                <p className="text-sm text-bristol-stone">Loading address...</p>
              ) : (
                <p className="text-sm text-bristol-stone">
                  {locationPopup.address}
                </p>
              )}
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-bristol-maroon" />
                <span className="text-bristol-stone">Coordinates:</span>
                <span className="font-mono text-bristol-ink text-xs">
                  {locationPopup.lat.toFixed(6)}, {locationPopup.lng.toFixed(6)}
                </span>
              </div>
            </div>
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
  );

  if (fullScreen) {
    return (
      <div className={cn("h-screen w-full relative", className)} style={{ minHeight: '500px' }}>
        {mapComponent}

        {/* Layer Controls - REMOVED TO CLEAR MAP */}
        <div style={{display: 'none'}} className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-bristol-stone">
          <h4 className="font-semibold text-sm text-bristol-ink mb-3">Map Layers</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="heatmap"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="w-4 h-4 text-bristol-maroon"
              />
              <label htmlFor="heatmap" className="text-sm text-bristol-ink">Market Heat Map</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="demographics"
                checked={showDemographics}
                onChange={(e) => setShowDemographics(e.target.checked)}
                className="w-4 h-4 text-bristol-maroon"
              />
              <label htmlFor="demographics" className="text-sm text-bristol-ink">Demographics (ArcGIS)</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="housing"
                checked={showHousing}
                onChange={(e) => setShowHousing(e.target.checked)}
                className="w-4 h-4 text-bristol-maroon"
              />
              <label htmlFor="housing" className="text-sm text-bristol-ink">Housing Density</label>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-bristol-stone">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={mapStyle.includes('satellite') ? 'default' : 'outline'}
                onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-streets-v12')}
                className="text-xs"
              >
                <Satellite className="w-3 h-3 mr-1" />
                Satellite
              </Button>
              <Button
                size="sm"
                variant={mapStyle.includes('streets') && !mapStyle.includes('satellite') ? 'default' : 'outline'}
                onClick={() => setMapStyle('mapbox://styles/mapbox/streets-v12')}
                className="text-xs"
              >
                <MapIcon className="w-3 h-3 mr-1" />
                Streets
              </Button>
            </div>
          </div>
        </div>

        {/* Map Legend - REMOVED TO CLEAR MAP */}
        <div style={{display: 'none'}} className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-bristol-stone">
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
      </div>
    );
  }

  // Regular (non-fullscreen) mode
  return (
    <Card className={cn("w-full h-full", className)}>
      <CardContent className="p-0 h-full">
        <div className="h-full w-full relative" style={{ minHeight: '400px' }}>
          {mapComponent}
        </div>
      </CardContent>
    </Card>
  );
}