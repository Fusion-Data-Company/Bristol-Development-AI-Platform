import { DOMParser } from '@xmldom/xmldom';

export interface KMLFeature {
  id: string;
  name: string;
  description?: string;
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, any>;
}

export interface KMLData {
  type: 'FeatureCollection';
  features: KMLFeature[];
  networkLinks?: {
    name: string;
    href: string;
  }[];
}

export function parseKML(kmlString: string): KMLData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(kmlString, 'text/xml');
  
  const features: KMLFeature[] = [];
  const networkLinks: { name: string; href: string }[] = [];
  
  // Parse NetworkLinks
  const networkLinkElements = doc.getElementsByTagName('NetworkLink');
  for (let i = 0; i < networkLinkElements.length; i++) {
    const networkLink = networkLinkElements[i];
    const nameElement = networkLink.getElementsByTagName('name')[0];
    const linkElement = networkLink.getElementsByTagName('Link')[0];
    const hrefElement = linkElement?.getElementsByTagName('href')[0];
    
    if (nameElement && hrefElement) {
      networkLinks.push({
        name: nameElement.textContent || '',
        href: hrefElement.textContent || ''
      });
    }
  }
  
  // Parse Placemarks
  const placemarks = doc.getElementsByTagName('Placemark');
  
  for (let i = 0; i < placemarks.length; i++) {
    const placemark = placemarks[i];
    const feature = parsePlacemark(placemark, i);
    if (feature) {
      features.push(feature);
    }
  }
  
  return {
    type: 'FeatureCollection',
    features,
    networkLinks
  };
}

function parsePlacemark(placemark: Element, index: number): KMLFeature | null {
  const nameElement = placemark.getElementsByTagName('name')[0];
  const descriptionElement = placemark.getElementsByTagName('description')[0];
  
  const name = nameElement?.textContent || `Feature ${index + 1}`;
  const description = descriptionElement?.textContent || '';
  
  // Parse geometry
  let geometry: KMLFeature['geometry'] | null = null;
  
  // Check for Point
  const pointElement = placemark.getElementsByTagName('Point')[0];
  if (pointElement) {
    const coordinates = parseCoordinates(pointElement.getElementsByTagName('coordinates')[0]);
    if (coordinates && coordinates.length > 0) {
      geometry = {
        type: 'Point',
        coordinates: coordinates[0]
      };
    }
  }
  
  // Check for LineString
  const lineStringElement = placemark.getElementsByTagName('LineString')[0];
  if (lineStringElement) {
    const coordinates = parseCoordinates(lineStringElement.getElementsByTagName('coordinates')[0]);
    if (coordinates) {
      geometry = {
        type: 'LineString',
        coordinates: coordinates
      };
    }
  }
  
  // Check for Polygon
  const polygonElement = placemark.getElementsByTagName('Polygon')[0];
  if (polygonElement) {
    const outerBoundary = polygonElement.getElementsByTagName('outerBoundaryIs')[0];
    const linearRing = outerBoundary?.getElementsByTagName('LinearRing')[0];
    const coordinates = parseCoordinates(linearRing?.getElementsByTagName('coordinates')[0]);
    
    if (coordinates) {
      geometry = {
        type: 'Polygon',
        coordinates: [coordinates]
      };
    }
  }
  
  if (!geometry) {
    return null;
  }
  
  return {
    id: `kml-feature-${index}`,
    name,
    description,
    geometry,
    properties: {
      description
    }
  };
}

function parseCoordinates(coordinatesElement: Element | undefined): number[][] | null {
  if (!coordinatesElement || !coordinatesElement.textContent) {
    return null;
  }
  
  const coordinatesText = coordinatesElement.textContent.trim();
  const coordinateTuples = coordinatesText.split(/\s+/);
  
  const coordinates: number[][] = [];
  
  for (const tuple of coordinateTuples) {
    const parts = tuple.split(',');
    if (parts.length >= 2) {
      const lon = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      const alt = parts.length > 2 ? parseFloat(parts[2]) : 0;
      
      if (!isNaN(lon) && !isNaN(lat)) {
        coordinates.push([lon, lat, alt]);
      }
    }
  }
  
  return coordinates;
}

export async function fetchNetworkLink(href: string): Promise<KMLData | null> {
  try {
    // Handle CORS and fetch the network link
    const response = await fetch(href);
    if (!response.ok) {
      throw new Error(`Failed to fetch network link: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    let kmlContent: string;
    
    if (contentType.includes('application/vnd.google-earth.kmz') || href.endsWith('.kmz')) {
      // Handle KMZ files (compressed KML)
      const arrayBuffer = await response.arrayBuffer();
      // For now, we'll need to handle KMZ extraction on the server side
      // or use a client-side zip library
      throw new Error('KMZ files require server-side processing');
    } else {
      kmlContent = await response.text();
    }
    
    return parseKML(kmlContent);
  } catch (error) {
    console.error('Error fetching network link:', error);
    return null;
  }
}