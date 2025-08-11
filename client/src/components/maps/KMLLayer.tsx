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
          console.log('Loading network links:', parsedData.networkLinks);
          for (const networkLink of parsedData.networkLinks) {
            try {
              const networkData = await fetchNetworkLink(networkLink.href);
              if (networkData && networkData.features.length > 0) {
                console.log(`Loaded ${networkData.features.length} features from network link`);
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
                        source: 'PARLAY',
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
                onFeaturesLoad?.(networkData.features);
              }
            } catch (networkError) {
              console.warn(`Failed to load network link: ${networkLink.href}`, networkError);
            }
          }
        } else if (parsedData.features.length === 0) {
          // If no features in base KML and no network links, try to load sample data
          console.log('No features found, loading sample PARLAY data');
          const sampleData = await import('@/utils/kmlParser').then(module => module.createSampleParlayData());
          if (sampleData) {
            const sampleGeoJson = {
              type: 'FeatureCollection',
              features: sampleData.features.map(feature => ({
                type: 'Feature',
                id: feature.id,
                properties: {
                  name: feature.name,
                  description: feature.description,
                  source: 'PARLAY',
                  ...feature.properties
                },
                geometry: {
                  type: feature.geometry.type,
                  coordinates: feature.geometry.coordinates
                }
              }))
            };
            setGeoJsonData(sampleGeoJson);
            onFeaturesLoad?.(sampleData.features);
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
      {/* PARLAY Polygon layers - filled */}
      <Layer
        id="kml-polygons"
        type="fill"
        filter={['==', ['geometry-type'], 'Polygon']}
        paint={{
          'fill-color': [
            'case',
            ['==', ['get', 'source'], 'PARLAY'],
            '#FFD700', // Gold for PARLAY parcels
            '#8B1538'  // Bristol maroon for others
          ],
          'fill-opacity': 0.4
        }}
      />
      
      {/* PARLAY Polygon outlines */}
      <Layer
        id="kml-polygon-outlines"
        type="line"
        filter={['==', ['geometry-type'], 'Polygon']}
        paint={{
          'line-color': [
            'case',
            ['==', ['get', 'source'], 'PARLAY'],
            '#DAA520', // Darker gold for PARLAY outlines
            '#8B1538'
          ],
          'line-width': 2,
          'line-opacity': 0.9
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