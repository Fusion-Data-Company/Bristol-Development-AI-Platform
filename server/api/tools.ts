import { Router } from 'express';
import { z } from 'zod';
import { tools, insertToolSchema } from '../../shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { isAuthenticated } from '../replitAuth';

const router = Router();

// Get all tools
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const toolsList = await db
      .select()
      .from(tools)
      .orderBy(tools.name);

    res.json(toolsList);
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ message: 'Failed to fetch tools' });
  }
});

// Get enabled tools only
router.get('/enabled', async (req, res) => {
  try {
    const enabledTools = await db
      .select()
      .from(tools)
      .where(eq(tools.enabled, true))
      .orderBy(tools.name);

    res.json(enabledTools);
  } catch (error) {
    console.error('Error fetching enabled tools:', error);
    res.status(500).json({ message: 'Failed to fetch enabled tools' });
  }
});

// Register a new tool
router.post('/register', isAuthenticated, async (req, res) => {
  try {
    const toolData = insertToolSchema.parse(req.body);
    
    const [newTool] = await db
      .insert(tools)
      .values(toolData)
      .returning();

    res.status(201).json(newTool);
  } catch (error) {
    console.error('Error registering tool:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid tool data', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Failed to register tool' });
    }
  }
});

// Update a tool
router.patch('/:toolId', isAuthenticated, async (req, res) => {
  try {
    const { toolId } = req.params;
    const updates = req.body;
    
    const [updatedTool] = await db
      .update(tools)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(tools.id, toolId))
      .returning();

    if (!updatedTool) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    res.json(updatedTool);
  } catch (error) {
    console.error('Error updating tool:', error);
    res.status(500).json({ message: 'Failed to update tool' });
  }
});

// Toggle tool enabled status
router.post('/:toolId/toggle', isAuthenticated, async (req, res) => {
  try {
    const { toolId } = req.params;
    
    // Get current status
    const [tool] = await db
      .select()
      .from(tools)
      .where(eq(tools.id, toolId));
    
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    // Toggle status
    const [updatedTool] = await db
      .update(tools)
      .set({
        enabled: !tool.enabled,
        updatedAt: new Date()
      })
      .where(eq(tools.id, toolId))
      .returning();

    res.json(updatedTool);
  } catch (error) {
    console.error('Error toggling tool:', error);
    res.status(500).json({ message: 'Failed to toggle tool' });
  }
});

// Delete a tool
router.delete('/:toolId', isAuthenticated, async (req, res) => {
  try {
    const { toolId } = req.params;
    
    const [deletedTool] = await db
      .delete(tools)
      .where(eq(tools.id, toolId))
      .returning();

    if (!deletedTool) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    res.json({ message: 'Tool deleted', tool: deletedTool });
  } catch (error) {
    console.error('Error deleting tool:', error);
    res.status(500).json({ message: 'Failed to delete tool' });
  }
});

// Common tools registry
router.get('/registry', (req, res) => {
  const commonTools = [
    {
      name: 'OpenAI GPT',
      baseUrl: 'https://api.openai.com/v1',
      description: 'OpenAI language models',
      requiresKey: true,
      keyName: 'OPENAI_API_KEY'
    },
    {
      name: 'Apify',
      baseUrl: 'https://api.apify.com/v2',
      description: 'Web scraping and automation',
      requiresKey: true,
      keyName: 'APIFY_API_TOKEN'
    },
    {
      name: 'ArcGIS',
      baseUrl: 'https://services.arcgis.com',
      description: 'Geospatial data services',
      requiresKey: false
    },
    {
      name: 'Census Bureau',
      baseUrl: 'https://api.census.gov',
      description: 'US Census demographic data',
      requiresKey: true,
      keyName: 'CENSUS_API_KEY'
    },
    {
      name: 'HUD User',
      baseUrl: 'https://www.huduser.gov/hudapi',
      description: 'HUD housing data',
      requiresKey: true,
      keyName: 'HUD_API_KEY'
    }
  ];

  res.json(commonTools);
});

export default router;