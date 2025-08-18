import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { randomUUID } from 'crypto';
import rateLimit from 'express-rate-limit';

// Single request ID middleware
export function requestId(req: Request, res: Response, next: NextFunction) {
  req.id = randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
}

// Simplified security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://api.mapbox.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://api.mapbox.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.mapbox.com", "wss:", "https:"],
      workerSrc: ["'self'", "blob:"],
      fontSrc: ["'self'", "https:", "data:"]
    }
  },
  crossOriginEmbedderPolicy: false
});

// Intelligent compression
export const smartCompression = compression({
  threshold: 1024,
  level: 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
});

// Single rate limiter with bypass for webhooks
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for webhook routes
    return req.path.startsWith('/api/webhooks') || 
           req.path.startsWith('/api/mcp') ||
           req.path === '/healthz';
  },
  message: { error: 'Too many requests, please try again later.' }
});

// Single high-resolution request timer
export function requestTimer(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Only log API requests and slow requests
    if (req.path.startsWith('/api') || durationMs > 1000) {
      console.log(JSON.stringify({
        level: 'INFO',
        type: 'request_complete',
        reqId: req.id,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        latency_ms: Math.round(durationMs * 100) / 100
      }));
    }
  });
  
  next();
}

// Declare req.id property
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}