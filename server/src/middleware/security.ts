import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { expressCspHeader, INLINE, NONE, SELF } from 'express-csp-header';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { logger } from '../utils/logger';

// Rate limiting configuration
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

// CORS configuration
export const corsOptions = cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600, // 10 minutes
});

// Helmet configuration for security headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'https:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true,
});

// Content Security Policy
export const cspConfig = expressCspHeader({
  directives: {
    'default-src': [SELF],
    'script-src': [SELF, INLINE],
    'style-src': [SELF, INLINE],
    'img-src': [SELF, 'data:', 'https:'],
    'font-src': [SELF],
    'object-src': [NONE],
    'media-src': [SELF],
    'frame-src': [SELF],
    'connect-src': [SELF, 'wss:', 'https:'],
  },
});

// Request sanitization
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize request body, query, and params
  req.body = mongoSanitize.sanitize(req.body);
  req.query = mongoSanitize.sanitize(req.query);
  req.params = mongoSanitize.sanitize(req.params);
  next();
};

// HTTP Parameter Pollution protection
export const hppProtection = hpp({
  whitelist: [], // Add any parameters that are allowed to be repeated
});

// Request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Check for common security issues
  const suspiciousPatterns = [
    /[<>]/, // Potential HTML/XML injection
    /javascript:/i, // Potential JavaScript injection
    /data:/i, // Potential data URI injection
    /vbscript:/i, // Potential VBScript injection
    /onclick/i, // Potential event handler injection
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  if (
    checkValue(req.body) ||
    checkValue(req.query) ||
    checkValue(req.params)
  ) {
    logger.warn('Suspicious request detected', {
      ip: req.ip,
      path: req.path,
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return res.status(400).json({ message: 'Invalid request data' });
  }

  next();
};

// JWT token validation middleware
export const validateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // Verify token and add user to request
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token validation error', { error });
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Apply all security middleware
export const securityMiddleware = [
  helmetConfig,
  corsOptions,
  cspConfig,
  rateLimiter,
  sanitizeRequest,
  hppProtection,
  validateRequest,
];
