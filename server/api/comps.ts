import { Router } from 'express';
import { z } from 'zod';
import { comps, insertCompSchema, sites, type Comp } from '../../shared/schema';
import { db } from '../db';
import { eq, and, sql } from 'drizzle-orm';

const router = Router();

// Score calculation weights
const SCORING_WEIGHTS = {
  amenities: 0.4,  // 40%
  rentFit: 0.3,    // 30% 
  concessions: 0.2, // 20%
  distance: 0.1    // 10%
};

// Calculate comp score
function calculateCompScore(comp: any): { score: number; breakdown: any } {
  const breakdown = {
    amenities: 0,
    rentFit: 0,
    concessions: 0,
    distance: 0
  };

  // Amenities score (0-100)
  const amenitiesCount = comp.amenities?.length || 0;
  breakdown.amenities = Math.min(amenitiesCount * 10, 100); // 10 points per amenity, max 100

  // Rent fit score (0-100) - placeholder logic
  if (comp.rentAvg) {
    // Assuming $1500 is ideal, score decreases as we move away
    const idealRent = 1500;
    const rentDiff = Math.abs(comp.rentAvg - idealRent);
    breakdown.rentFit = Math.max(100 - (rentDiff / 20), 0); // Lose 5 points per $100 difference
  }

  // Concessions score (0-100)
  const concessionsCount = comp.concessions?.length || 0;
  breakdown.concessions = Math.min(concessionsCount * 25, 100); // 25 points per concession, max 100

  // Distance score (0-100)
  if (comp.distance !== null && comp.distance !== undefined) {
    // Closer is better, max 5 miles
    breakdown.distance = Math.max(100 - (comp.distance * 20), 0); // Lose 20 points per mile
  }

  // Calculate weighted total
  const score = Math.round(
    breakdown.amenities * SCORING_WEIGHTS.amenities +
    breakdown.rentFit * SCORING_WEIGHTS.rentFit +
    breakdown.concessions * SCORING_WEIGHTS.concessions +
    breakdown.distance * SCORING_WEIGHTS.distance
  );

  return { score, breakdown };
}

// Get comps for a site
router.get('/sites/:siteId/comps', async (req, res) => {
  try {
    const { siteId } = req.params;
    
    const compsList = await db
      .select()
      .from(comps)
      .where(eq(comps.siteId, siteId))
      .orderBy(sql`${comps.score} DESC NULLS LAST`);

    res.json(compsList);
  } catch (error) {
    console.error('Error fetching comps:', error);
    res.status(500).json({ message: 'Failed to fetch comps' });
  }
});

// Create a new comp
router.post('/comps', async (req, res) => {
  try {
    const compData = insertCompSchema.parse(req.body);
    
    // Calculate score
    const { score, breakdown } = calculateCompScore(compData);
    
    const [newComp] = await db
      .insert(comps)
      .values({
        ...compData,
        score,
        scoreBreakdown: breakdown
      })
      .returning();

    res.status(201).json(newComp);
  } catch (error) {
    console.error('Error creating comp:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid comp data', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Failed to create comp' });
    }
  }
});

// Rescore a comp
router.post('/comps/:compId/rescore', async (req, res) => {
  try {
    const { compId } = req.params;
    
    // Get the comp
    const [comp] = await db
      .select()
      .from(comps)
      .where(eq(comps.id, compId));
    
    if (!comp) {
      return res.status(404).json({ message: 'Comp not found' });
    }

    // Recalculate score
    const { score, breakdown } = calculateCompScore(comp);
    
    // Update the comp
    const [updatedComp] = await db
      .update(comps)
      .set({
        score,
        scoreBreakdown: breakdown,
        updatedAt: new Date()
      })
      .where(eq(comps.id, compId))
      .returning();

    res.json(updatedComp);
  } catch (error) {
    console.error('Error rescoring comp:', error);
    res.status(500).json({ message: 'Failed to rescore comp' });
  }
});

// Get score explanation
router.get('/comps/:compId/score-explanation', async (req, res) => {
  try {
    const { compId } = req.params;
    
    const [comp] = await db
      .select()
      .from(comps)
      .where(eq(comps.id, compId));
    
    if (!comp) {
      return res.status(404).json({ message: 'Comp not found' });
    }

    const explanation = {
      totalScore: comp.score,
      weights: SCORING_WEIGHTS,
      breakdown: comp.scoreBreakdown,
      details: {
        amenities: `${comp.scoreBreakdown?.amenities || 0}/100 - Based on ${comp.amenities?.length || 0} amenities`,
        rentFit: `${comp.scoreBreakdown?.rentFit || 0}/100 - Rent average: $${comp.rentAvg || 'N/A'}`,
        concessions: `${comp.scoreBreakdown?.concessions || 0}/100 - ${comp.concessions?.length || 0} active concessions`,
        distance: `${comp.scoreBreakdown?.distance || 0}/100 - ${comp.distance || 'N/A'} miles from site`
      }
    };

    res.json(explanation);
  } catch (error) {
    console.error('Error getting score explanation:', error);
    res.status(500).json({ message: 'Failed to get score explanation' });
  }
});

export default router;