import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database Connection URIs (Loaded from environment variables, never hardcoded in source)
  MONGO_URI: z.string().optional(),
  LOCAL_MONGO_URI: z.string().default('mongodb://localhost:27017/tuition_management'),
  PROD_MONGO_URI: z.string().optional(),

  JWT_SECRET: z
    .string()
    .min(8, 'JWT_SECRET must be at least 8 characters long')
    .default('apex_tuition_pro_default_jwt_secret_key_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().optional().default(''),
  
  // Institute Metadata
  INSTITUTE_NAME: z.string().default('Apex Coaching Institute'),
  INSTITUTE_EMAIL: z.string().default('contact@apexcoaching.com'),
  INSTITUTE_PHONE: z.string().default('+91 8750309712'),
  INSTITUTE_ADDRESS: z.string().default('Plot 12, Knowledge Park III, Greater Noida, UP, 201310'),
  INSTITUTE_LOGO_URL: z.string().default('/logo.png'),
  STUDENT_PORTAL_URI: z.string().optional().default(''),
  ADMIN_PORTAL_URI: z.string().optional().default(''),
  SERVER_SELF_PING_URL: z.string().optional().default(''),
  PING_INTERVAL_MINUTES: z.string().default('14').transform((val) => parseInt(val, 10)),

  // Razorpay Gateway Settings
  RAZORPAY_KEY_ID: z.string().default('rzp_test_default_key'),
  RAZORPAY_KEY_SECRET: z.string().default('default_razorpay_secret'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));
  throw new Error('Invalid environment variables configuration');
}

const rawEnv = _env.data;

// Auto-switch MongoDB URI:
// 1. Explicit process.env.MONGO_URI if defined
// 2. In Production: PROD_MONGO_URI (or MONGO_URI fallback)
// 3. In Development: LOCAL_MONGO_URI (mongodb://localhost:27017/tuition_management)
const resolvedMongoUri =
  process.env.MONGO_URI ||
  (rawEnv.NODE_ENV === 'production'
    ? rawEnv.PROD_MONGO_URI || 'mongodb://localhost:27017/tuition_management'
    : rawEnv.LOCAL_MONGO_URI);

export const env = {
  ...rawEnv,
  MONGO_URI: resolvedMongoUri,
  IS_PROD: rawEnv.NODE_ENV === 'production',
};
