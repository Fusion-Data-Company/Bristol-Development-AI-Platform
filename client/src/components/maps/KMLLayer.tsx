import { useState, useEffect } from 'react';
import { Source, Layer } from 'react-map-gl';
import { parseKML } from '@/utils/kmlParser';
import type { KMLFeature } from '@/utils/kmlParser';

interface KMLLayerProps {
  kmlData?: string;
  kmlUrl?: string;
  visible?: boolean;
  onFeaturesLoad?: (features: KMLFeature[]) => void;
  onFeatureClick?: (feature: any) => void;
}

export function KMLLayer({ kmlData, kmlUrl, visible = true, onFeaturesLoad, onFeatureClick }: KMLLayerProps) {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!kmlData && !kmlUrl) {
      return;
    }

    const loadKMLData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let kmlText: string;

        if (kmlData) {
          kmlText = kmlData;
        } else if (kmlUrl) {
          const response = await fetch(kmlUrl);
          if (response.ok) {
            kmlText = await response.text();
          } else {
            throw new Error(`Failed to fetch KML from ${kmlUrl}`);
          }
        } else {
          return;
        }
        
        // ALWAYS call server resolver to get PARLAY parcels
        console.log('Calling server resolver for PARLAY data...');
        
        const resolverResponse = await fetch('/api/kml/resolve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ kmlText })
        });

        console.log('KML resolver response status:', resolverResponse.status);
        
        if (resolverResponse.ok) {
          const resolveData = await resolverResponse.json();
          console.log('KML resolver response data:', resolveData);
          
          if (resolveData.ok && resolveData.layers && resolveData.layers.length > 0) {
            console.log(`KML resolver returned ${resolveData.layers.length} layers`);
            
            // Use only the resolved PARLAY data
            const allFeatures: any[] = [];
            
            for (const layer of resolveData.layers) {
              if (layer.geojson && layer.geojson.features) {
                console.log(`Adding ${layer.geojson.features.length} features from ${layer.href}`);
                
                // Add all features as PARLAY
                const layerFeatures = layer.geojson.features.map((feature: any) => ({
                  ...feature,
                  properties: {
                    ...feature.properties,
                    source: 'PARLAY',
                    networkHref: layer.href
                  }
                }));
                
                allFeatures.push(...layerFeatures);
              }
            }
            
            const mergedGeoJson = {
              type: 'FeatureCollection' as const,
              features: allFeatures
            };
            
            console.log('Final GeoJSON data:', JSON.stringify(mergedGeoJson, null, 2));
            setGeoJsonData(mergedGeoJson);
            onFeaturesLoad?.(allFeatures);
            console.log(`Total PARLAY features loaded: ${allFeatures.length}`);
          } else {
            console.warn('No layers returned from KML resolver');
          }
        } else {
          console.error('KML resolver HTTP error:', resolverResponse.status);
          const errorText = await resolverResponse.text();
          console.error('Error response body:', errorText);
        }
        
      } catch (err) {
        console.error('Error loading KML:', err);
        setError(err instanceof Error ? err.message : 'Failed to load KML');
      } finally {
        setLoading(false);
      }
    };

    loadKMLData();
  }, [kmlData, kmlUrl, visible, onFeaturesLoad]);

  if (!visible || !geoJsonData) {
    return null;
  }

  console.log('Rendering KML layer with data:', geoJsonData);

  return (
    <Source id="kml-data" type="geojson" data={geoJsonData}>
      {/* Simple PARLAY polygons with bright cyan fill */}
      <Layer
        id="kml-polygons"
        type="fill"
        filter={['==', ['geometry-type'], 'Polygon']}
        paint={{
          'fill-color': '#00FFFF', // Bright cyan
          'fill-opacity': 0.6
        }}
      />
      
      {/* Simple PARLAY polygon borders */}
      <Layer
        id="kml-polygons-border"
        type="line" 
        filter={['==', ['geometry-type'], 'Polygon']}
        paint={{
          'line-color': '#00FFFF', // Bright cyan
          'line-width': 3
        }}
      />
    </Source>
  );
}