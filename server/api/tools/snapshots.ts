import express from 'express';
import { storage } from '../../storage';
import { insertSnapshotSchema } from '../../../shared/schema';

const router = express.Router();

// Save snapshot endpoint
router.post('/', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const snapshotData = insertSnapshotSchema.parse({
      ...req.body,
      userId
    });
    
    const snapshot = await storage.createSnapshot(snapshotData);
    res.status(201).json(snapshot);

  } catch (error: any) {
    console.error("Error creating snapshot:", error);
    res.status(500).json({ 
      error: "Failed to create snapshot",
      details: error.message 
    });
  }
});

// Get user's snapshots
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { tool } = req.query;
    const snapshots = await storage.getUserSnapshots(userId, tool);
    res.json(snapshots);

  } catch (error: any) {
    console.error("Error fetching snapshots:", error);
    res.status(500).json({ 
      error: "Failed to fetch snapshots",
      details: error.message 
    });
  }
});

// Delete snapshot
router.delete('/:id', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    await storage.deleteSnapshot(id, userId);
    res.json({ success: true });

  } catch (error: any) {
    console.error("Error deleting snapshot:", error);
    res.status(500).json({ 
      error: "Failed to delete snapshot",
      details: error.message 
    });
  }
});

export default router;