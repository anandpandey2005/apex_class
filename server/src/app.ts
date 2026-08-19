import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import path from 'path';
import routes from './routes';
import { globalErrorHandler } from './middlewares/error.middleware';
import { env } from './config/env.config';

const app: Application = express();

// Trust reverse proxy (e.g. Render, Vercel, Cloudflare, Nginx) for secure HTTPS cookies
app.set('trust proxy', 1);

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
// Dynamic CORS configuration reading allowed portal URIs from ENV
const allowedOrigins = [
  env.STUDENT_PORTAL_URI,
  env.ADMIN_PORTAL_URI,
  env.CLIENT_URL,
].map((u) => u?.replace(/\/$/, '')).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, '');

      // Allow if origin matches env URIs, vercel deployments, or dev environment
      if (
        allowedOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.endsWith('.vercel.app') ||
        env.NODE_ENV === 'development'
      ) {
        return callback(null, true);
      }

      // Default permissive return for custom domain deployments with credentials
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cookie'],
  })
);

// Serve Static Landing Page at root
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

// Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data Sanitization against NoSQL query injection (Express 5 Compatible)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// Root Landing Page
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Mount API Routes
app.use('/api/v1', routes);

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot find endpoint ${req.originalUrl} on this server`,
  });
});

// Global Exception Handler
app.use(globalErrorHandler);

export default app;
