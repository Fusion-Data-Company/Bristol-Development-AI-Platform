import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';

// SET YOUR TOKEN - This is Rob's public token
mapboxgl.accessToken = 'pk.eyJ1Ijoicm9iZXJ0eWVhZ2VyIiwiYSI6ImNtZWRnM3IwbjA3M3IybG1zNnAzeWtuZ3EifQ.mif4Tbd3ceKQh6YAS8EPDQ';

export default function CleanMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [demographicPopup, setDemographicPopup] = useState<{lat: number, lng: number, loading: boolean, data?: any} | null>(null);
  
  // Get your sites data
  const { data: sites = [] } = useQuery<any[]>({
    queryKey: ['/api/sites']
  });

  // Initialize map ONCE
  useEffect(() => {
    // Prevent multiple initializations
    if (map.current) return;
    if (!mapContainer.current) return;

    let mapInstance: mapboxgl.Map | null = null;

    try {
      console.log('✅ Using Mapbox token:', mapboxgl.accessToken ? mapboxgl.accessToken.substring(0, 20) + '...' : 'MISSING');
      console.log('✅ Token validation:', mapboxgl.accessToken ? 'VALID' : 'MISSING');
      
      // Check if Mapbox GL JS is supported
      if (!mapboxgl.supported()) {
        throw new Error('Mapbox GL JS not supported');
      }
      console.log('✅ Mapbox GL JS browser support confirmed');

      // Try Mapbox built-in style first (most reliable)
      console.log('🗺️ Attempting to load Mapbox built-in style...');
      try {
        mapInstance = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-121.4944, 38.5816], // Sacramento
          zoom: 10
        });
        console.log('✅ Mapbox style loading...');
      } catch (styleError) {
        console.log('⚠️ Mapbox style failed, trying CartoDB tiles:', styleError);
        // Fallback to CartoDB tiles (very reliable)
        mapInstance = new mapboxgl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              'carto-tiles': {
                type: 'raster',
                tiles: [
                  'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                  'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                  'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution: '© CartoDB, © OpenStreetMap contributors'
              }
            },
            layers: [{
              id: 'carto-tiles',
              type: 'raster',
              source: 'carto-tiles'
            }]
          },
          center: [-121.4944, 38.5816],
          zoom: 10
        });
        console.log('✅ CartoDB fallback loaded');
      }

      map.current = mapInstance;
      setIsInitializing(false);

      // Add controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      map.current.on('load', () => {
        console.log('✅ Map loaded successfully');
        setMapLoaded(true);
        setMapError('');
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
        console.log('🔍 Error details:', JSON.stringify(e, null, 2));
        
        // If it's a style error, try secondary fallback
        if (e.error && (e.error.message.includes('style') || e.error.message.includes('source'))) {
          console.log('🔄 Style/source error - trying emergency fallback...');
          
          setTimeout(() => {
            try {
              if (map.current) {
                map.current.remove();
              }
              
              // Emergency fallback - OpenStreetMap with different approach
              map.current = new mapboxgl.Map({
                container: mapContainer.current!,
                style: {
                  version: 8,
                  sources: {
                    'osm-tiles': {
                      type: 'raster',
                      tiles: [
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                      ],
                      tileSize: 256,
                      attribution: '© OpenStreetMap contributors'
                    }
                  },
                  layers: [{
                    id: 'osm-layer',
                    type: 'raster',
                    source: 'osm-tiles',
                    minzoom: 0,
                    maxzoom: 18
                  }]
                },
                center: [-121.4944, 38.5816],
                zoom: 10
              });
              
              map.current.on('load', () => {
                console.log('✅ Emergency fallback map loaded!');
                setMapLoaded(true);
                setMapError('');
              });
              
              map.current.on('error', (fallbackError) => {
                console.error('❌ All fallbacks failed:', fallbackError);
                setMapError('All map sources failed - please reload');
              });
              
            } catch (fallbackError) {
              console.error('❌ Emergency fallback failed:', fallbackError);
              setMapError('Critical map error - please reload page');
            }
          }, 1000);
        } else {
          setMapError('Map error: ' + (e.error?.message || 'Unknown error'));
        }
      });
      
      // Add tile loading monitoring
      map.current.on('sourcedata', (e) => {
        if (e.isSourceLoaded) {
          console.log('📡 Tiles loaded for source:', e.sourceId);
        }
      });
      
      map.current.on('data', (e) => {
        if (e.dataType === 'source' && e.isSourceLoaded) {
          console.log('📊 Data ready for source:', e.sourceId);
        }
      });

      // Add click handler for demographics
      map.current.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        console.log('Map clicked at:', lng, lat);
        
        // Show loading popup immediately
        setDemographicPopup({ lat, lng, loading: true });
        
        try {
          // Fetch demographic data for these coordinates
          const response = await fetch('/api/address/demographics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ latitude: lat, longitude: lng })
          });
          
          if (response.ok) {
            const demographicData = await response.json();
            setDemographicPopup({ lat, lng, loading: false, data: demographicData });
          } else {
            console.error('Failed to fetch demographics:', response.statusText);
            setDemographicPopup(null);
          }
        } catch (error) {
          console.error('Error fetching demographics:', error);
          setDemographicPopup(null);
        }
      });

    } catch (error) {
      console.error('❌ Failed to initialize map:', error);
      setMapError(`Map initialization failed: ${error}`);
      setIsInitializing(false);
    }

    // Cleanup function - CRITICAL
    return () => {
      try {
        if (mapInstance) {
          mapInstance.remove();
        }
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
    };
  }, []); // Empty deps - run once

  // Add markers for sites
  useEffect(() => {
    if (!map.current || !mapLoaded || !Array.isArray(sites) || !sites.length) return;

    // Clear existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(m => m.remove());

    // Add site markers
    (sites as any[]).forEach((site: any) => {
      if (site.latitude && site.longitude) {
        // Create custom marker
        const el = document.createElement('div');
        el.className = 'bristol-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundColor = '#ff6b35';
        el.style.border = '2px solid white';
        el.style.borderRadius = '50%';
        el.style.cursor = 'pointer';

        // Add popup
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 8px;">
              <strong>${site.name || site.address}</strong>
              ${site.status ? `<br/>Status: ${site.status}` : ''}
              ${site.units ? `<br/>Units: ${site.units}` : ''}
            </div>
          `);

        // Create marker
        new mapboxgl.Marker(el)
          .setLngLat([site.longitude, site.latitude])
          .setPopup(popup)
          .addTo(map.current!);
      }
    });

    // Fit to bounds if we have sites
    if (Array.isArray(sites) && sites.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      (sites as any[]).forEach((site: any) => {
        if (site.latitude && site.longitude) {
          bounds.extend([site.longitude, site.latitude]);
        }
      });
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }

  }, [sites, mapLoaded]);

  // Loading display
  if (isInitializing) {
    return (
      <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-white text-xl mb-2">Loading Map...</h2>
          <p className="text-gray-400">Initializing Bristol property map</p>
        </div>
      </div>
    );
  }

  // Error display (non-blocking)
  if (mapError && !mapLoaded) {
    return (
      <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-red-500 text-2xl mb-4">Map Loading Issue</h2>
          <p className="text-white mb-4">{mapError}</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
            <button 
              onClick={() => { setMapError(''); setIsInitializing(true); }} 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Retry Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Map status overlay */}
      {!mapLoaded && (
        <div className="absolute top-4 right-4 bg-yellow-500/90 backdrop-blur rounded-lg px-3 py-2">
          <div className="text-black text-sm font-medium">Map Loading...</div>
        </div>
      )}
      
      {mapError && mapLoaded && (
        <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur rounded-lg px-3 py-2">
          <div className="text-white text-sm font-medium">Map Warning</div>
        </div>
      )}
      
      {/* Bristol branding overlay */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur rounded-lg px-4 py-2">
        <div className="text-white font-bold">Bristol Development</div>
        <div className="text-cyan-400 text-sm">{Array.isArray(sites) ? sites.length : 0} Properties</div>
        <div className="text-green-400 text-xs mt-1">
          {mapLoaded ? '✅ Map Ready' : '⏳ Loading...'}
        </div>
      </div>

      {/* Demographic Popup */}
      {demographicPopup && (
        <div className="absolute bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-300 z-50 min-w-[320px] max-w-[400px]"
             style={{
               top: '50%',
               left: '50%',
               transform: 'translate(-50%, -50%)'
             }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-red-600 rounded"></div>
            <h3 className="font-serif text-lg font-semibold text-gray-900">
              Location Demographics
            </h3>
          </div>
          
          {demographicPopup.loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
              <span className="ml-2 text-gray-700">Loading demographic data...</span>
            </div>
          ) : demographicPopup.data ? (
            <div className="space-y-3">
              <div className="text-xs text-gray-600 mb-2">
                {demographicPopup.data.location?.address || `${demographicPopup.lat.toFixed(4)}, ${demographicPopup.lng.toFixed(4)}`}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Population</span>
                  </div>
                  <div className="font-medium text-gray-900">
                    {demographicPopup.data.demographics?.population?.toLocaleString() || '—'}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Median Income</span>
                  </div>
                  <div className="font-medium text-gray-900">
                    {demographicPopup.data.demographics?.median_income ? 
                      `$${demographicPopup.data.demographics.median_income.toLocaleString()}` : '—'}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Median Rent</span>
                  </div>
                  <div className="font-medium text-gray-900">
                    {demographicPopup.data.demographics?.median_rent ? 
                      `$${demographicPopup.data.demographics.median_rent.toLocaleString()}` : '—'}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Avg Age</span>
                  </div>
                  <div className="font-medium text-gray-900">
                    {demographicPopup.data.demographics?.median_age || '—'}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setDemographicPopup(null)}
                className="w-full mt-3 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="text-gray-600 text-sm py-2">
              No demographic data available for this location.
            </div>
          )}
        </div>
      )}
    </div>
  );
}