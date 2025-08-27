import { useEffect, useState } from 'react';
import { Source, Layer } from 'react-map-gl';
import { parseKML, fetchNetworkLink, type KMLData, type KMLFeature } from '@/utils/kmlParser';

interface KMLLayerProps {
  kmlData?: string;
  kmlUrl?: string;
  visible: boolean;
  onFeaturesLoad?: (features: KMLFeature[]) => void;
}

export function KMLLayer({ kmlData, kmlUrl, visible, onFeaturesLoad }: KMLLayerProps) {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    
    const loadKMLData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let parsedData: KMLData;
        
        if (kmlData) {
          // Parse provided KML string
          parsedData = parseKML(kmlData);
        } else if (kmlUrl) {
          // Fetch and parse KML from URL
          const response = await fetch(kmlUrl);
          const kmlText = await response.text();
          parsedData = parseKML(kmlText);
        } else {
          return;
        }
        
        // Convert to GeoJSON format for MapBox
        const geoJson = {
          type: 'FeatureCollection',
          features: parsedData.features.map(feature => ({
            type: 'Feature',
            id: feature.id,
            properties: {
              name: feature.name,
              description: feature.description,
              ...feature.properties
            },
            geometry: {
              type: feature.geometry.type,
              coordinates: feature.geometry.coordinates
            }
          }))
        };
        
        setGeoJsonData(geoJson);
        onFeaturesLoad?.(parsedData.features);
        
        // ALWAYS call server resolver for PARLAY data
        console.log('Checking for network links or calling resolver for PARLAY data...');
        
        // Call server resolver to get PARLAY parcels
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
          if (resolveData.ok && resolveData.layers) {
            console.log(`KML resolver returned ${resolveData.layers.length} layers`);
            
            // Merge all resolved layers with existing data
            const allFeatures = [...geoJson.features];
            const networkFeatures: any[] = [];
            
            for (const layer of resolveData.layers) {
              if (layer.geojson && layer.geojson.features) {
                console.log(`Adding ${layer.geojson.features.length} features from ${layer.href}`);
                
                const layerFeatures = layer.geojson.features.map((feature: any) => ({
                  ...feature,
                  properties: {
                    ...feature.properties,
                    source: layer.href.includes('parlay') ? 'PARLAY' : 'NetworkLink',
                    networkHref: layer.href
                  }
                }));
                
                allFeatures.push(...layerFeatures);
                networkFeatures.push(...layerFeatures);
              }
            }
            
            const mergedGeoJson = {
              type: 'FeatureCollection' as const,
              features: allFeatures
            };
            
            setGeoJsonData(mergedGeoJson);
            onFeaturesLoad?.(networkFeatures);
            console.log(`Total features loaded: ${allFeatures.length}`);
          } else {
            console.warn('No layers returned from KML resolver');
          }
        } else {
          console.error('KML resolver response not ok:', resolveData);
        }
      } else {
        console.error('KML resolver HTTP error:', resolverResponse.status, resolverResponse.statusText);
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

  return (
    <Source id="kml-data" type="geojson" data={geoJsonData}>
      {/* PARLAY Polygon layers - filled with cyan */}
      <Layer
        id="kml-polygons"
        type="fill"
        filter={['==', ['geometry-type'], 'Polygon']}
        paint={{
          'fill-color': [
            'case',
            ['==', ['get', 'source'], 'PARLAY'],
            '#00FFFF', // Cyan for PARLAY parcels
            '#8B1538'  // Company maroon for others
          ],
          'fill-opacity': [
            'case',
            ['==', ['get', 'source'], 'PARLAY'],
            0.5, // More visible for PARLAY
            0.3
          ]
        }}
      />
      
      {/* PARLAY Polygon outlines - cyan */}
      <Layer
        id="kml-polygon-outlines"
        type="line"
        filter={['==', ['geometry-type'], 'Polygon']}
        paint={{
          'line-color': [
            'case',
            ['==', ['get', 'source'], 'PARLAY'],
            '#00CED1', // Dark turquoise for PARLAY outlines
            '#8B1538'
          ],
          'line-width': [
            'case',
            ['==', ['get', 'source'], 'PARLAY'],
            3, // Thicker lines for PARLAY
            2
          ],
          'line-opacity': 1.0
        }}
      />
      
      {/* Line layers */}
      <Layer
        id="kml-lines"
        type="line"
        filter={['==', ['geometry-type'], 'LineString']}
        paint={{
          'line-color': '#8B1538',
          'line-width': 3,
          'line-opacity': 0.8
        }}
      />
      
      {/* Point layers */}
      <Layer
        id="kml-points"
        type="circle"
        filter={['==', ['geometry-type'], 'Point']}
        paint={{
          'circle-color': '#8B1538',
          'circle-radius': 8,
          'circle-opacity': 0.8,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }}
      />
    </Source>
  );
}