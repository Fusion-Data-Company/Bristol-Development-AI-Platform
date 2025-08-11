import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import JSZip from "jszip";
import * as togeojson from "@tmcw/togeojson";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, TrendingUp, Users, DollarSign, Layers, Satellite, Map as MapIcon, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Site } from '@shared/schema';

interface MapLibreMapProps {
  sites?: Site[];
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

export default function MapLibreMap({ 
  sites = [], 
  selectedSiteId, 
  onSiteSelect, 
  onMapClick,
  className,
  kmlData,
  showControls = true,
  fullScreen = false
}: MapLibreMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [arcgisOn, setArcgisOn] = useState(false);
  const [layers, setLayers] = useState({
    marketHeat: true,
    demographics: false,
    housing: false,
    kml: true
  });

  useEffect(() => {
    if (map.current || !mapRef.current) return;
    
    map.current = new maplibregl.Map({
      container: mapRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-94.7844, 38.9197], // Kansas City
      zoom: 11
    });
    
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    
    // Handle map clicks
    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick(e.lngLat.lng, e.lngLat.lat);
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [onMapClick]);

  // Add site markers when sites change
  useEffect(() => {
    if (!map.current || !sites.length) return;

    // Remove existing site markers
    sites.forEach((_, index) => {
      const markerId = `site-marker-${index}`;
      if (map.current?.getLayer(markerId)) {
        map.current.removeLayer(markerId);
      }
      if (map.current?.getSource(markerId)) {
        map.current.removeSource(markerId);
      }
    });

    // Add new site markers
    sites.forEach((site, index) => {
      const markerId = `site-marker-${index}`;
      const markerData = {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [site.longitude, site.latitude]
        },
        properties: {
          id: site.id,
          name: site.name,
          address: site.address,
          bristolScore: site.bristolScore || 75,
          selected: selectedSiteId === site.id
        }
      };

      map.current?.addSource(markerId, {
        type: 'geojson',
        data: markerData
      });

      map.current?.addLayer({
        id: markerId,
        type: 'circle',
        source: markerId,
        paint: {
          'circle-radius': selectedSiteId === site.id ? 12 : 8,
          'circle-color': selectedSiteId === site.id ? '#8B5A2B' : getScoreColor(site.bristolScore || 75),
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Add click handler for site markers
      map.current?.on('click', markerId, () => {
        onSiteSelect?.(site);
      });

      map.current?.on('mouseenter', markerId, () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current?.on('mouseleave', markerId, () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });
    });
  }, [sites, selectedSiteId, onSiteSelect]);

  // Process KML data on load
  useEffect(() => {
    if (!map.current || !kmlData || !layers.kml) return;

    try {
      const xml = new DOMParser().parseFromString(kmlData, "application/xml");
      const gj = togeojson.kml(xml);
      
      if (gj?.features?.length) {
        const id = "parlay-kml-data";
        
        // Remove existing KML layer
        if (map.current.getLayer(id + "-fill")) {
          map.current.removeLayer(id + "-fill");
        }
        if (map.current.getLayer(id + "-line")) {
          map.current.removeLayer(id + "-line");
        }
        if (map.current.getSource(id)) {
          map.current.removeSource(id);
        }

        map.current.addSource(id, { 
          type: "geojson", 
          data: gj 
        });
        
        map.current.addLayer({ 
          id: id + "-fill", 
          type: "fill", 
          source: id, 
          paint: { 
            "fill-opacity": 0.4, 
            "fill-color": "#00BCD4" 
          }
        });
        
        map.current.addLayer({ 
          id: id + "-line", 
          type: "line", 
          source: id, 
          paint: { 
            "line-color": "#008BA3", 
            "line-width": 2 
          }
        });

        // Fit bounds to KML data
        fit(gj);
      }
    } catch (err) {
      console.error("KML parse error:", err);
    }
  }, [kmlData, layers.kml]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !map.current) return;
    
    try {
      let kmlText = "";
      if (file.name.toLowerCase().endsWith(".kmz")) {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const entry = Object.values(zip.files).find(f => f.name.toLowerCase().endsWith(".kml"));
        if (!entry) { 
          alert("No KML inside KMZ."); 
          return; 
        }
        kmlText = await entry.async("text");
      } else {
        kmlText = await file.text();
      }
      
      const xml = new DOMParser().parseFromString(kmlText, "application/xml");
      const gj = togeojson.kml(xml);
      
      if (!gj?.features?.length) { 
        alert("No features in KML."); 
        return; 
      }
      
      const id = "uploaded-kml-" + Math.random().toString(36).slice(2, 8);
      map.current.addSource(id, { type: "geojson", data: gj });
      map.current.addLayer({ 
        id: id + "-fill", 
        type: "fill", 
        source: id, 
        paint: { 
          "fill-opacity": 0.25, 
          "fill-color": "#00BCD4" 
        }
      });
      map.current.addLayer({ 
        id: id + "-line", 
        type: "line", 
        source: id, 
        paint: { 
          "line-color": "#008BA3", 
          "line-width": 1 
        }
      });
      fit(gj);
    } catch (err) {
      console.error("KML/KMZ parse error:", err);
      alert("Failed to load KML/KMZ.");
    } finally {
      e.target.value = "";
    }
  }

  function fit(gj: any) {
    if (!gj?.features?.length || !map.current) return;
    const b = boundsOf(gj);
    if (b) map.current.fitBounds(b, { padding: 40 });
  }

  function boundsOf(gj: any) {
    let minX = +Infinity, minY = +Infinity, maxX = -Infinity, maxY = -Infinity;
    
    function scan(c: any) {
      if (Array.isArray(c[0])) c.forEach(scan);
      else {
        const [x, y] = c; 
        if (x < minX) minX = x; 
        if (y < minY) minY = y;
        if (x > maxX) maxX = x; 
        if (y > maxY) maxY = y;
      }
    }
    
    gj.features.forEach((f: any) => {
      const g = f.geometry;
      if (!g) return;
      if (g.type === "Point") scan([g.coordinates]);
      else if (g.type === "GeometryCollection") g.geometries.forEach((gg: any) => scan(gg.coordinates));
      else scan(g.coordinates);
    });
    
    if (!isFinite(minX)) return null;
    return [[minX, minY], [maxX, maxY]];
  }

  async function toggleArcGIS() {
    setArcgisOn(v => !v);
    const srcId = "esri-basemap";
    const lyrId = "esri-basemap";
    
    if (!map.current) return;
    
    if (!arcgisOn) {
      const url = "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
      if (!map.current.getSource(srcId)) {
        map.current.addSource(srcId, { 
          type: "raster", 
          tiles: [url], 
          tileSize: 256 
        });
        map.current.addLayer({ 
          id: lyrId, 
          type: "raster", 
          source: srcId 
        }, map.current.getStyle().layers[0]?.id);
      }
    } else {
      if (map.current.getLayer(lyrId)) map.current.removeLayer(lyrId);
      if (map.current.getSource(srcId)) map.current.removeSource(srcId);
    }
  }

  const handleLayerToggle = (layer: string) => {
    setLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  return (
    <div className={cn("relative w-full border border-bristol-sky rounded-xl overflow-hidden", fullScreen ? "h-screen" : "h-[70vh]", className)}>
      {/* Top Controls */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-bristol-sky">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-bristol-maroon" />
          <input 
            type="file" 
            accept=".kml,.kmz" 
            onChange={onFile} 
            className="text-xs"
          />
        </div>
        <Button 
          size="sm"
          variant="outline"
          onClick={toggleArcGIS}
          className="text-xs"
        >
          {arcgisOn ? "Hide ArcGIS" : "Show ArcGIS"}
        </Button>
      </div>

      {/* PARLAY Status Indicator */}
      {kmlData && layers.kml && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-cyan-400/90 border-2 border-cyan-400 rounded-lg px-3 py-1 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-bold">PARLAY Parcels Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Layer Controls */}
      {showControls && (
        <div className="absolute top-2 right-2 z-10">
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-bristol-sky">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-bristol-ink flex items-center gap-2">
                <Layers className="w-3 h-3" />
                Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {Object.entries(layers).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-bristol-stone capitalize">
                    {key === 'kml' ? 'PARLAY' : key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <Button
                    size="sm"
                    variant={enabled ? "default" : "outline"}
                    onClick={() => handleLayerToggle(key)}
                    className="h-5 w-8 text-xs px-1"
                  >
                    {enabled ? "ON" : "OFF"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Map Info */}
      <div className="absolute bottom-2 left-2 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1 shadow-lg border border-bristol-sky">
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="w-3 h-3 text-bristol-maroon" />
            <span className="text-bristol-ink font-medium">Kansas City Area</span>
            <span className="text-bristol-stone">•</span>
            <span className="text-bristol-stone">{sites.length} sites</span>
          </div>
        </div>
      </div>
    </div>
  );
}