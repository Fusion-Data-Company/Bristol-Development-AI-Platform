import { useState, useCallback } from 'react';
import Map from 'react-map-gl';
import { useQuery } from '@tanstack/react-query';
import 'mapbox-gl/dist/mapbox-gl.css';

// Use Rob's public token
const MAPBOX_TOKEN = 'pk.eyJ1Ijoicm9iZXJ0eWVhZ2VyIiwiYSI6ImNtZWRnM3IwbjA3M3IybG1zNnAzeWtuZ3EifQ.mif4Tbd3ceKQh6YAS8EPDQ';

export default function SimpleMap() {
  const [viewState, setViewState] = useState({
    longitude: -95.7129,
    latitude: 37.0902,
    zoom: 4
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

  console.log('SimpleMap rendering with sites:', sites?.length || 0);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={handleMapClick}
      />
      
      {/* Company branding overlay */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '8px',
        zIndex: 1000
      }}>
        <div style={{ fontWeight: 'bold' }}>Company Development</div>
        <div style={{ color: '#22d3ee', fontSize: '14px' }}>
          {Array.isArray(sites) ? sites.length : 0} Properties
        </div>
      </div>
      
      {/* Simple orange markers for sites */}
      {Array.isArray(sites) && sites.map((site: any) => (
        site.latitude && site.longitude ? (
          <div
            key={site.id}
            style={{
              position: 'absolute',
              transform: 'translate(-50%, -100%)',
              left: `${((site.longitude + 180) / 360) * 100}%`,
              top: `${((90 - site.latitude) / 180) * 100}%`,
              width: '20px',
              height: '20px',
              background: '#ff6600',
              borderRadius: '50%',
              border: '2px solid white',
              cursor: 'pointer',
              zIndex: 100
            }}
            title={site.name}
          />
        ) : null
      ))}
      
      {/* Demographic Popup */}
      {demographicPopup && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid #ccc',
          zIndex: 1001,
          minWidth: '320px',
          maxWidth: '400px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '20px', height: '20px', background: '#dc2626', borderRadius: '4px' }}></div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Location Demographics
            </h3>
          </div>
          
          {demographicPopup.loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                border: '2px solid #dc2626', 
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span style={{ marginLeft: '8px', color: '#374151' }}>Loading demographic data...</span>
            </div>
          ) : demographicPopup.data ? (
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                {demographicPopup.data.location?.address || `${demographicPopup.lat.toFixed(4)}, ${demographicPopup.lng.toFixed(4)}`}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div>
                  <div style={{ color: '#6b7280' }}>Population</div>
                  <div style={{ fontWeight: '500', color: '#1f2937' }}>
                    {demographicPopup.data.demographics?.population?.toLocaleString() || '—'}
                  </div>
                </div>
                
                <div>
                  <div style={{ color: '#6b7280' }}>Median Income</div>
                  <div style={{ fontWeight: '500', color: '#1f2937' }}>
                    {demographicPopup.data.demographics?.median_income ? 
                      `$${demographicPopup.data.demographics.median_income.toLocaleString()}` : '—'}
                  </div>
                </div>
                
                <div>
                  <div style={{ color: '#6b7280' }}>Median Rent</div>
                  <div style={{ fontWeight: '500', color: '#1f2937' }}>
                    {demographicPopup.data.demographics?.median_rent ? 
                      `$${demographicPopup.data.demographics.median_rent.toLocaleString()}` : '—'}
                  </div>
                </div>
                
                <div>
                  <div style={{ color: '#6b7280' }}>Avg Age</div>
                  <div style={{ fontWeight: '500', color: '#1f2937' }}>
                    {demographicPopup.data.demographics?.median_age || '—'}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setDemographicPopup(null)}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '8px 12px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <div style={{ color: '#6b7280', fontSize: '14px', padding: '8px' }}>
              No demographic data available for this location.
            </div>
          )}
        </div>
      )}
    </div>
  );
}