import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoicm9iZXJ0eWVhZ2VyIiwiYSI6ImNtZWRnM3IwbjA3M3IybG1zNnAzeWtuZ3EifQ.mif4Tbd3ceKQh6YAS8EPDQ';

export default function CleanMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [demographicPopup, setDemographicPopup] = useState<{lat: number, lng: number, loading: boolean, data?: any} | null>(null);
  
  // Get your sites data
  const { data: sites = [] } = useQuery<any[]>({
    queryKey: ['/api/sites']
  });

  // Initialize map ONCE - simple and working
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      console.log('🗺️ Creating WORKING map...');
      
      // Use simple satellite tiles that always work
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'mapbox-satellite': {
              type: 'raster',
              url: 'mapbox://mapbox.satellite',
              tileSize: 512
            }
          },
          layers: [{
            id: 'satellite',
            type: 'raster',
            source: 'mapbox-satellite'
          }]
        },
        center: [-86.7968, 36.15678], // Nashville (where your properties are)
        zoom: 10
      });

      // Add basic controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        console.log('✅ SATELLITE MAP LOADED!');
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('❌ Satellite failed, trying OpenStreetMap:', e);
        // Emergency fallback to OSM
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
        
        setTimeout(() => {
          if (!map.current && mapContainer.current) {
            console.log('🚨 EMERGENCY OSM FALLBACK...');
            map.current = new mapboxgl.Map({
              container: mapContainer.current,
              style: {
                version: 8,
                sources: {
                  'osm': {
                    type: 'raster',
                    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                    tileSize: 256,
                    attribution: '© OpenStreetMap contributors'
                  }
                },
                layers: [{
                  id: 'osm-layer',
                  type: 'raster',
                  source: 'osm'
                }]
              },
              center: [-86.7968, 36.15678],
              zoom: 10
            });
            
            map.current.on('load', () => {
              console.log('✅ OSM FALLBACK LOADED!');
              setMapLoaded(true);
            });
          }
        }, 1000);
      });

      // Add click handler for demographics
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
      console.error('❌ Failed to create map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers for sites
  useEffect(() => {
    if (!map.current || !mapLoaded || !Array.isArray(sites) || !sites.length) return;

    console.log(`📍 Adding ${sites.length} property markers...`);

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(m => m.remove());

    // Add site markers
    sites.forEach((site: any) => {
      if (site.latitude && site.longitude) {
        // Create bright, visible marker
        const el = document.createElement('div');
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.backgroundColor = '#ff4444';
        el.style.border = '3px solid white';
        el.style.borderRadius = '50%';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        // Add popup with property info
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; min-width: 200px;">
            <strong style="color: #333;">${site.name || 'Property'}</strong><br/>
            <div style="color: #666; font-size: 12px;">
              ${site.addrLine1 || ''}<br/>
              ${site.city || ''}, ${site.state || ''}<br/>
              Status: ${site.status || 'Unknown'}<br/>
              Units: ${site.unitsTotal || 'N/A'}
            </div>
          </div>
        `);

        new mapboxgl.Marker(el)
          .setLngLat([site.longitude, site.latitude])
          .setPopup(popup)
          .addTo(map.current!);
      }
    });

    // Fit to show all properties
    if (sites.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      sites.forEach((site: any) => {
        if (site.latitude && site.longitude) {
          bounds.extend([site.longitude, site.latitude]);
        }
      });
      
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { 
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 14
        });
      }
    }
  }, [sites, mapLoaded]);


  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Status indicator */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur rounded-lg px-4 py-2">
        <div className="text-white font-bold">Bristol Development</div>
        <div className="text-cyan-400 text-sm">{sites.length} Properties</div>
        <div className={`text-xs mt-1 ${mapLoaded ? 'text-green-400' : 'text-yellow-400'}`}>
          {mapLoaded ? '✅ Map Ready' : '⏳ Loading...'}
        </div>
      </div>

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-white text-xl">Loading Map...</h2>
            <p className="text-gray-400">Getting your property data ready</p>
          </div>
        </div>
      )}

      {/* Demographic Popup */}
      {demographicPopup && (
        <div className="absolute bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-300 z-50 min-w-[300px]"
             style={{
               top: '50%',
               left: '50%',
               transform: 'translate(-50%, -50%)'
             }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <h3 className="font-semibold text-gray-900">Demographics</h3>
          </div>
          
          {demographicPopup.loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
              <span className="ml-2 text-gray-700">Loading...</span>
            </div>
          ) : demographicPopup.data ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-600">
                {demographicPopup.lat.toFixed(4)}, {demographicPopup.lng.toFixed(4)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Population:</span>
                  <div className="font-medium">{demographicPopup.data.demographics?.population?.toLocaleString() || '—'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Med. Income:</span>
                  <div className="font-medium">${demographicPopup.data.demographics?.median_income?.toLocaleString() || '—'}</div>
                </div>
              </div>
              <button 
                onClick={() => setDemographicPopup(null)}
                className="w-full mt-3 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="text-gray-600 text-sm">No data available</div>
          )}
        </div>
      )}
    </div>
  );
}