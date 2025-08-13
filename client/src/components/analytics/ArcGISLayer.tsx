import { useEffect, useState } from 'react';
import { Source, Layer } from 'react-map-gl';
import type { Expression } from 'mapbox-gl';

interface ArcGISLayerProps {
  serviceUrl: string;
  layerId: string;
  visible: boolean;
  layerType: 'fill' | 'line' | 'circle';
  paint?: any;
  opacity?: number;
}

interface ArcGISFeature {
  type: 'Feature';
  geometry: any;
  properties: any;
}

interface ArcGISResponse {
  features: ArcGISFeature[];
}

export function ArcGISLayer({
  serviceUrl,
  layerId,
  visible,
  layerType,
  paint,
  opacity = 0.6
}: ArcGISLayerProps) {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    
    const fetchArcGISData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Construct ArcGIS REST query URL
        const queryUrl = `${serviceUrl}/${layerId}/query`;
        const params = new URLSearchParams({
          where: '1=1',
          outFields: '*',
          f: 'geojson',
          geometryType: 'esriGeometryPolygon',
          spatialRel: 'esriSpatialRelIntersects',
          returnGeometry: 'true',
          maxRecordCount: '1000'
        });

        const response = await fetch(`${queryUrl}?${params}`);
        
        if (!response.ok) {
          throw new Error(`ArcGIS request failed: ${response.status}`);
        }

        const data = await response.json();
        
        // Convert to proper GeoJSON if needed
        const geoJson = {
          type: 'FeatureCollection',
          features: data.features || []
        };

        setGeoJsonData(geoJson);
      } catch (err) {
        console.error('Error fetching ArcGIS data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchArcGISData();
  }, [serviceUrl, layerId, visible]);

  if (!visible || !geoJsonData) {
    return null;
  }

  // Default paint styles by layer type
  const defaultPaint = {
    fill: {
      'fill-color': '#8B1538',
      'fill-opacity': opacity,
      'fill-outline-color': '#ffffff'
    },
    line: {
      'line-color': '#8B1538',
      'line-width': 2,
      'line-opacity': opacity
    },
    circle: {
      'circle-color': '#8B1538',
      'circle-radius': 6,
      'circle-opacity': opacity,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1
    }
  };

  return (
    <Source
      id={`arcgis-${layerId}`}
      type="geojson"
      data={geoJsonData}
    >
      <Layer
        id={`arcgis-layer-${layerId}`}
        type={layerType}
        paint={paint || defaultPaint[layerType]}
      />
    </Source>
  );
}

// Hook for fetching demographic data from ArcGIS
export function useArcGISDemographics(bbox?: [number, number, number, number]) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bbox) return;

    const fetchDemographics = async () => {
      setLoading(true);
      
      try {
        // Example: US Census demographic boundaries
        const serviceUrl = 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services';
        const layerUrl = `${serviceUrl}/USA_Demographics_Boundaries/FeatureServer/0/query`;
        
        const [west, south, east, north] = bbox;
        const geometry = `${west},${south},${east},${north}`;
        
        const params = new URLSearchParams({
          where: '1=1',
          geometry,
          geometryType: 'esriGeometryEnvelope',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: 'TOTPOP_CY,MEDHINC_CY,AVGHINC_CY,POP25_64,EDUCYPOSTGRAD',
          f: 'json',
          returnGeometry: 'false'
        });

        const response = await fetch(`${layerUrl}?${params}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        
        if (result.features) {
          // Process demographic data
          const demographics = result.features.map((feature: any) => ({
            totalPopulation: feature.attributes.TOTPOP_CY,
            medianIncome: feature.attributes.MEDHINC_CY,
            averageIncome: feature.attributes.AVGHINC_CY,
            workingAge: feature.attributes.POP25_64,
            education: feature.attributes.EDUCYPOSTGRAD
          }));
          
          setData(demographics);
        }
      } catch (error) {
        console.error('Error fetching ArcGIS demographics:', error);
        setData([]); // Set empty array on error to prevent infinite loops
      } finally {
        setLoading(false);
      }
    };

    fetchDemographics();
  }, [bbox]);

  return { data, loading };
}