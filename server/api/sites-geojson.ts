import { Request, Response } from "express";
import { db } from "../db.js";
import { sites } from "../../shared/schema.js";

export async function getSitesGeoJSON(req: Request, res: Response) {
  try {
    const sitesList = await db.select({
      id: sites.id,
      name: sites.name,
      status: sites.status,
      addrLine1: sites.addrLine1,
      city: sites.city,
      state: sites.state,
      latitude: sites.latitude,
      longitude: sites.longitude,
      unitsTotal: sites.unitsTotal,
      completionYear: sites.completionYear,
      acsYear: sites.acsYear,
      acsProfile: sites.acsProfile,
    }).from(sites);

    // Convert to GeoJSON FeatureCollection
    const features = sitesList
      .filter(site => site.latitude && site.longitude)
      .map(site => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [site.longitude, site.latitude]
        },
        properties: {
          id: site.id,
          name: site.name,
          propertyName: site.name, // For compatibility
          status: site.status,
          address: site.addrLine1,
          cityState: `${site.city}, ${site.state}`,
          units: site.unitsTotal,
          completedYear: site.completionYear,
          acs_year: site.acsYear,
          acs_profile: site.acsProfile
        }
      }));

    const geoJSON = {
      type: "FeatureCollection",
      features
    };

    res.json(geoJSON);
  } catch (error: any) {
    console.error("Error fetching sites GeoJSON:", error);
    res.status(500).json({ 
      error: "Failed to fetch sites data",
      message: error.message 
    });
  }
}