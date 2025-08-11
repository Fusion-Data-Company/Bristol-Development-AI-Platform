import { promises as fs } from 'fs';
import path from 'path';
import { DOMParser } from '@xmldom/xmldom';
import { kml } from '@tmcw/togeojson';

interface KMLParseResult {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: any;
    geometry: any;
  }>;
}

export class KMLResolver {
  
  /**
   * Process the actual PARLAY KML file from attached assets
   * This file contains a NetworkLink to the actual data source
   */
  async processParlayKML(): Promise<KMLParseResult> {
    try {
      const kmlPath = path.join(process.cwd(), 'attached_assets', 'PARLAY Official(1)_1754937815836.kml');
      console.log('Processing PARLAY KML file:', kmlPath);
      
      // Read the KML file
      const kmlContent = await fs.readFile(kmlPath, 'utf-8');
      
      // Parse the KML content to extract NetworkLink
      const parser = new DOMParser();
      const kmlDoc = parser.parseFromString(kmlContent, 'text/xml');
      
      // Check for NetworkLink elements
      const networkLinks = kmlDoc.getElementsByTagName('NetworkLink');
      if (networkLinks.length > 0) {
        const linkElement = networkLinks[0].getElementsByTagName('Link')[0];
        const href = linkElement?.getElementsByTagName('href')[0]?.textContent;
        
        if (href) {
          console.log('Found PARLAY NetworkLink:', href);
          console.log('PARLAY data requires external network access to:', href);
          
          // For now, return an indicator that PARLAY data would be loaded from NetworkLink
          // The actual data would require network access to the PARLAY service
          return this.createParlayPlaceholderData(href);
        }
      }
      
      // If no NetworkLink, try to parse as regular KML
      const geoJson = kml(kmlDoc) as KMLParseResult;
      console.log(`Parsed PARLAY KML: ${geoJson.features.length} features found`);
      
      if (geoJson.features.length === 0) {
        console.log('No direct features found - PARLAY uses NetworkLink for data loading');
        return this.createParlayPlaceholderData();
      }
      
      // Process any direct features
      const processedFeatures = geoJson.features.map((feature, index) => ({
        ...feature,
        properties: {
          ...feature.properties,
          source: 'PARLAY',
          bristolId: `PARLAY_${index + 1}`,
          displayName: feature.properties?.name || `PARLAY Parcel ${index + 1}`,
          description: feature.properties?.description || 'PARLAY Real Estate Parcel',
          style: {
            fillColor: '#00FFFF',  // Cyan as requested
            fillOpacity: 0.3,
            strokeColor: '#00FFFF',
            strokeWidth: 2,
            strokeOpacity: 0.8
          }
        }
      }));

      return {
        type: 'FeatureCollection',
        features: processedFeatures
      };
      
    } catch (error) {
      console.error('Error processing PARLAY KML:', error);
      throw new Error(`Failed to process PARLAY KML: ${error.message}`);
    }
  }

  /**
   * Create placeholder data indicating PARLAY NetworkLink was found
   */
  private createParlayPlaceholderData(networkLink?: string): KMLParseResult {
    console.log('Creating PARLAY NetworkLink indicator');
    
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          source: 'PARLAY',
          name: 'PARLAY Data Source',
          description: `PARLAY parcels available via NetworkLink: ${networkLink || 'Network access required'}`,
          networkLink: networkLink,
          bristolNote: 'Actual PARLAY parcel data requires network access to ReportAllUSA service',
          style: {
            fillColor: '#00FFFF',
            fillOpacity: 0.2,
            strokeColor: '#00FFFF', 
            strokeWidth: 1,
            strokeOpacity: 0.6
          }
        },
        geometry: {
          type: 'Point',
          coordinates: [-80.8431, 35.2271] // Charlotte, NC center point
        }
      }]
    };
  }

  /**
   * Check if coordinates are in Charlotte, NC area for validation
   */
  private isInCharlotteArea(coordinates: number[]): boolean {
    const [lng, lat] = coordinates;
    // Charlotte approximate bounds: 35.0°-35.5°N, 81.0°-80.5°W
    return lat >= 35.0 && lat <= 35.5 && lng >= -81.0 && lng <= -80.5;
  }

  /**
   * Validate that parsed features contain valid geographic data
   */
  private validateFeatures(features: any[]): boolean {
    if (!features || features.length === 0) {
      console.warn('No features found in KML file');
      return false;
    }

    let validFeatures = 0;
    for (const feature of features) {
      if (feature.geometry && feature.geometry.coordinates) {
        validFeatures++;
      }
    }

    console.log(`Validation: ${validFeatures}/${features.length} features have valid geometry`);
    return validFeatures > 0;
  }
}

export const kmlResolver = new KMLResolver();