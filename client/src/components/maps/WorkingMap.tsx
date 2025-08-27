import { useState, useCallback } from 'react';
import Map, { NavigationControl, Marker, Popup } from 'react-map-gl';
import { useQuery } from '@tanstack/react-query';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoicm9iZXJ0eWVhZ2VyIiwiYSI6ImNtZWRnM3IwbjA3M3IybG1zNnAzeWtuZ3EifQ.mif4Tbd3ceKQh6YAS8EPDQ';

export default function WorkingMap() {
  const [viewState, setViewState] = useState({
    longitude: -121.4944,
    latitude: 38.5816,
    zoom: 6
  });
  
  const [demographicPopup, setDemographicPopup] = useState<{lat: number, lng: number, loading: boolean, data?: any} | null>(null);
  
  // Get your sites data
  const { data: sites = [] } = useQuery<any[]>({
    queryKey: ['/api/sites']
  });

  // Handle map clicks for demographics
  const handleMapClick = useCallback(async (event: any) => {
    const { lng, lat } = event.lngLat;
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
  }, []);

  return (
    <div className="relative w-full h-screen">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={handleMapClick}
      >
        <NavigationControl position="top-right" />
        
        {/* Site Markers */}
        {Array.isArray(sites) && sites.map((site: any) => (
          site.latitude && site.longitude ? (
            <Marker
              key={site.id}
              longitude={site.longitude}
              latitude={site.latitude}
              anchor="bottom"
            >
              <div 
                className="w-6 h-6 bg-orange-500 border-2 border-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform"
                title={site.name}
              />
            </Marker>
          ) : null
        ))}
        
        {/* Demographic Popup */}
        {demographicPopup && (
          <Popup
            longitude={demographicPopup.lng}
            latitude={demographicPopup.lat}
            anchor="bottom"
            onClose={() => setDemographicPopup(null)}
            closeButton={true}
          >
            <div className="p-4 min-w-[320px] max-w-[400px]">
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
                      <div className="text-gray-600">Population</div>
                      <div className="font-medium text-gray-900">
                        {demographicPopup.data.demographics?.population?.toLocaleString() || '—'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-600">Median Income</div>
                      <div className="font-medium text-gray-900">
                        {demographicPopup.data.demographics?.median_income ? 
                          `$${demographicPopup.data.demographics.median_income.toLocaleString()}` : '—'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-600">Median Rent</div>
                      <div className="font-medium text-gray-900">
                        {demographicPopup.data.demographics?.median_rent ? 
                          `$${demographicPopup.data.demographics.median_rent.toLocaleString()}` : '—'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-600">Avg Age</div>
                      <div className="font-medium text-gray-900">
                        {demographicPopup.data.demographics?.median_age || '—'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 text-sm py-2">
                  No demographic data available for this location.
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>
      
      {/* Company branding overlay */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur rounded-lg px-4 py-2">
        <div className="text-white font-bold">Company Development</div>
        <div className="text-cyan-400 text-sm">{Array.isArray(sites) ? sites.length : 0} Properties</div>
      </div>
    </div>
  );
}