import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().default('mongodb://localhost:27017/tuition_management'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().optional().default(''),
  
  // Institute Metadata
  INSTITUTE_NAME: z.string().default('Apex Coaching Institute'),
  INSTITUTE_EMAIL: z.string().default('contact@apexcoaching.com'),
  INSTITUTE_PHONE: z.string().default('+91 98765 43210'),
  INSTITUTE_ADDRESS: z.string().default('Plot 12, Knowledge Park III, Greater Noida, UP, 201310'),
  INSTITUTE_LOGO_URL: z.string().default('/logo.png'),
  STUDENT_PORTAL_URI: z.string().optional().default(''),
  ADMIN_PORTAL_URI: z.string().optional().default(''),
  SERVER_SELF_PING_URL: z.string().optional().default(''),
  PING_INTERVAL_MINUTES: z.string().default('14').transform((val) => parseInt(val, 10)),

  // Razorpay Gateway Settings
  RAZORPAY_KEY_ID: z.string().default('rzp_test_ApexCoaching2026'),
  RAZORPAY_KEY_SECRET: z.string().default('apex_coaching_razorpay_secret_2026'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));
  throw new Error('Invalid environment variables configuration');
}

export const env = _env.data;
