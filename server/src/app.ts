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

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: true,
    credentials: true,
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
