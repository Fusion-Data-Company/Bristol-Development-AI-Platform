// Use dynamic imports to avoid ES module issues in Node.js environment

interface KMLResolverOptions {
  kmlText?: string;
  kmlUrl?: string;
}

interface ResolvedLayer {
  href: string;
  geojson: any;
}

export class KMLResolver {
  private parser: any;

  constructor() {
    // Initialize in resolve method to avoid module loading issues
  }

  async resolve(options: KMLResolverOptions): Promise<ResolvedLayer[]> {
    // Initialize DOMParser with proper Node.js imports
    const { DOMParser } = require('@xmldom/xmldom');
    this.parser = new DOMParser();
    const JSZip = require('jszip');
    const { kml } = require('@tmcw/togeojson');

    const { kmlText, kmlUrl } = options;
    let xmlText = kmlText;

    if (!xmlText && kmlUrl) {
      console.log('Fetching KML from URL:', kmlUrl);
      const response = await fetch(kmlUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Company Site Intelligence Platform)',
          'Accept': 'application/vnd.google-earth.kmz, application/xml, text/xml, */*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      xmlText = Buffer.from(arrayBuffer).toString('utf-8');
    }

    if (!xmlText) {
      throw new Error('Provide kmlText or kmlUrl');
    }

    const doc = this.parser.parseFromString(xmlText, 'text/xml');
    const layers: ResolvedLayer[] = [];

    // Collect NetworkLink targets
    const hrefs = Array.from(doc.getElementsByTagName('href'))
      .map((n: any) => (n.textContent || '').trim())
      .filter(Boolean);

    console.log('Found NetworkLink hrefs:', hrefs);

    // Include any top-level features too
    try {
      const topGJ = kml(doc);
      if (topGJ?.features?.length) {
        layers.push({ href: 'top-level', geojson: topGJ });
      }
    } catch (err) {
      console.log('No top-level features found');
    }

    // Resolve each linked layer
    for (const href of hrefs) {
      try {
        console.log('Resolving NetworkLink:', href);
        
        // Try multiple approaches for authentication
        let response = await this.fetchWithFallbacks(href);
        
        if (!response.ok) {
          console.error(`Failed to fetch ${href}: ${response.status} ${response.statusText}`);
          console.error('Response headers:', Object.fromEntries(response.headers.entries()));
          
          try {
            const errorBody = await response.text();
            console.error('Error response body:', errorBody);
          } catch (e) {
            console.error('Could not read error response body');
          }
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || '';
        let innerKml = null;

        if (href.toLowerCase().endsWith('.kmz') || contentType.includes('zip')) {
          console.log('Processing KMZ file...');
          const zip = await JSZip.loadAsync(arrayBuffer);
          
          // Pick the first .kml file found
          const kmlFiles = Object.keys(zip.files).filter(filename => 
            filename.toLowerCase().endsWith('.kml')
          );
          
          if (kmlFiles.length === 0) {
            console.log('No KML files found in KMZ');
            continue;
          }
          
          const entry = zip.files[kmlFiles[0]];
          innerKml = await entry.async('text');
          console.log(`Extracted KML from ${kmlFiles[0]}, length:`, innerKml.length);
        } else {
          innerKml = Buffer.from(arrayBuffer).toString('utf-8');
          console.log('Processing KML file, length:', innerKml.length);
        }

        const innerXml = this.parser.parseFromString(innerKml, 'text/xml');
        const gj = kml(innerXml);
        
        if (gj?.features?.length) {
          console.log(`Converted to GeoJSON: ${gj.features.length} features`);
          layers.push({ href, geojson: gj });
        }
      } catch (linkError: any) {
        console.error(`Error processing NetworkLink ${href}:`, linkError.message);
        continue;
      }
    }

    console.log(`KML resolve complete: ${layers.length} layers found`);
    return layers;
  }

  private async fetchWithFallbacks(href: string): Promise<Response> {
    // First try: Original URL as-is
    let response = await fetch(href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Company Site Intelligence Platform)',
        'Accept': 'application/vnd.google-earth.kmz, application/xml, text/xml, */*'
      }
    });
    
    // If 403 or 405, try different user agents and approaches
    if (response.status === 403 || response.status === 405) {
      console.log(`${response.status} error, trying Google Earth user agent...`);
      response = await fetch(href, {
        headers: {
          'User-Agent': 'GoogleEarth/7.3.6.9345(Windows;Microsoft Windows (6.2.9200.0);en;kml:2.2;client:Pro;type:default)',
          'Accept': 'application/vnd.google-earth.kmz, application/xml, text/xml, */*'
        }
      });
      console.log('Google Earth user agent response status:', response.status);
      
      // If still not working, try without query parameters
      if (!response.ok && href.includes('?')) {
        console.log('Trying URL without query parameters...');
        const baseUrl = href.split('?')[0];
        response = await fetch(baseUrl, {
          headers: {
            'User-Agent': 'GoogleEarth/7.3.6.9345(Windows;Microsoft Windows (6.2.9200.0);en;kml:2.2;client:Pro;type:default)',
            'Accept': 'application/vnd.google-earth.kmz, application/xml, text/xml, */*'
          }
        });
        console.log('Base URL response status:', response.status);
      }
    }

    return response;
  }
}