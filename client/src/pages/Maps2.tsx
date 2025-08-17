import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import SimpleChrome from '@/components/brand/SimpleChrome';
import bristolMapsBg from "@assets/thumbnail-1_1755405960845.jpg";

// Valid Mapbox token
mapboxgl.accessToken = 'pk.eyJ1Ijoicm9iZXJ0eWVhZ2VyIiwiYSI6ImNtZWRnM3IwbjA3M3IybG1zNnAzeWtuZ3EifQ.mif4Tbd3ceKQh6YAS8EPDQ';

export default function Maps2() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<string>('streets-v12');
  const [demographicPopup, setDemographicPopup] = useState<{lat: number, lng: number, loading: boolean, data?: any} | null>(null);
  
  // Get sites data
  const { data: sites = [] } = useQuery<any[]>({
    queryKey: ['/api/sites']
  });

  // Initialize the perfect map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      console.log('🚀 Creating PERFECT Mapbox map...');
      
      // Create map with reliable Mapbox style
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: `mapbox://styles/mapbox/${mapStyle}`,
        center: [-86.7968, 36.15678], // Nashville - center of your properties
        zoom: 11,
        pitch: 45,
        bearing: -17.6,
        antialias: true
      });

      // Add premium controls
      map.current.addControl(new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true
      }), 'top-right');
      
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      
      map.current.addControl(new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
      }), 'bottom-left');

      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }), 'top-right');

      map.current.on('load', () => {
        console.log('✅ PERFECT map loaded successfully!');
        setMapLoaded(true);
        
        // Add terrain and buildings for premium look
        if (map.current) {
          // Add terrain
          map.current.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
          });
          
          map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
          
          // Add 3D buildings
          map.current.addLayer({
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.8
            }
          });
        }
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
      });

      // Enhanced click handler for demographics
      map.current.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        console.log('Map clicked at:', lng, lat);
        
        setDemographicPopup({ lat, lng, loading: true });
        
        try {
          const response = await fetch('/api/address/demographics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: lat, longitude: lng })
          });
          
          if (response.ok) {
            const demographicData = await response.json();
            setDemographicPopup({ lat, lng, loading: false, data: demographicData });
          } else {
            setDemographicPopup(null);
          }
        } catch (error) {
          console.error('Error fetching demographics:', error);
          setDemographicPopup(null);
        }
      });

    } catch (error) {
      console.error('Failed to create perfect map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapStyle]);

  // Add premium markers for sites
  useEffect(() => {
    if (!map.current || !mapLoaded || !Array.isArray(sites) || !sites.length) return;

    console.log(`📍 Adding ${sites.length} PREMIUM property markers...`);

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(m => m.remove());

    // Add premium site markers
    sites.forEach((site: any) => {
      if (site.latitude && site.longitude) {
        // Create premium marker
        const el = document.createElement('div');
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.backgroundColor = '#ff4444';
        el.style.border = '3px solid white';
        el.style.borderRadius = '50%';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        el.style.transition = 'all 0.2s ease';
        
        // Hover effect
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
          el.style.backgroundColor = '#ff6666';
        });
        
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.backgroundColor = '#ff4444';
        });

        // Premium popup with property info
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(`
          <div style="padding: 12px; min-width: 250px; font-family: system-ui;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="width: 12px; height: 12px; background: #ff4444; border-radius: 50%;"></div>
              <strong style="color: #333; font-size: 16px;">${site.name || 'Property'}</strong>
            </div>
            <div style="color: #666; font-size: 13px; line-height: 1.4;">
              📍 ${site.addrLine1 || ''}<br/>
              🏙️ ${site.city || ''}, ${site.state || ''} ${site.postalCode || ''}<br/>
              📊 Status: <span style="color: #22c55e; font-weight: 500;">${site.status || 'Unknown'}</span><br/>
              🏠 Total Units: <span style="font-weight: 500;">${site.unitsTotal || 'N/A'}</span><br/>
              📏 ${site.avgSf ? `Avg SF: ${site.avgSf}` : ''}<br/>
              📅 ${site.completionYear ? `Built: ${site.completionYear}` : ''}
            </div>
          </div>
        `);

        new mapboxgl.Marker(el)
          .setLngLat([site.longitude, site.latitude])
          .setPopup(popup)
          .addTo(map.current!);
      }
    });

    // Fit to show all properties with padding
    if (sites.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      sites.forEach((site: any) => {
        if (site.latitude && site.longitude) {
          bounds.extend([site.longitude, site.latitude]);
        }
      });
      
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { 
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
          maxZoom: 14
        });
      }
    }
  }, [sites, mapLoaded]);

  const changeMapStyle = (style: string) => {
    if (map.current) {
      map.current.setStyle(`mapbox://styles/mapbox/${style}`);
      setMapStyle(style);
    }
  };

  return (
    <SimpleChrome>
      <div className="relative w-full h-screen">
        {/* Bristol Background Image - Super HD Clear */}
        <div 
          className="absolute inset-0 bg-center bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url(${bristolMapsBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        
        {/* Map Container */}
        <div ref={mapContainer} className="w-full h-full relative z-10" />
        
        {/* Bristol Intelligence Overlay */}
        <div className="absolute top-4 left-4 bg-black/90 backdrop-blur rounded-lg px-4 py-3 border border-gray-700">
          <div className="text-white font-bold text-lg">Bristol Maps Intelligence</div>
          <div className="text-cyan-400 text-sm">{sites.length} Properties Mapped</div>
          <div className={`text-xs mt-1 ${mapLoaded ? 'text-green-400' : 'text-yellow-400'}`}>
            {mapLoaded ? '✅ Map Intelligence Ready' : '⏳ Loading Intelligence...'}
          </div>
        </div>

        {/* Style Selector */}
        <div className="absolute top-4 right-4 bg-black/90 backdrop-blur rounded-lg p-3 border border-gray-700">
          <div className="text-white font-semibold text-sm mb-2">Map Style</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'streets-v12', name: 'Streets' },
              { key: 'satellite-streets-v12', name: 'Satellite' },
              { key: 'light-v11', name: 'Light' },
              { key: 'dark-v11', name: 'Dark' }
            ].map(style => (
              <button
                key={style.key}
                onClick={() => changeMapStyle(style.key)}
                className={`px-3 py-2 text-xs rounded transition-all ${
                  mapStyle === style.key 
                    ? 'bg-cyan-500 text-black font-semibold' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {style.name}
              </button>
            ))}
          </div>
        </div>

        {/* Market Intelligence Panel */}
        <div className="absolute bottom-4 left-4 bg-black/90 backdrop-blur rounded-lg p-4 border border-gray-700 min-w-[300px]">
          <div className="text-white font-semibold mb-3">Market Intelligence</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Total Portfolio</div>
              <div className="text-cyan-400 font-bold text-lg">{sites.length} Properties</div>
            </div>
            <div>
              <div className="text-gray-400">Total Units</div>
              <div className="text-green-400 font-bold text-lg">
                {sites.reduce((sum, site) => sum + (site.unitsTotal || 0), 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Markets</div>
              <div className="text-orange-400 font-bold text-lg">
                {new Set(sites.map(site => site.city)).size}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Avg Year Built</div>
              <div className="text-purple-400 font-bold text-lg">
                {Math.round(sites.reduce((sum, site, _, arr) => sum + (site.completionYear || 2020), 0) / sites.length) || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-500 mx-auto mb-4"></div>
              <h2 className="text-white text-2xl font-bold">Bristol Maps Intelligence</h2>
              <p className="text-gray-400 mt-2">Loading premium mapping experience...</p>
            </div>
          </div>
        )}

        {/* Premium Demographic Popup */}
        {demographicPopup && (
          <div className="absolute bg-white/98 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-gray-200 z-50 min-w-[350px]"
               style={{
                 top: '50%',
                 left: '50%',
                 transform: 'translate(-50%, -50%)'
               }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
              <h3 className="font-bold text-gray-900 text-lg">Location Demographics</h3>
            </div>
            
            {demographicPopup.loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <span className="ml-3 text-gray-700 font-medium">Analyzing location...</span>
              </div>
            ) : demographicPopup.data ? (
              <div className="space-y-4">
                <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
                  📍 {demographicPopup.lat.toFixed(4)}, {demographicPopup.lng.toFixed(4)}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-gray-600 text-sm font-medium">Population</div>
                    <div className="text-blue-700 font-bold text-xl">
                      {demographicPopup.data.demographics?.population?.toLocaleString() || '—'}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-gray-600 text-sm font-medium">Median Income</div>
                    <div className="text-green-700 font-bold text-xl">
                      {demographicPopup.data.demographics?.median_income ? 
                        `$${demographicPopup.data.demographics.median_income.toLocaleString()}` : '—'}
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-gray-600 text-sm font-medium">Median Rent</div>
                    <div className="text-purple-700 font-bold text-xl">
                      {demographicPopup.data.demographics?.median_rent ? 
                        `$${demographicPopup.data.demographics.median_rent.toLocaleString()}` : '—'}
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-gray-600 text-sm font-medium">Median Age</div>
                    <div className="text-orange-700 font-bold text-xl">
                      {demographicPopup.data.demographics?.median_age || '—'}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setDemographicPopup(null)}
                  className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 font-semibold transition-all"
                >
                  Close Analysis
                </button>
              </div>
            ) : (
              <div className="text-gray-600 text-center py-4">
                No demographic data available for this location.
              </div>
            )}
          </div>
        )}
      </div>
    </SimpleChrome>
  );
}