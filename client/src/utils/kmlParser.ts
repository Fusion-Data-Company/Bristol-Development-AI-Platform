export interface KMLFeature {
  id: string;
  name: string;
  description?: string;
  properties: Record<string, any>;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
}

export interface KMLData {
  name: string;
  description?: string;
  features: KMLFeature[];
}

export function parseKML(kmlText: string): KMLData {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlText, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid KML format');
    }
    
    const kmlElement = xmlDoc.querySelector('kml');
    if (!kmlElement) {
      throw new Error('No KML element found');
    }
    
    const documentElement = kmlElement.querySelector('Document') || kmlElement;
    const documentName = documentElement.querySelector('name')?.textContent || 'Unnamed KML';
    const documentDescription = documentElement.querySelector('description')?.textContent;
    
    const features: KMLFeature[] = [];
    
    // Parse Placemarks
    const placemarks = documentElement.querySelectorAll('Placemark');
    placemarks.forEach((placemark, index) => {
      const feature = parsePlacemark(placemark, index);
      if (feature) {
        features.push(feature);
      }
    });
    
    // Parse Folders recursively
    const folders = documentElement.querySelectorAll('Folder');
    folders.forEach(folder => {
      const folderPlacemarks = folder.querySelectorAll('Placemark');
      folderPlacemarks.forEach((placemark, index) => {
        const feature = parsePlacemark(placemark, features.length + index);
        if (feature) {
          features.push(feature);
        }
      });
    });
    
    return {
      name: documentName,
      description: documentDescription,
      features
    };
    
  } catch (error) {
    console.error('Error parsing KML:', error);
    throw new Error(`Failed to parse KML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function parsePlacemark(placemark: Element, index: number): KMLFeature | null {
  try {
    const name = placemark.querySelector('name')?.textContent || `Feature ${index + 1}`;
    const description = placemark.querySelector('description')?.textContent;
    
    // Extract properties from ExtendedData
    const properties: Record<string, any> = {};
    const extendedData = placemark.querySelector('ExtendedData');
    if (extendedData) {
      const simpleData = extendedData.querySelectorAll('SimpleData');
      simpleData.forEach(data => {
        const key = data.getAttribute('name');
        const value = data.textContent;
        if (key && value) {
          properties[key] = value;
        }
      });
    }
    
    // Parse geometry
    const geometry = parseGeometry(placemark);
    if (!geometry) {
      console.warn(`No geometry found for placemark: ${name}`);
      return null;
    }
    
    return {
      id: `feature-${index}`,
      name,
      description,
      properties,
      geometry
    };
    
  } catch (error) {
    console.error('Error parsing placemark:', error);
    return null;
  }
}

function parseGeometry(element: Element): { type: string; coordinates: any } | null {
  // Point
  const point = element.querySelector('Point coordinates');
  if (point) {
    const coords = parseCoordinates(point.textContent || '');
    if (coords.length > 0) {
      return {
        type: 'Point',
        coordinates: coords[0]
      };
    }
  }
  
  // LineString
  const lineString = element.querySelector('LineString coordinates');
  if (lineString) {
    const coords = parseCoordinates(lineString.textContent || '');
    return {
      type: 'LineString',
      coordinates: coords
    };
  }
  
  // Polygon
  const polygon = element.querySelector('Polygon');
  if (polygon) {
    const outerBoundary = polygon.querySelector('outerBoundaryIs LinearRing coordinates');
    if (outerBoundary) {
      const coords = parseCoordinates(outerBoundary.textContent || '');
      const rings = [coords];
      
      // Handle inner boundaries (holes)
      const innerBoundaries = polygon.querySelectorAll('innerBoundaryIs LinearRing coordinates');
      innerBoundaries.forEach(inner => {
        const innerCoords = parseCoordinates(inner.textContent || '');
        if (innerCoords.length > 0) {
          rings.push(innerCoords);
        }
      });
      
      return {
        type: 'Polygon',
        coordinates: rings
      };
    }
  }
  
  // MultiGeometry
  const multiGeometry = element.querySelector('MultiGeometry');
  if (multiGeometry) {
    const geometries: any[] = [];
    
    // Collect all sub-geometries
    multiGeometry.querySelectorAll('Point, LineString, Polygon').forEach(geom => {
      const subGeometry = parseGeometry(geom);
      if (subGeometry) {
        geometries.push(subGeometry);
      }
    });
    
    if (geometries.length > 0) {
      return {
        type: 'GeometryCollection',
        coordinates: geometries
      };
    }
  }
  
  return null;
}

function parseCoordinates(coordText: string): number[][] {
  try {
    const coordinates: number[][] = [];
    const tuples = coordText.trim().split(/\s+/);
    
    for (const tuple of tuples) {
      const coords = tuple.split(',').map(c => parseFloat(c.trim())).filter(n => !isNaN(n));
      if (coords.length >= 2) {
        // KML format is longitude,latitude,altitude (optional)
        // Convert to [longitude, latitude] for GeoJSON compatibility
        coordinates.push([coords[0], coords[1]]);
      }
    }
    
    return coordinates;
  } catch (error) {
    console.error('Error parsing coordinates:', error);
    return [];
  }
}