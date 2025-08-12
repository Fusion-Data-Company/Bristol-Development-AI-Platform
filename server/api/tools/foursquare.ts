import express from 'express';
import { getCache, setCache } from '../../tools/cache';

const router = express.Router();

const DEFAULT_CATS = "17069,13032,13000,13003,18021,16032,17014,19046";
const WEIGHTS: Record<string, number> = {
  "17069": 2.0, // Grocery
  "13032": 1.5, // Coffee/Tea
  "13000": 1.0, // Restaurants
  "13003": 0.8, // Bars
  "18021": 1.5, // Fitness Center/Gym
  "16032": 1.2, // Park
  "17014": 1.2, // Pharmacy
  "19046": 1.3  // Transit Station
};

// Foursquare Places API endpoint
router.get('/', async (req, res) => {
  try {
    const { 
      lat, 
      lng, 
      radius = "1600", 
      categories = DEFAULT_CATS, 
      limit = "100" 
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "lat,lng required (use property picker)" });
    }

    // Create cache key
    const key = `fsq:${lat}:${lng}:${radius}:${categories}:${limit}`;
    const cached = getCache(key);
    if (cached) {
      return res.json(cached);
    }

    const apiKey = process.env.FOURSQUARE_API_KEY!;
    const url = new URL("https://api.foursquare.com/v3/places/search");
    url.searchParams.set("ll", `${lat},${lng}`);
    url.searchParams.set("radius", String(radius));
    url.searchParams.set("categories", String(categories));
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("sort", "RELEVANCE");

    console.log('Foursquare API request:', url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: apiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Foursquare API error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    console.log('Foursquare API response:', json);

    const rows = (json.results || []).map((place: any) => ({
      fsq_id: place.fsq_id,
      name: place.name,
      category_id: place.categories?.[0]?.id ?? null,
      category: place.categories?.[0]?.name ?? null,
      distance_m: place.distance ?? null,
      lat: place.geocodes?.main?.latitude ?? null,
      lng: place.geocodes?.main?.longitude ?? null,
      address: place.location?.formatted_address ?? null
    }));

    // Group by category and calculate scores
    const byCat: Record<string, {name: string; id: string; count: number; weight: number}> = {};
    for (const row of rows) {
      const id = String(row.category_id ?? "other");
      const weight = WEIGHTS[id] ?? 0.5;
      const name = row.category || "Other";
      byCat[id] = byCat[id] || { name, id, count: 0, weight };
      byCat[id].count++;
    }

    const amenityScore = Object.values(byCat).reduce((acc, c) => acc + c.count * c.weight, 0);

    const result = {
      params: { lat, lng, radius, categories, limit },
      amenityScore: Math.round(amenityScore * 10) / 10,
      byCategory: Object.values(byCat).sort((a, b) => b.count - a.count),
      places: rows.slice(0, 50), // Limit for UI
      totalPlaces: rows.length,
      dataSource: "Foursquare Places API",
      lastUpdated: new Date().toISOString()
    };

    // Cache for 1 hour
    setCache(key, result, 60 * 60 * 1000);
    res.json(result);

  } catch (error: any) {
    console.error("Foursquare API error:", error);
    res.status(500).json({ 
      error: "Failed to fetch Foursquare data",
      details: error.message
    });
  }
});

export default router;