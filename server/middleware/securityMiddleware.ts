import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// IPv6-safe key generator helper
const ipKeyGenerator = (req: Request): string => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  // Handle IPv6 addresses properly
  if (ip.includes(':')) {
    // For IPv6, use a simplified approach to avoid bypass
    return ip.split(':').slice(0, 4).join(':');
  }
  return ip;
};

// Rate limiting configuration for different endpoints
export const rateLimiters = {
  // General API rate limiting - RELAXED to prevent Access Denied
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // Increased limit to prevent blocking
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
      res.status(429).json({ error: 'Rate limit exceeded', retryAfter: '15 minutes' });
    }
  }),

  // Relaxed rate limiting for chat/AI endpoints
  aiEndpoints: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 500, // Increased to prevent blocking
    message: { error: 'AI rate limit exceeded' },
    keyGenerator: (req) => `ai:${ipKeyGenerator(req)}:${(req as any).user?.id || 'anonymous'}`,
    handler: (req, res) => {
      console.warn(`AI rate limit exceeded for user: ${(req as any).user?.id || 'anonymous'} IP: ${req.ip}`);
      res.status(429).json({ error: 'AI rate limit exceeded', retryAfter: '60 seconds' });
    }
  }),

  // Relaxed rate limiting for upload/heavy operations
  heavyOperations: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 200, // Increased to prevent blocking
    message: { error: 'Heavy operation rate limit exceeded' },
    handler: (req, res) => {
      console.warn(`Heavy operation rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ error: 'Heavy operation rate limit exceeded', retryAfter: '5 minutes' });
    }
  }),

  // Authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login attempts per 15 minutes
    message: { error: 'Too many authentication attempts' },
    handler: (req, res) => {
      console.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ error: 'Too many authentication attempts', retryAfter: '15 minutes' });
    }
  })
};

// Input validation schemas
export const validationSchemas = {
  chatMessage: z.object({
    message: z.string().min(1).max(10000),
    sessionId: z.string().optional(),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(4000).optional()
  }),

  siteData: z.object({
    name: z.string().min(1).max(200),
    address: z.string().min(1).max(500),
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(2).max(50).optional(),
    zipCode: z.string().max(20).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional()
  }),

  agentTask: z.object({
    agentId: z.string().uuid(),
    taskType: z.string().min(1).max(100),
    parameters: z.record(z.any()).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional()
  })
};

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://openrouter.ai"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://openrouter.ai", "wss:", "ws:"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseSrc: ["'none'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for development
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Request sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize query parameters
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string)
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/[<>]/g, '')
          .trim();
      }
    }

    // Sanitize body parameters
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }

    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    res.status(400).json({ error: 'Invalid input format' });
  }
};

function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/[<>]/g, '')
        .trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

// Request size limiting middleware
export const limitRequestSize = (maxSizeMB: number = 10) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxBytes = maxSizeMB * 1024 * 1024;

    if (contentLength > maxBytes) {
      console.warn(`Request size limit exceeded: ${contentLength} bytes from IP: ${req.ip}`);
      return res.status(413).json({ error: 'Request entity too large' });
    }

    next();
  };
};

// IP blocking middleware for known bad actors
const blockedIPs = new Set<string>();
const suspiciousIPs = new Map<string, { count: number; lastSeen: Date }>();

export const ipProtection = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

  // Check if IP is blocked
  if (blockedIPs.has(clientIP)) {
    console.warn(`Blocked IP attempted access: ${clientIP}`);
    return res.status(403).json({ error: 'Access denied' });
  }

  // Track suspicious activity
  const now = new Date();
  const suspicious = suspiciousIPs.get(clientIP);
  
  if (suspicious) {
    // Reset counter if more than 1 hour has passed
    if (now.getTime() - suspicious.lastSeen.getTime() > 3600000) {
      suspiciousIPs.set(clientIP, { count: 1, lastSeen: now });
    } else {
      suspicious.count++;
      suspicious.lastSeen = now;
      
      // Block IP if too many suspicious requests
      if (suspicious.count > 100) {
        blockedIPs.add(clientIP);
        console.warn(`IP blocked for suspicious activity: ${clientIP}`);
        return res.status(403).json({ error: 'Access denied due to suspicious activity' });
      }
    }
  } else {
    suspiciousIPs.set(clientIP, { count: 1, lastSeen: now });
  }

  next();
};

// Enhanced request logging middleware
export const enhancedLogging = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  const requestId = Math.random().toString(36).substr(2, 9);

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  // Enhanced logging for security events
  if (req.path.includes('admin') || req.path.includes('config') || req.path.includes('debug')) {
    console.warn(`🚨 Sensitive endpoint accessed: ${req.method} ${req.path} from IP: ${clientIP}`);
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: clientIP,
      userAgent,
      contentLength: res.get('content-length'),
      timestamp: new Date().toISOString()
    };

    // Log slow requests
    if (duration > 5000) {
      console.warn(`🐌 Slow request detected:`, logData);
    }

    // Log error responses
    if (res.statusCode >= 400) {
      console.warn(`❌ Error response:`, logData);
    }
  });

  next();
};

// Content type validation middleware
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.get('content-type');
      
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        return res.status(415).json({ error: 'Unsupported content type' });
      }
    }
    next();
  };
};

// Request validation middleware factory
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        const errors = validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors 
        });
      }
      
      req.body = validation.data;
      next();
    } catch (error) {
      console.error('Request validation error:', error);
      res.status(400).json({ error: 'Invalid request format' });
    }
  };
};

// CORS configuration with security
export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow Replit domains
    if (origin.includes('.replit.') || origin.includes('.repl.it')) {
      return callback(null, true);
    }
    
    // Block unknown origins in production
    console.warn(`🚨 Blocked CORS request from unknown origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Emergency shutdown middleware for critical errors
export const emergencyShutdown = (req: Request, res: Response, next: NextFunction) => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  
  // Emergency mode if memory usage is extremely high
  if (heapUsedMB > 1024) { // 1GB threshold
    console.error(`🆘 EMERGENCY: Memory usage critical: ${heapUsedMB.toFixed(2)}MB`);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // If still critical, reject new requests
    if (process.memoryUsage().heapUsed / 1024 / 1024 > 1024) {
      return res.status(503).json({ 
        error: 'Service temporarily unavailable due to high resource usage',
        retryAfter: '60 seconds'
      });
    }
  }
  
  next();
};