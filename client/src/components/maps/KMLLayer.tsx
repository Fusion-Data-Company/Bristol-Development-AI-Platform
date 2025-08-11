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
        
        // Load network links if present
        if (parsedData.networkLinks && parsedData.networkLinks.length > 0) {
          for (const networkLink of parsedData.networkLinks) {
            try {
              const networkData = await fetchNetworkLink(networkLink.href);
              if (networkData) {
                // Merge network link data
                const mergedGeoJson = {
                  type: 'FeatureCollection',
                  features: [
                    ...geoJson.features,
                    ...networkData.features.map(feature => ({
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
                  ]
                };
                setGeoJsonData(mergedGeoJson);
              }
            } catch (networkError) {
              console.warn(`Failed to load network link: ${networkLink.href}`, networkError);
            }
          }
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
      {/* Polygon layers */}
      <Layer
        id="kml-polygons"
        type="fill"
        filter={['==', ['geometry-type'], 'Polygon']}
        paint={{
          'fill-color': '#8B1538',
          'fill-opacity': 0.3,
          'fill-outline-color': '#8B1538'
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