import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Site {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  addrLine1?: string;
  city?: string;
  state?: string;
}

interface SiteMapPreviewProps {
  site: Site | null;
}

export function SiteMapPreview({ site }: SiteMapPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Check if MapLibre GL is available
  const maplibregl = (window as any).maplibregl;

  useEffect(() => {
    if (!mapContainerRef.current || !maplibregl || mapRef.current) return;

    // Initialize map
    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-86.7816, 36.1627], // Default to Nashville
      zoom: 10,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [maplibregl]);

  useEffect(() => {
    if (!mapRef.current || !maplibregl) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    // Add new marker if site has coordinates
    if (site && site.latitude && site.longitude) {
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-bristol-ink">${site.name}</h3>
          ${site.addrLine1 ? `<p class="text-sm text-bristol-stone mt-1">${site.addrLine1}</p>` : ''}
          ${site.city && site.state ? `<p class="text-sm text-bristol-stone">${site.city}, ${site.state}</p>` : ''}
        </div>
      `);

      markerRef.current = new maplibregl.Marker({
        color: '#8B0000' // bristol-maroon
      })
        .setLngLat([site.longitude, site.latitude])
        .setPopup(popup)
        .addTo(mapRef.current);

      // Fly to the location
      mapRef.current.flyTo({
        center: [site.longitude, site.latitude],
        zoom: 15,
        duration: 1000
      });
    }
  }, [site, maplibregl]);

  // If MapLibre GL is not available, show fallback
  if (!maplibregl) {
    return (
      <div className="h-64 bg-bristol-cream/10 rounded-lg flex items-center justify-center">
        <div className="text-center text-bristol-stone">
          <p className="text-sm">Map Preview</p>
          <p className="text-xs mt-1">MapLibre GL not available</p>
          {site && site.latitude && site.longitude && (
            <div className="mt-2 text-xs">
              <p>{site.name}</p>
              <p>{site.latitude?.toFixed(6)}, {site.longitude?.toFixed(6)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-lg overflow-hidden border"
        style={{ minHeight: '256px' }}
      />
      {!site && (
        <div className="absolute inset-0 bg-bristol-cream/80 rounded-lg flex items-center justify-center">
          <p className="text-bristol-stone text-sm">Select a site to view location</p>
        </div>
      )}
      {site && (!site.latitude || !site.longitude) && (
        <div className="absolute inset-0 bg-bristol-cream/80 rounded-lg flex items-center justify-center">
          <div className="text-center text-bristol-stone">
            <p className="text-sm font-medium">{site.name}</p>
            <p className="text-xs mt-1">No coordinates available</p>
            <p className="text-xs">Use "Geocode Address" to add location</p>
          </div>
        </div>
      )}
    </div>
  );
}