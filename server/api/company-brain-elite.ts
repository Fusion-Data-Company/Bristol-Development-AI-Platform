import { Router } from "express";
import { storage } from "../storage";
import { realEstateAIService } from "../services/realEstateAIService";
import { memorySyncService } from "../services/memorySyncService";
import { performanceMonitor } from "../services/performanceMonitor";
import multer from "multer";
import { z } from "zod";
import type { AgentPrompt } from "@shared/schema";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, CSV, Excel, and JSON files are allowed.'));
    }
  },
});

// Schema for chat request
const chatRequestSchema = z.object({
  sessionId: z.string().optional(), // Make sessionId optional - will auto-generate if not provided
  message: z.string(),
  enableAdvancedReasoning: z.boolean().optional(),
  dataContext: z.record(z.any()).optional(),
  selectedModel: z.string().optional(), // Premium model selection
  sourceInstance: z.enum(['main', 'floating']).optional(), // Track which instance sent the message
});

// Elite chat endpoint with full Company A.I. capabilities
router.post("/chat", async (req, res) => {
  const agentTracker = performanceMonitor.trackAgentExecution('brand-elite', 'chat_response');
  
  try {
    const { 
      sessionId: providedSessionId, 
      message, 
      enableAdvancedReasoning, 
      dataContext, 
      selectedModel,
      sourceInstance = 'main'
    } = chatRequestSchema.parse(req.body);
    
    // Generate or ensure session exists
    let sessionId = providedSessionId;
    const userId = "demo-user"; // TODO: Get from auth context
    
    if (!sessionId) {
      // Create new shared session between main and floating instances
      const session = await memorySyncService.initializeSharedSession(userId, 
        `Real Estate AI - ${new Date().toLocaleDateString()}`);
      sessionId = session.id;
    }
    
    // Handle cross-instance message synchronization
    await memorySyncService.handleCrossInstanceMessage(
      sessionId,
      userId,
      message,
      'user',
      sourceInstance
    );
    
    // Get unified context that includes both instances' memory
    const unifiedContext = await memorySyncService.getUnifiedContext(userId, sessionId);
    
    // Get active prompts for the user
    const systemPrompts = await storage.getAgentPrompts(userId, "system");
    const projectPrompts = await storage.getAgentPrompts(userId, "project");
    
    // Get session attachments
    const attachments = await storage.getSessionAttachments(sessionId);
    
    // Enhanced data context with unified memory
    const enhancedDataContext = {
      ...dataContext,
      unifiedMemory: unifiedContext.contextSummary,
      sourceInstance,
      syncedInstances: ['main', 'floating']
    };
    
    // Process message with Company A.I.
    const response = await realEstateAIService.processMessage({
      sessionId,
      userId,
      userMessage: message,
      systemPrompts,
      projectPrompts,
      attachments,
      dataContext: enhancedDataContext,
      enableAdvancedReasoning,
      selectedModel,
    });
    
    // Sync AI response to other instance
    await memorySyncService.handleCrossInstanceMessage(
      sessionId,
      userId,
      response.content,
      'assistant',
      sourceInstance,
      { selectedModel, reasoning: enableAdvancedReasoning }
    );
    
    // Return in format expected by frontend
    const result = {
      text: response.content,
      message: response.content,
      content: response.content,
      role: response.role,
      createdAt: response.createdAt,
      metadata: response.metadata,
    };
    
    agentTracker.end(result);
    res.json(result);
  } catch (error) {
    agentTracker.end();
    console.error("Real Estate AI Error:", error);
    res.status(500).json({
      error: "Failed to process message",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Create or update agent prompts
router.post("/prompts", async (req, res) => {
  try {
    const userId = "demo-user"; // TODO: Get from auth
    
    const { name, type, content, priority, active } = req.body;
    
    if (!name || !type || !content) {
      return res.status(400).json({ error: "Name, type, and content are required" });
    }
    
    const prompt = await storage.createAgentPrompt({
      userId,
      name,
      type,
      content,
      active: active ?? true,
      priority: priority ?? 0,
      metadata: {},
    });
    
    res.json(prompt);
  } catch (error) {
    console.error("Error creating prompt:", error);
    res.status(500).json({ error: "Failed to create prompt" });
  }
});

// Get user's prompts
router.get("/prompts", async (req, res) => {
  try {
    const userId = "demo-user"; // TODO: Get from auth
    const { type } = req.query;
    
    const prompts = await storage.getAgentPrompts(
      userId, 
      type as string | undefined
    );
    
    res.json(prompts);
  } catch (error) {
    console.error("Error fetching prompts:", error);
    res.status(500).json({ error: "Failed to fetch prompts" });
  }
});

// Update a prompt
router.put("/prompts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const prompt = await storage.updateAgentPrompt(id, updates);
    res.json(prompt);
  } catch (error) {
    console.error("Error updating prompt:", error);
    res.status(500).json({ error: "Failed to update prompt" });
  }
});

// Delete a prompt
router.delete("/prompts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteAgentPrompt(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting prompt:", error);
    res.status(500).json({ error: "Failed to delete prompt" });
  }
});

// Upload file attachment for a session
router.post("/attachments/:sessionId", upload.single('file'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = "demo-user"; // TODO: Get from auth
    
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    
    // Extract text content from the file
    let content = "";
    if (req.file.mimetype === 'text/plain' || req.file.mimetype === 'text/csv') {
      content = req.file.buffer.toString('utf-8');
    } else if (req.file.mimetype === 'application/json') {
      content = JSON.stringify(JSON.parse(req.file.buffer.toString('utf-8')), null, 2);
    }
    // For PDF and Excel, we'd need additional libraries to extract text
    
    const attachment = await storage.createAgentAttachment({
      sessionId,
      userId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      content,
      url: null, // In production, upload to cloud storage
      metadata: {},
      processedAt: new Date(),
    });
    
    res.json(attachment);
  } catch (error) {
    console.error("Error uploading attachment:", error);
    res.status(500).json({ error: "Failed to upload attachment" });
  }
});

// Get session attachments
router.get("/attachments/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const attachments = await storage.getSessionAttachments(sessionId);
    res.json(attachments);
  } catch (error) {
    console.error("Error fetching attachments:", error);
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
});

// Delete attachment
router.delete("/attachments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteAgentAttachment(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res.status(500).json({ error: "Failed to delete attachment" });
  }
});

// Get session context
router.get("/context/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const context = await storage.getSessionContext(sessionId);
    res.json(context);
  } catch (error) {
    console.error("Error fetching context:", error);
    res.status(500).json({ error: "Failed to fetch context" });
  }
});

// Add context to session
router.post("/context", async (req, res) => {
  try {
    const { sessionId, type, entityId, context, relevance } = req.body;
    const userId = "demo-user"; // TODO: Get from auth
    
    if (!sessionId || !type || !context) {
      return res.status(400).json({ error: "SessionId, type, and context are required" });
    }
    
    const agentContext = await storage.createAgentContext({
      sessionId,
      userId,
      type,
      entityId,
      context,
      relevance: relevance ?? 0.8,
      expiresAt: null,
    });
    
    res.json(agentContext);
  } catch (error) {
    console.error("Error adding context:", error);
    res.status(500).json({ error: "Failed to add context" });
  }
});

// Get user's decision history
router.get("/decisions", async (req, res) => {
  try {
    const userId = "demo-user"; // TODO: Get from auth
    const { limit } = req.query;
    
    const decisions = await storage.getUserDecisions(
      userId, 
      limit ? parseInt(limit as string) : 50
    );
    
    res.json(decisions);
  } catch (error) {
    console.error("Error fetching decisions:", error);
    res.status(500).json({ error: "Failed to fetch decisions" });
  }
});

// Get user's memory
router.get("/memory", async (req, res) => {
  try {
    const userId = "demo-user"; // TODO: Get from auth
    const { type } = req.query;
    
    if (type === "short") {
      const memory = await storage.getMemoryShort(userId);
      res.json(memory);
    } else {
      const memory = await storage.getMemoryLong(userId);
      res.json(memory);
    }
  } catch (error) {
    console.error("Error fetching memory:", error);
    res.status(500).json({ error: "Failed to fetch memory" });
  }
});

// Analyze a deal with Company A.I.
router.post("/analyze-deal", async (req, res) => {
  try {
    const { sessionId, dealData } = req.body;
    const userId = "demo-user"; // TODO: Get from auth
    
    if (!sessionId || !dealData) {
      return res.status(400).json({ error: "SessionId and dealData are required" });
    }
    
    const analysis = await realEstateAIService.analyzeDeal(
      sessionId,
      userId,
      dealData
    );
    
    res.json({ analysis });
  } catch (error) {
    console.error("Error analyzing deal:", error);
    res.status(500).json({ error: "Failed to analyze deal" });
  }
});

// Memory synchronization endpoint for cross-instance communication
router.get("/memory/sync/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = "demo-user"; // TODO: Get from auth context
    
    const unifiedContext = await memorySyncService.getUnifiedContext(userId, sessionId);
    
    res.json({
      ok: true,
      sessionId,
      context: unifiedContext,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Memory sync error:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to sync memory",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Initialize shared session endpoint
router.post("/memory/session", async (req, res) => {
  try {
    const { title } = req.body;
    const userId = "demo-user"; // TODO: Get from auth context
    
    const session = await memorySyncService.initializeSharedSession(
      userId, 
      title || `Company A.I. Elite - ${new Date().toLocaleDateString()}`
    );
    
    res.json({
      ok: true,
      session,
      message: "Shared session initialized"
    });
  } catch (error) {
    console.error("Session creation error:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to create shared session",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;