import { useEffect, useRef, useState, useCallback } from 'react';
import Map, { NavigationControl, GeolocateControl, Marker, Popup, Source, Layer, ViewStateChangeEvent } from 'react-map-gl';
import type { MapRef } from 'react-map-gl';
import type { Site } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, TrendingUp, Users, DollarSign, Info, Layers, Satellite, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ArcGISLayer, useArcGISDemographics } from '../analytics/ArcGISLayer';
import { KMLLayer } from './KMLLayer';
import 'mapbox-gl/dist/mapbox-gl.css';

interface InteractiveMapProps {
  sites: Site[];
  selectedSiteId?: string;
  onSiteSelect?: (site: Site) => void;
  onMapClick?: (longitude: number, latitude: number) => void;
  className?: string;
  kmlData?: string;
  showControls?: boolean;
  fullScreen?: boolean;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// ArcGIS Service URLs for real estate data
const ARCGIS_SERVICES = {
  demographics: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Demographics_Boundaries/FeatureServer',
  housing: 'https://services.arcgis.com/jIL9msH9OI208GCb/arcgis/rest/services/USA_Housing_Density/FeatureServer',
  employment: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Employment_by_Industry/FeatureServer'
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
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-streets-v12');
  const [showDemographics, setShowDemographics] = useState(false);
  const [showHousing, setShowHousing] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showKML, setShowKML] = useState(!!kmlData);
  const [viewport, setViewport] = useState({
    longitude: -82.4572, // Atlanta/Sunbelt center
    latitude: 33.7490,
    zoom: 6
  });

  // Sample sites for Sunbelt markets
  const sampleSites: Site[] = sites.length > 0 ? sites : [
    {
      id: '1',
      name: 'Atlanta Metro Site',
      address: '1234 Peachtree St, Atlanta, GA',
      latitude: 33.7490,
      longitude: -84.3880,
      bristolScore: 87,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2', 
      name: 'Charlotte Uptown',
      address: '567 Trade St, Charlotte, NC',
      latitude: 35.2271,
      longitude: -80.8431,
      bristolScore: 75,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'Orlando Downtown',
      address: '890 Orange Ave, Orlando, FL',
      latitude: 28.5383,
      longitude: -81.3792,
      bristolScore: 68,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      name: 'Nashville Music Row',
      address: '1010 Music Row, Nashville, TN',
      latitude: 36.1627,
      longitude: -86.7816,
      bristolScore: 82,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      name: 'Tampa Bay Area',
      address: '2020 Bay St, Tampa, FL',
      latitude: 27.9506,
      longitude: -82.4572,
      bristolScore: 71,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Heat map data for market opportunities
  const marketHeatData = {
    type: 'FeatureCollection' as const,
    features: sampleSites.map(site => ({
      type: 'Feature' as const,
      properties: {
        score: site.bristolScore || 50,
        density: Math.random() * 100
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
      'heatmap-weight': {
        property: 'score',
        type: 'exponential',
        stops: [[0, 0], [100, 1]]
      },
      'heatmap-intensity': {
        stops: [[0, 1], [15, 3]]
      },
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
      'heatmap-radius': {
        stops: [[0, 2], [15, 40]]
      },
      'heatmap-opacity': {
        stops: [[7, 1], [15, 0.6]]
      }
    }
  } as const;

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

  const handleMapClick = useCallback((event: any) => {
    if (event.lngLat) {
      const { lng, lat } = event.lngLat;
      onMapClick?.(lng, lat);
    }
  }, [onMapClick]);

  // Calculate bounding box for ArcGIS queries
  const bbox: [number, number, number, number] = [
    viewport.longitude - 1, // west
    viewport.latitude - 1,  // south  
    viewport.longitude + 1, // east
    viewport.latitude + 1   // north
  ];

  const { data: demographicsData, loading: demographicsLoading } = useArcGISDemographics(bbox);

  if (fullScreen) {
    return (
      <div className={cn("h-screen w-full relative bg-bristol-cream", className)}>
        <Map
          ref={mapRef}
          {...viewport}
          onMove={evt => setViewport(evt.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          mapStyle={mapStyle}
          onClick={handleMapClick}
          interactiveLayerIds={['market-heat', 'kml-polygons', 'kml-polygon-outlines', 'kml-lines', 'kml-points']}
          projection={{ name: 'mercator' }}
        >
          {/* Market Heat Map Layer */}
          {showHeatmap && (
            <Source id="market-opportunities" type="geojson" data={marketHeatData}>
              <Layer {...heatmapLayer} />
            </Source>
          )}

          {/* KML Layer */}
          {kmlData && (
            <KMLLayer
              kmlData={kmlData}
      
              visible={showKML}
              onFeaturesLoad={(features) => {
                console.log(`Loaded ${features.length} KML features`);
              }}
            />
          )}

          {/* ArcGIS Demographics Layer */}
          <ArcGISLayer
            serviceUrl="https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Demographics_Boundaries/FeatureServer"
            layerId="0"
            visible={showDemographics}
            layerType="fill"
            paint={{
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'MEDHINC_CY'],
                0, 'rgba(255, 0, 0, 0.2)',
                50000, 'rgba(255, 255, 0, 0.3)',
                100000, 'rgba(0, 255, 0, 0.4)'
              ],
              'fill-opacity': 0.3
            }}
          />

          {/* ArcGIS Housing Density Layer */}
          <ArcGISLayer
            serviceUrl="https://services.arcgis.com/jIL9msH9OI208GCb/arcgis/rest/services/USA_Housing_Density/FeatureServer"
            layerId="0"
            visible={showHousing}
            layerType="fill"
            paint={{
              'fill-color': '#FFB000',
              'fill-opacity': 0.4
            }}
          />

          {/* Site Markers */}
          {sampleSites.map((site) => (
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
                      {selectedSite.address}
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
                      Mixed Use
                    </span>
                  </div>
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

        {/* Layer Controls */}
        {showControls && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-bristol-stone">
            <h4 className="font-semibold text-sm text-bristol-ink mb-3">Map Layers</h4>
            <div className="space-y-2">
              {kmlData && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="kml"
                    checked={showKML}
                    onChange={(e) => setShowKML(e.target.checked)}
                    className="w-4 h-4 text-bristol-maroon"
                  />
                  <label htmlFor="kml" className="text-sm text-bristol-ink">KML Layer</label>
                </div>
              )}
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
        )}

        {/* Map Legend */}
        {showControls && (
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
        )}
      </div>
    );
  }

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
          mapStyle={mapStyle}
          onClick={handleMapClick}
          interactiveLayerIds={['market-heat']}
          projection={{ name: 'mercator' }}
        >
          {/* Market Heat Map Layer */}
          {showHeatmap && (
            <Source id="market-opportunities" type="geojson" data={marketHeatData}>
              <Layer {...heatmapLayer} />
            </Source>
          )}

          {/* ArcGIS Demographics Layer */}
          <ArcGISLayer
            serviceUrl="https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Demographics_Boundaries/FeatureServer"
            layerId="0"
            visible={showDemographics}
            layerType="fill"
            paint={{
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'MEDHINC_CY'],
                0, 'rgba(255, 0, 0, 0.2)',
                50000, 'rgba(255, 255, 0, 0.3)',
                100000, 'rgba(0, 255, 0, 0.4)'
              ],
              'fill-opacity': 0.3
            }}
          />

          {/* ArcGIS Housing Density Layer */}
          <ArcGISLayer
            serviceUrl="https://services.arcgis.com/jIL9msH9OI208GCb/arcgis/rest/services/USA_Housing_Density/FeatureServer"
            layerId="0"
            visible={showHousing}
            layerType="fill"
            paint={{
              'fill-color': '#FFB000',
              'fill-opacity': 0.4
            }}
          />

          {/* Site Markers */}
          {sampleSites.map((site) => (
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

        {/* Layer Controls */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-bristol-stone">
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