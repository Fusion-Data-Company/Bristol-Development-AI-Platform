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
    
    const fetchArcGISDataWithRetry = async (retryCount = 0) => {
      // Check circuit breaker
      if (isCircuitBreakerOpen()) {
        setError('ArcGIS service temporarily disabled due to repeated failures');
        setLoading(false);
        return;
      }

      // Check retry limits
      if (retryCount >= MAX_RETRIES) {
        const errorMsg = `ArcGIS layer fetch max retries (${MAX_RETRIES}) exceeded`;
        console.log(errorMsg);
        recordFailure();
        setError(errorMsg);
        setLoading(false);
        return;
      }

      if (retryCount === 0) {
        setLoading(true);
        setError(null);
      }
      
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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${queryUrl}?${params}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`ArcGIS layer request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Convert to proper GeoJSON if needed
        const geoJson = {
          type: 'FeatureCollection',
          features: data.features || []
        };

        setGeoJsonData(geoJson);
        recordSuccess(); // Record success for circuit breaker
        setError(null);
        setLoading(false);
        
      } catch (err: any) {
        console.error(`ArcGIS layer attempt ${retryCount + 1}/${MAX_RETRIES} failed:`, err.message);
        
        // Handle specific error types
        if (err.name === 'AbortError') {
          console.error('ArcGIS layer request timed out');
        }
        
        // Exponential backoff before retry
        if (retryCount < MAX_RETRIES - 1) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s...
          console.log(`Retrying ArcGIS layer request in ${delay}ms...`);
          
          setTimeout(() => {
            fetchArcGISDataWithRetry(retryCount + 1).catch(console.error);
          }, delay);
        } else {
          // Final failure - record it and set error state
          recordFailure();
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    };

    // Start the fetch with retry logic
    fetchArcGISDataWithRetry().catch((err) => {
      console.error('Unhandled error in ArcGIS layer fetch:', err);
      recordFailure();
      setError('ArcGIS layer fetch failed with unhandled error');
      setLoading(false);
    });
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

// Circuit breaker state for ArcGIS API
let arcGISFailureCount = 0;
let lastFailureTime = 0;
const FAILURE_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 300000; // 5 minutes
const MAX_RETRIES = 3;

// Check if circuit breaker should block the request
function isCircuitBreakerOpen(): boolean {
  if (arcGISFailureCount >= FAILURE_THRESHOLD) {
    const timeSinceLastFailure = Date.now() - lastFailureTime;
    if (timeSinceLastFailure < CIRCUIT_BREAKER_TIMEOUT) {
      console.log('ArcGIS circuit breaker is OPEN - blocking request');
      return true;
    } else {
      // Reset circuit breaker after timeout
      arcGISFailureCount = 0;
      console.log('ArcGIS circuit breaker RESET - allowing requests');
    }
  }
  return false;
}

// Record failure and update circuit breaker
function recordFailure() {
  arcGISFailureCount++;
  lastFailureTime = Date.now();
  console.warn(`ArcGIS failure count: ${arcGISFailureCount}/${FAILURE_THRESHOLD}`);
}

// Record success and reset failure count
function recordSuccess() {
  if (arcGISFailureCount > 0) {
    console.log('ArcGIS request succeeded - resetting failure count');
    arcGISFailureCount = 0;
  }
}

// Hook for fetching demographic data from ArcGIS with bulletproof error handling
export function useArcGISDemographics(bbox?: [number, number, number, number]) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bbox) return;

    const fetchDemographicsWithRetry = async (retryCount = 0): Promise<void> => {
      // Check circuit breaker BEFORE making any request
      if (isCircuitBreakerOpen()) {
        setError('ArcGIS service temporarily disabled due to repeated failures');
        setData([]);
        setLoading(false);
        return;
      }

      // Check retry limits
      if (retryCount >= MAX_RETRIES) {
        const errorMsg = `ArcGIS max retries (${MAX_RETRIES}) exceeded - stopping`;
        console.log(errorMsg);
        recordFailure();
        setError(errorMsg);
        setData([]);
        setLoading(false);
        return;
      }

      if (retryCount === 0) {
        setLoading(true);
        setError(null);
      }
      
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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${layerUrl}?${params}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`ArcGIS HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.features) {
          // Process demographic data
          const demographics = result.features.map((feature: any) => ({
            totalPopulation: feature.attributes.TOTPOP_CY || 0,
            medianIncome: feature.attributes.MEDHINC_CY || 0,
            averageIncome: feature.attributes.AVGHINC_CY || 0,
            workingAge: feature.attributes.POP25_64 || 0,
            education: feature.attributes.EDUCYPOSTGRAD || 0
          }));
          
          setData(demographics);
          recordSuccess(); // Record success for circuit breaker
        } else {
          setData([]);
        }
        
        setError(null);
        setLoading(false);
        
      } catch (err: any) {
        console.error(`ArcGIS attempt ${retryCount + 1}/${MAX_RETRIES} failed:`, err.message);
        
        // Handle specific error types
        if (err.name === 'AbortError') {
          console.error('ArcGIS request timed out');
        }
        
        // Exponential backoff before retry
        if (retryCount < MAX_RETRIES - 1) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s...
          console.log(`Retrying ArcGIS request in ${delay}ms...`);
          
          setTimeout(() => {
            fetchDemographicsWithRetry(retryCount + 1).catch(console.error);
          }, delay);
        } else {
          // Final failure - record it and set error state
          recordFailure();
          setError(`ArcGIS failed after ${MAX_RETRIES} attempts: ${err.message}`);
          setData([]);
          setLoading(false);
        }
      }
    };

    // Start the fetch with retry logic
    fetchDemographicsWithRetry().catch((err) => {
      console.error('Unhandled error in ArcGIS fetch:', err);
      recordFailure();
      setError('ArcGIS fetch failed with unhandled error');
      setData([]);
      setLoading(false);
    });
  }, [bbox]);

  return { data, loading, error };
}