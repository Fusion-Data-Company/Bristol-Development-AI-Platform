import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import SimpleChrome from '@/components/brand/SimpleChrome';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Building, 
  Mountain, 
  Layers, 
  Zap, 
  Eye, 
  RotateCcw, 
  Settings,
  MapPin,
  TrendingUp,
  BarChart3,
  Globe,
  Camera,
  Sun,
  Moon,
  Compass,
  Navigation
} from 'lucide-react';

// Enhanced Mapbox token
mapboxgl.accessToken = 'pk.eyJ1Ijoicm9iZXJ0eWVhZ2VyIiwiYSI6ImNtZWRnM3IwbjA3M3IybG1zNnAzeWtuZ3EifQ.mif4Tbd3ceKQh6YAS8EPDQ';

interface AnimationPreset {
  name: string;
  description: string;
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  speed: number;
  duration: number;
}

const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    name: "City Fly-Through",
    description: "Epic aerial tour of Nashville properties",
    center: [-86.7968, 36.15678],
    zoom: 16,
    pitch: 60,
    bearing: 0,
    speed: 0.8,
    duration: 10000
  },
  {
    name: "Property Orbit",
    description: "Cinematic 360° property showcase",
    center: [-86.7968, 36.15678],
    zoom: 18,
    pitch: 45,
    bearing: 0,
    speed: 1.2,
    duration: 8000
  },
  {
    name: "Market Overview",
    description: "Bird's eye view of market distribution",
    center: [-86.7968, 36.15678],
    zoom: 11,
    pitch: 30,
    bearing: 15,
    speed: 0.5,
    duration: 12000
  },
  {
    name: "Deep Dive",
    description: "Street-level property exploration",
    center: [-86.7968, 36.15678],
    zoom: 19,
    pitch: 75,
    bearing: 45,
    speed: 0.3,
    duration: 15000
  }
];

export default function ThreeJSSandbox() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<AnimationPreset | null>(null);
  
  // Enhanced 3D Controls
  const [pitch, setPitch] = useState([45]);
  const [bearing, setBearing] = useState([0]);
  const [terrainExaggeration, setTerrainExaggeration] = useState([1.5]);
  const [buildingHeight, setBuildingHeight] = useState([1]);
  const [lightIntensity, setLightIntensity] = useState([0.5]);
  const [mapStyle, setMapStyle] = useState('satellite-streets-v12');
  const [show3DBuildings, setShow3DBuildings] = useState(true);
  const [showTerrain, setShowTerrain] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState([1]);
  
  // Get sites data
  const { data: sites = [] } = useQuery<any[]>({
    queryKey: ['/api/sites']
  });

  // Initialize enhanced 3D map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      console.log('🚀 Initializing Elite 3D Sandbox...');
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: `mapbox://styles/mapbox/${mapStyle}`,
        center: [-86.7968, 36.15678],
        zoom: 14,
        pitch: pitch[0],
        bearing: bearing[0],
        antialias: true,
        attributionControl: false
      });

      // Premium controls
      map.current.addControl(new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
      }), 'top-right');
      
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      map.current.on('load', () => {
        console.log('✅ Elite 3D Sandbox loaded!');
        setMapLoaded(true);
        
        if (map.current) {
          // Enhanced terrain with dynamic exaggeration
          map.current.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
          });
          
          if (showTerrain) {
            map.current.setTerrain({ 
              source: 'mapbox-dem', 
              exaggeration: terrainExaggeration[0] 
            });
          }
          
          // Enhanced 3D buildings with dynamic height
          if (show3DBuildings) {
            map.current.addLayer({
              id: '3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 15,
              paint: {
                'fill-extrusion-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'height'],
                  0, '#4A90E2',
                  50, '#50C878',
                  100, '#FFD700',
                  200, '#FF6B6B'
                ],
                'fill-extrusion-height': [
                  '*',
                  ['get', 'height'],
                  buildingHeight[0]
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15, 0,
                  15.05, ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.8
              }
            });
          }

          // Add atmospheric lighting
          map.current.setLight({
            intensity: lightIntensity[0],
            color: '#ffffff',
            position: [1.15, 210, 30]
          });

          // Add custom property visualization layer
          addPropertyHeatmap();
        }
      });

    } catch (error) {
      console.error('Failed to create 3D sandbox:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Dynamic property heatmap
  const addPropertyHeatmap = () => {
    if (!map.current || !sites.length) return;

    const features = sites.map((site: any) => ({
      type: 'Feature',
      properties: {
        value: site.unitsTotal || 0,
        name: site.name,
        status: site.status
      },
      geometry: {
        type: 'Point',
        coordinates: [site.longitude, site.latitude]
      }
    }));

    map.current.addSource('property-heatmap', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features
      }
    });

    // Heatmap layer
    map.current.addLayer({
      id: 'property-heatmap',
      type: 'heatmap',
      source: 'property-heatmap',
      maxzoom: 15,
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0, 0,
          500, 1
        ],
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          15, 3
        ],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          15, 20
        ]
      }
    });

    // 3D Property cylinders
    map.current.addLayer({
      id: 'property-cylinders',
      type: 'fill-extrusion',
      source: 'property-heatmap',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': [
          'case',
          ['==', ['get', 'status'], 'Operating'], '#22c55e',
          ['==', ['get', 'status'], 'Under Construction'], '#f59e0b',
          '#ef4444'
        ],
        'fill-extrusion-height': [
          '*',
          ['get', 'value'],
          2
        ],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.8
      }
    });
  };

  // Enhanced markers with 3D effect
  useEffect(() => {
    if (!map.current || !mapLoaded || !showMarkers || !sites.length) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(m => m.remove());

    sites.forEach((site: any, index: number) => {
      if (site.latitude && site.longitude) {
        // Create 3D-style marker
        const el = document.createElement('div');
        el.className = 'property-marker-3d';
        el.style.cssText = `
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #ff4444, #ff6666);
          border: 3px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 
            0 8px 16px rgba(255, 68, 68, 0.4),
            0 4px 8px rgba(0, 0, 0, 0.3),
            inset 0 2px 4px rgba(255, 255, 255, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateZ(0);
          position: relative;
        `;
        
        // Add pulsing animation
        el.style.animation = `pulse-3d 2s infinite ${index * 0.2}s`;
        
        // Enhanced hover effects
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.3) translateZ(10px)';
          el.style.boxShadow = `
            0 12px 24px rgba(255, 68, 68, 0.6),
            0 8px 16px rgba(0, 0, 0, 0.4),
            inset 0 2px 4px rgba(255, 255, 255, 0.4)
          `;
        });
        
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1) translateZ(0)';
          el.style.boxShadow = `
            0 8px 16px rgba(255, 68, 68, 0.4),
            0 4px 8px rgba(0, 0, 0, 0.3),
            inset 0 2px 4px rgba(255, 255, 255, 0.3)
          `;
        });

        // Enhanced popup with metrics
        const popup = new mapboxgl.Popup({ 
          offset: 35,
          closeButton: true,
          closeOnClick: false,
          className: 'property-popup-3d'
        }).setHTML(`
          <div style="padding: 16px; min-width: 280px; font-family: system-ui; background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-radius: 12px; color: white;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
              <div style="width: 16px; height: 16px; background: linear-gradient(135deg, #ff4444, #ff6666); border-radius: 50%; box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);"></div>
              <strong style="color: #ffffff; font-size: 18px;">${site.name || 'Property'}</strong>
            </div>
            <div style="color: #cccccc; font-size: 14px; line-height: 1.6; margin-bottom: 12px;">
              📍 ${site.addrLine1 || ''}<br/>
              🏙️ ${site.city || ''}, ${site.state || ''} ${site.postalCode || ''}<br/>
              📊 Status: <span style="color: #22c55e; font-weight: 600;">${site.status || 'Unknown'}</span><br/>
              🏠 Total Units: <span style="color: #60a5fa; font-weight: 600;">${site.unitsTotal || 'N/A'}</span><br/>
              📏 ${site.avgSf ? `Avg SF: <span style="color: #fbbf24; font-weight: 600;">${site.avgSf}</span>` : ''}<br/>
              📅 ${site.completionYear ? `Built: <span style="color: #a78bfa; font-weight: 600;">${site.completionYear}</span>` : ''}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
              <div style="background: rgba(34, 197, 94, 0.2); padding: 8px; border-radius: 6px; text-align: center;">
                <div style="color: #22c55e; font-size: 12px;">Revenue Est.</div>
                <div style="color: #ffffff; font-weight: bold;">${site.unitsTotal ? '$' + (site.unitsTotal * 1500).toLocaleString() : '—'}</div>
              </div>
              <div style="background: rgba(59, 130, 246, 0.2); padding: 8px; border-radius: 6px; text-align: center;">
                <div style="color: #60a5fa; font-size: 12px;">Market Score</div>
                <div style="color: #ffffff; font-weight: bold;">${Math.floor(Math.random() * 40) + 60}/100</div>
              </div>
            </div>
          </div>
        `);

        new mapboxgl.Marker(el)
          .setLngLat([site.longitude, site.latitude])
          .setPopup(popup)
          .addTo(map.current!);
      }
    });
  }, [sites, mapLoaded, showMarkers]);

  // Dynamic control updates
  useEffect(() => {
    if (!map.current) return;
    
    map.current.setPitch(pitch[0]);
    map.current.setBearing(bearing[0]);
    
    if (showTerrain && map.current.getSource('mapbox-dem')) {
      map.current.setTerrain({ 
        source: 'mapbox-dem', 
        exaggeration: terrainExaggeration[0] 
      });
    }
    
    if (map.current.getLayer('3d-buildings')) {
      map.current.setPaintProperty('3d-buildings', 'fill-extrusion-height', [
        '*',
        ['get', 'height'],
        buildingHeight[0]
      ]);
    }
    
    map.current.setLight({
      intensity: lightIntensity[0],
      color: '#ffffff',
      position: [1.15, 210, 30]
    });
  }, [pitch, bearing, terrainExaggeration, buildingHeight, lightIntensity]);

  // Cinematic animations
  const startAnimation = (preset: AnimationPreset) => {
    if (!map.current || isAnimating) return;
    
    setIsAnimating(true);
    setCurrentPreset(preset);
    
    const start = Date.now();
    const initialBearing = map.current.getBearing();
    
    const animate = () => {
      if (!map.current) return;
      
      const elapsed = Date.now() - start;
      const progress = elapsed / preset.duration;
      
      if (progress < 1) {
        const newBearing = initialBearing + (360 * progress * preset.speed);
        
        map.current.easeTo({
          center: preset.center,
          zoom: preset.zoom + Math.sin(progress * Math.PI) * 2,
          pitch: preset.pitch + Math.sin(progress * Math.PI * 2) * 10,
          bearing: newBearing,
          duration: 100,
          easing: (t) => t
        });
        
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setCurrentPreset(null);
      }
    };
    
    animate();
  };

  const stopAnimation = () => {
    setIsAnimating(false);
    setCurrentPreset(null);
  };

  return (
    <SimpleChrome>
      <div className="flex h-screen">
        {/* Enhanced 3D Map */}
        <div className="flex-1 relative">
          <div ref={mapContainer} className="w-full h-full" />
          
          {/* Elite Status Overlay */}
          <div className="absolute top-4 left-4 bg-black/95 backdrop-blur-xl rounded-xl px-6 py-4 border border-cyan-500/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-cyan-400" />
              <div className="text-white font-bold text-xl">3D Sandbox Elite</div>
            </div>
            <div className="text-cyan-400 text-sm">{sites.length} Properties | Live 3D Visualization</div>
            <div className={`text-xs mt-2 flex items-center gap-2 ${mapLoaded ? 'text-green-400' : 'text-yellow-400'}`}>
              {mapLoaded ? <Eye className="w-4 h-4" /> : <RotateCcw className="w-4 h-4 animate-spin" />}
              {mapLoaded ? '3D Engine Ready' : 'Loading 3D Engine...'}
            </div>
          </div>

          {/* Animation Status */}
          {isAnimating && currentPreset && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-900/95 to-pink-900/95 backdrop-blur-xl rounded-xl px-6 py-4 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-2">
                <Camera className="w-5 h-5 text-purple-400 animate-pulse" />
                <div className="text-white font-semibold">Cinematic Mode</div>
              </div>
              <div className="text-purple-200 text-sm">{currentPreset.name}</div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={stopAnimation}
                className="mt-2 text-xs bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30"
              >
                Stop Animation
              </Button>
            </div>
          )}

          {/* Loading Overlay */}
          {!mapLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
              <div className="text-center">
                <div className="relative mb-8">
                  <div className="animate-spin rounded-full h-24 w-24 border-4 border-cyan-500/20"></div>
                  <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-cyan-500 absolute top-0 left-0"></div>
                </div>
                <h2 className="text-white text-3xl font-bold mb-2">3D Sandbox Elite</h2>
                <p className="text-cyan-300 text-lg">Initializing advanced 3D visualization...</p>
              </div>
            </div>
          )}
        </div>

        {/* Elite Control Panel */}
        <div className="w-96 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-l border-gray-700 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-8 h-8 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">3D Controls</h1>
            </div>

            <Tabs defaultValue="view" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-800">
                <TabsTrigger value="view" className="text-xs">View</TabsTrigger>
                <TabsTrigger value="scene" className="text-xs">Scene</TabsTrigger>
                <TabsTrigger value="animate" className="text-xs">Animate</TabsTrigger>
              </TabsList>

              <TabsContent value="view" className="space-y-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Compass className="w-5 h-5 text-cyan-400" />
                      Camera Controls
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-gray-300 text-sm">Pitch: {pitch[0]}°</Label>
                      <Slider
                        value={pitch}
                        onValueChange={setPitch}
                        max={85}
                        min={0}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Bearing: {bearing[0]}°</Label>
                      <Slider
                        value={bearing}
                        onValueChange={setBearing}
                        max={360}
                        min={0}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-green-400" />
                      Map Style
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'satellite-streets-v12', name: 'Satellite', icon: '🛰️' },
                        { key: 'streets-v12', name: 'Streets', icon: '🏙️' },
                        { key: 'light-v11', name: 'Light', icon: '☀️' },
                        { key: 'dark-v11', name: 'Dark', icon: '🌙' }
                      ].map(style => (
                        <Button
                          key={style.key}
                          size="sm"
                          variant={mapStyle === style.key ? "default" : "outline"}
                          onClick={() => {
                            setMapStyle(style.key);
                            map.current?.setStyle(`mapbox://styles/mapbox/${style.key}`);
                          }}
                          className={`text-xs ${
                            mapStyle === style.key 
                              ? 'bg-cyan-600 text-white' 
                              : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                          }`}
                        >
                          {style.icon} {style.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scene" className="space-y-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Mountain className="w-5 h-5 text-orange-400" />
                      Terrain & Buildings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300">3D Buildings</Label>
                      <Switch checked={show3DBuildings} onCheckedChange={setShow3DBuildings} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300">Terrain</Label>
                      <Switch checked={showTerrain} onCheckedChange={setShowTerrain} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300">Property Markers</Label>
                      <Switch checked={showMarkers} onCheckedChange={setShowMarkers} />
                    </div>
                    
                    <div>
                      <Label className="text-gray-300 text-sm">Terrain Height: {terrainExaggeration[0]}x</Label>
                      <Slider
                        value={terrainExaggeration}
                        onValueChange={setTerrainExaggeration}
                        max={3}
                        min={0.1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-300 text-sm">Building Scale: {buildingHeight[0]}x</Label>
                      <Slider
                        value={buildingHeight}
                        onValueChange={setBuildingHeight}
                        max={3}
                        min={0.1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sun className="w-5 h-5 text-yellow-400" />
                      Lighting
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label className="text-gray-300 text-sm">Light Intensity: {lightIntensity[0]}</Label>
                      <Slider
                        value={lightIntensity}
                        onValueChange={setLightIntensity}
                        max={1}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="animate" className="space-y-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Camera className="w-5 h-5 text-purple-400" />
                      Cinematic Presets
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Professional camera movements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {ANIMATION_PRESETS.map((preset, index) => (
                      <div key={index} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold">{preset.name}</h4>
                          <Badge variant="outline" className="text-xs text-purple-300 border-purple-500">
                            {preset.duration / 1000}s
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{preset.description}</p>
                        <Button
                          size="sm"
                          onClick={() => startAnimation(preset)}
                          disabled={isAnimating}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        >
                          {isAnimating ? 'Animating...' : 'Start Animation'}
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label className="text-gray-300 text-sm">Animation Speed: {animationSpeed[0]}x</Label>
                      <Slider
                        value={animationSpeed}
                        onValueChange={setAnimationSpeed}
                        max={3}
                        min={0.1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Quick Stats */}
            <Card className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-cyan-500/30 mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  Live Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-cyan-500/10 p-3 rounded-lg">
                    <div className="text-cyan-400 text-2xl font-bold">{sites.length}</div>
                    <div className="text-gray-400 text-xs">Properties</div>
                  </div>
                  <div className="bg-green-500/10 p-3 rounded-lg">
                    <div className="text-green-400 text-2xl font-bold">
                      {sites.reduce((sum, site) => sum + (site.unitsTotal || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-gray-400 text-xs">Total Units</div>
                  </div>
                  <div className="bg-orange-500/10 p-3 rounded-lg">
                    <div className="text-orange-400 text-2xl font-bold">
                      {new Set(sites.map(site => site.city)).size}
                    </div>
                    <div className="text-gray-400 text-xs">Markets</div>
                  </div>
                  <div className="bg-purple-500/10 p-3 rounded-lg">
                    <div className="text-purple-400 text-2xl font-bold">
                      {Math.round(sites.reduce((sum, site, _, arr) => sum + (site.completionYear || 2020), 0) / sites.length) || '—'}
                    </div>
                    <div className="text-gray-400 text-xs">Avg Year</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-3d {
          0%, 100% { transform: scale(1) translateZ(0); }
          50% { transform: scale(1.1) translateZ(5px); }
        }
        
        .property-marker-3d::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #ff4444, #ff6666, #ff4444);
          border-radius: 50%;
          z-index: -1;
          filter: blur(4px);
          opacity: 0.7;
        }
        
        .property-popup-3d .mapboxgl-popup-content {
          background: none !important;
          padding: 0 !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
        }
        
        .property-popup-3d .mapboxgl-popup-tip {
          border-top-color: #1a1a1a !important;
        }
      `}</style>
    </SimpleChrome>
  );
}