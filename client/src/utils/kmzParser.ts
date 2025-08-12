import JSZip from 'jszip';
import { parseKML, type KMLData } from './kmlParser';

export async function parseKMZ(kmzFile: File | ArrayBuffer): Promise<KMLData> {
  try {
    const zip = new JSZip();
    let zipData: ArrayBuffer;
    
    if (kmzFile instanceof File) {
      zipData = await kmzFile.arrayBuffer();
    } else {
      zipData = kmzFile;
    }
    
    const kmzContent = await zip.loadAsync(zipData);
    
    // Look for the main KML file (usually doc.kml or first .kml file)
    let kmlFileName = 'doc.kml';
    let kmlFile = kmzContent.files[kmlFileName];
    
    if (!kmlFile) {
      // Find the first .kml file
      const kmlFiles = Object.keys(kmzContent.files).filter(name => 
        name.toLowerCase().endsWith('.kml') && !kmzContent.files[name].dir
      );
      
      if (kmlFiles.length === 0) {
        throw new Error('No KML file found in KMZ archive');
      }
      
      kmlFileName = kmlFiles[0];
      kmlFile = kmzContent.files[kmlFileName];
    }
    
    const kmlText = await kmlFile.async('text');
    return parseKML(kmlText);
    
  } catch (error) {
    console.error('Error parsing KMZ file:', error);
    throw new Error(`Failed to parse KMZ file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function parseKMLOrKMZ(file: File): Promise<KMLData> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.kml')) {
    const text = await file.text();
    return parseKML(text);
  } else if (fileName.endsWith('.kmz')) {
    return parseKMZ(file);
  } else {
    throw new Error('Unsupported file type. Only .kml and .kmz files are supported.');
  }
}