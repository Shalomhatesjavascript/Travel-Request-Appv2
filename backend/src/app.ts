import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import travelRequestRoutes from './routes/travelRequestRoutes';

/**
 * Express Application Setup
 * 
 * Configures the Express server with:
 * - Middleware for parsing, logging, security
 * - CORS for frontend communication
 * - API routes
 * - Error handling
 */

const app: Application = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Helmet - Security Headers
 * 
 * Sets various HTTP headers to protect against common vulnerabilities:
 * - XSS attacks
 * - Clickjacking
 * - MIME type sniffing
 */
app.use(helmet());

/**
 * CORS - Cross-Origin Resource Sharing
 * 
 * Allows frontend (running on different port) to communicate with backend.
 * 
 * Configuration:
 * - origin: Which domains can access the API
 * - credentials: Allow cookies and authentication headers
 */
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Morgan - HTTP Request Logger
 * 
 * Logs all incoming requests to console.
 * Format: :method :url :status :response-time ms
 * 
 * Example: POST /api/auth/login 200 45ms
 */
app.use(morgan('dev'));

/**
 * Body Parsers
 * 
 * Parse incoming request bodies:
 * - express.json(): Parse JSON payloads
 * - express.urlencoded(): Parse form data
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Cookie Parser
 * 
 * Parses cookies from request headers.
 * Useful for session management.
 */
app.use(cookieParser());

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Health Check Endpoint
 * 
 * Simple endpoint to verify server is running.
 * Useful for monitoring and deployment health checks.
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * API Root Endpoint
 * 
 * Returns basic API information.
 */
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Travel Request API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      travelRequests: '/api/travel-requests',
      reports: '/api/reports (coming soon)'
    }
  });
});

/**
 * Mount Route Handlers
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/travel-requests', travelRequestRoutes);

// We'll add more routes here later:
// app.use('/api/reports', reportRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * 404 Handler - Route Not Found
 * 
 * Catches all requests that don't match any routes.
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'NOT_FOUND',
    path: req.originalUrl
  });
});

/**
 * Global Error Handler
 * 
 * Catches all errors thrown in the application.
 * Returns appropriate error response.
 */
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  
  // Default to 500 Internal Server Error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message,
    error: err.name || 'SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;