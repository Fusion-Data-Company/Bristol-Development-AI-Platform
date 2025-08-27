import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { type Site } from '@shared/schema';

// Initialize Mapbox token
mapboxgl.accessToken = 'pk.eyJ1Ijoicm9iZXJ0eWVhZ2VyIiwiYSI6ImNtZWRnM3IwbjA3M3IybG1zNnAzeWtuZ3EifQ.mif4Tbd3ceKQh6YAS8EPDQ';

interface MapContainerProps {
  sites: Site[];
  onSiteSelect?: (site: Site) => void;
  selectedSite?: Site | null;
  className?: string;
}

export function MapContainer({ sites, onSiteSelect, selectedSite, className }: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-80.8431, 35.2271], // Charlotte, NC
      zoom: 10
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when sites change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    sites.forEach(site => {
      if (site.latitude && site.longitude) {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = selectedSite?.id === site.id ? '#9e1b32' : '#d4a574';
        el.style.border = '2px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

        const marker = new mapboxgl.Marker(el)
          .setLngLat([site.longitude, site.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 8px;">
                  <h3 style="font-weight: bold; margin: 0 0 4px 0;">${site.name}</h3>
                  <p style="margin: 0; font-size: 14px; color: #666;">
                    ${site.city}, ${site.state}
                  </p>
                  ${(site as any).companyScore ? `
                    <p style="margin: 4px 0 0 0; font-size: 14px;">
                      <strong>Company Score:</strong> ${(site as any).companyScore}
                    </p>
                  ` : ''}
                </div>
              `)
          )
          .addTo(map.current!);

        el.addEventListener('click', () => {
          onSiteSelect?.(site);
        });

        markers.current.push(marker);
      }
    });

    // Fit bounds if we have sites
    if (sites.length > 0 && sites.some(s => s.latitude && s.longitude)) {
      const bounds = new mapboxgl.LngLatBounds();
      sites.forEach(site => {
        if (site.latitude && site.longitude) {
          bounds.extend([site.longitude, site.latitude]);
        }
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  }, [sites, selectedSite, onSiteSelect]);

  // Center on selected site
  useEffect(() => {
    if (!map.current || !selectedSite) return;

    if (selectedSite.latitude && selectedSite.longitude) {
      map.current.flyTo({
        center: [selectedSite.longitude, selectedSite.latitude],
        zoom: 14,
        duration: 1500
      });
    }
  }, [selectedSite]);

  return (
    <div 
      ref={mapContainer} 
      className={className || 'w-full h-full'}
      style={{ minHeight: '400px' }}
    />
  );
}