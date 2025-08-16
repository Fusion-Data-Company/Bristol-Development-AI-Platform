"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, LayersControl, Marker, Popup, useMap, CircleMarker, GeoJSON } from "react-leaflet";
import L, { LatLngBoundsExpression } from "leaflet";
import { patchLeafletIcons } from "@/lib/leafletIconFix";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Upload, Layers, MapPin, Building, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { parseKMLOrKMZ } from "@/utils/kmzParser";
import type { Site } from "@shared/schema";
import type { KMLData, KMLFeature } from "@/utils/kmlParser";

interface PortfolioMapProps {
  selectedSiteId?: string;
  onSiteSelect?: (site: Site) => void;
  className?: string;
}

interface GeoJSONFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    name: string;
    address: string;
    cityState: string;
    status: "Operating" | "Pipeline" | string;
    units: number | null;
    completionYear: number | null;
    id: string;
  };
}

interface FeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

function FitBounds({ features }: { features: GeoJSONFeature[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (!features.length) return;
    
    const bounds = L.latLngBounds(
      features.map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0]] as [number, number])
    );
    
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [features, map]);
  
  return null;
}

function KMLLayer({ kmlData, visible, name }: { kmlData: KMLData | null; visible: boolean; name: string }) {
  if (!visible || !kmlData || !kmlData.features.length) return null;

  const geoJsonData = {
    type: "FeatureCollection" as const,
    features: kmlData.features.map(feature => ({
      type: "Feature" as const,
      id: feature.id,
      properties: {
        name: feature.name,
        description: feature.description,
        ...feature.properties
      },
      geometry: feature.geometry
    }))
  };

  const getColor = (feature: any) => {
    if (feature.properties.name?.toLowerCase().includes('pipeline')) return '#d97706';
    if (feature.properties.name?.toLowerCase().includes('operating')) return '#2563eb';
    return '#8B1538'; // Bristol maroon
  };

  return (
    <GeoJSON
      data={geoJsonData}
      style={(feature) => ({
        color: getColor(feature),
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.3
      })}
      pointToLayer={(feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 8,
          color: getColor(feature),
          weight: 2,
          opacity: 1,
          fillOpacity: 0.6
        });
      }}
      onEachFeature={(feature, layer) => {
        if (feature.properties) {
          const popupContent = `
            <div class="p-2">
              <h3 class="font-semibold text-bristol-ink">${feature.properties.name || 'Feature'}</h3>
              ${feature.properties.description ? `<p class="text-sm text-bristol-stone mt-1">${feature.properties.description}</p>` : ''}
              <p class="text-xs text-bristol-stone mt-1">Layer: ${name}</p>
            </div>
          `;
          layer.bindPopup(popupContent);
        }
      }}
    />
  );
}

export function PortfolioMap({ selectedSiteId, onSiteSelect, className }: PortfolioMapProps) {
  const [ready, setReady] = useState(false);
  const [showOperating, setShowOperating] = useState(true);
  const [showPipeline, setShowPipeline] = useState(true);
  const [kmlLayers, setKmlLayers] = useState<Array<{ name: string; data: KMLData; visible: boolean }>>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    patchLeafletIcons();
    setReady(true);
  }, []);

  // Fetch sites data from API
  const { data: sitesData, isLoading } = useQuery<FeatureCollection>({
    queryKey: ['/api/sites/geojson'],
    queryFn: async () => {
      const response = await fetch('/api/sites/geojson');
      if (!response.ok) {
        throw new Error('Failed to fetch sites data');
      }
      return response.json();
    },
    retry: 1
  });

  const opFeatures = useMemo(() => 
    (sitesData?.features || []).filter(f => 
      (f.properties.status || "Operating") !== "Pipeline"
    ), [sitesData]
  );

  const pipeFeatures = useMemo(() => 
    (sitesData?.features || []).filter(f => 
      (f.properties.status || "Operating") === "Pipeline"
    ), [sitesData]
  );

  const allShownFeatures = useMemo<GeoJSONFeature[]>(() => [
    ...(showOperating ? opFeatures : []),
    ...(showPipeline ? pipeFeatures : []),
  ], [opFeatures, pipeFeatures, showOperating, showPipeline]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);

    try {
      for (const file of newFiles) {
        try {
          const kmlData = await parseKMLOrKMZ(file);
          setKmlLayers(prev => [...prev, {
            name: file.name.replace(/\.(kml|kmz)$/i, ''),
            data: kmlData,
            visible: true
          }]);
          toast({
            title: "File Loaded",
            description: `Successfully loaded ${file.name} with ${kmlData.features.length} features`
          });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast({
            title: "File Error",
            description: `Failed to load ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive"
          });
        }
      }
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const toggleLayerVisibility = (index: number) => {
    setKmlLayers(prev => prev.map((layer, i) => 
      i === index ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const removeLayer = (index: number) => {
    setKmlLayers(prev => prev.filter((_, i) => i !== index));
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!ready) return <div>Loading map...</div>;

  const defaultCenter: [number, number] = [36.1627, -86.7816]; // Nashville
  const defaultZoom = 6;

  return (
    <div className={`relative w-full h-[80vh] rounded-2xl overflow-hidden border ${className || ''}`}>
      {/* Leaflet container styling */}
      <style>{`
        .leaflet-container { width: 100%; height: 100%; }
      `}</style>

      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        minZoom={3}
        maxZoom={19}
        scrollWheelZoom 
        doubleClickZoom
        touchZoom
        zoomControl
        attributionControl
        style={{ width: "100%", height: "100%" }}
        whenReady={() => {
          console.log('Map is ready and tiles should be loading');
        }}
      >
        <LayersControl position="topright">
          {/* Base layers with improved tile loading */}
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
              subdomains={['a', 'b', 'c']}
              maxZoom={19}
              tileSize={256}
              zoomOffset={0}
              crossOrigin="anonymous"
              errorTileUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Crect width='256' height='256' fill='%23f0f0f0'/%3E%3Ctext x='128' y='128' text-anchor='middle' fill='%23999' font-family='Arial' font-size='14'%3ETile Error%3C/text%3E%3C/svg%3E"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="CartoDB Light">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains={['a', 'b', 'c', 'd']}
              maxZoom={19}
              tileSize={256}
              zoomOffset={0}
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              maxZoom={19}
              tileSize={256}
              zoomOffset={0}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Terrain">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenTopoMap contributors'
              subdomains={['a', 'b', 'c']}
              maxZoom={17}
              tileSize={256}
              zoomOffset={0}
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Streets (Backup)">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains={['a', 'b', 'c', 'd']}
              maxZoom={19}
              tileSize={256}
              zoomOffset={0}
            />
          </LayersControl.BaseLayer>

          {/* Site overlays */}
          <LayersControl.Overlay checked name={`Operating Sites (${opFeatures.length})`}>
            <>
              {showOperating && opFeatures.map((feature, i) => {
                const [lng, lat] = feature.geometry.coordinates;
                return (
                  <Marker 
                    key={`op-${feature.properties.id}-${i}`} 
                    position={[lat, lng]}
                    eventHandlers={{
                      click: () => {
                        // Find the full site object if onSiteSelect is provided
                        if (onSiteSelect) {
                          // This would need to be connected to the actual site data
                          console.log('Site selected:', feature.properties);
                        }
                      }
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-bristol-ink">{feature.properties.name}</h3>
                        <p className="text-sm text-bristol-stone mt-1">{feature.properties.address}</p>
                        <p className="text-sm text-bristol-stone">{feature.properties.cityState}</p>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {feature.properties.status || "Operating"}
                          </Badge>
                          {feature.properties.units && (
                            <Badge variant="outline" className="text-xs ml-1">
                              {feature.properties.units} units
                            </Badge>
                          )}
                        </div>
                        {feature.properties.completionYear && (
                          <p className="text-xs text-bristol-stone mt-1">
                            Completed: {feature.properties.completionYear}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name={`Pipeline Sites (${pipeFeatures.length})`}>
            <>
              {showPipeline && pipeFeatures.map((feature, i) => {
                const [lng, lat] = feature.geometry.coordinates;
                return (
                  <CircleMarker 
                    key={`pl-${feature.properties.id}-${i}`} 
                    center={[lat, lng]} 
                    radius={10} 
                    pathOptions={{ color: "#d97706", weight: 2, fillOpacity: 0.6 }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-bristol-ink">{feature.properties.name}</h3>
                        <p className="text-sm text-bristol-stone mt-1">{feature.properties.address}</p>
                        <p className="text-sm text-bristol-stone">{feature.properties.cityState}</p>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {feature.properties.status}
                          </Badge>
                          {feature.properties.units && (
                            <Badge variant="outline" className="text-xs ml-1">
                              {feature.properties.units} units
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </>
          </LayersControl.Overlay>

          {/* KML Layers */}
          {kmlLayers.map((layer, index) => (
            <LayersControl.Overlay 
              key={`kml-${index}`} 
              checked={layer.visible} 
              name={`${layer.name} (${layer.data.features.length} features)`}
            >
              <KMLLayer 
                kmlData={layer.data} 
                visible={layer.visible} 
                name={layer.name}
              />
            </LayersControl.Overlay>
          ))}
        </LayersControl>

        <FitBounds features={allShownFeatures} />
      </MapContainer>

      {/* Control panels */}
      <div className="absolute top-3 left-3 z-[1000] flex gap-2">
        {/* Quick toggles */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-bristol-stone/20">
          <CardContent className="p-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showOperating} 
                  onChange={e => setShowOperating(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Operating ({opFeatures.length})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showPipeline} 
                  onChange={e => setShowPipeline(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Pipeline ({pipeFeatures.length})</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* File upload and layer management */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white/95 backdrop-blur-sm">
              <Layers className="h-4 w-4 mr-2" />
              Layers ({kmlLayers.length})
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Map Layers</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-4 mt-6">
              <div>
                <Label htmlFor="file-upload" className="text-sm font-medium">
                  Upload KML/KMZ Files
                </Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file-upload"
                    multiple
                    accept=".kml,.kmz"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline" 
                    className="w-full"
                    disabled={isProcessingFiles}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isProcessingFiles ? 'Processing...' : 'Choose Files'}
                  </Button>
                </div>
                <p className="text-xs text-bristol-stone mt-1">
                  Supports .kml and .kmz files
                </p>
              </div>

              {kmlLayers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Loaded Layers</h4>
                  <div className="space-y-2">
                    {kmlLayers.map((layer, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={layer.visible}
                            onChange={() => toggleLayerVisibility(index)}
                            className="rounded"
                          />
                          <div>
                            <p className="text-sm font-medium">{layer.name}</p>
                            <p className="text-xs text-bristol-stone">
                              {layer.data.features.length} features
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLayer(index)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Map info */}
      <div className="absolute bottom-3 left-3 z-[1000]">
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-bristol-stone/20">
          <CardContent className="p-2">
            <div className="flex items-center gap-2 text-xs text-bristol-stone">
              <MapPin className="h-3 w-3" />
              <span>
                {isLoading ? 'Loading...' : `${allShownFeatures.length} sites shown`}
              </span>
              {kmlLayers.length > 0 && (
                <>
                  <span>•</span>
                  <span>{kmlLayers.filter(l => l.visible).length} layers active</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}