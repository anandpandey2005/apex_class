import mongoose from 'mongoose';
import { env } from './env.config';

export const connectDB = async (): Promise<void> => {
  try {
    const isProd = env.NODE_ENV === 'production';
    const dbTargetName = isProd ? 'Live Production Atlas Cluster' : 'Local Development MongoDB';

    console.log(`\n=================== 🗄️ DATABASE CONNECTION ===================`);
    console.log(`Environment: [${env.NODE_ENV.toUpperCase()}]`);
    console.log(`Target: ${dbTargetName}`);
    console.log(`URI Target: ${env.MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    console.log(`===============================================================\n`);
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Failed [${env.NODE_ENV}]: ${(error as Error).message}`);
    if (env.NODE_ENV === 'development') {
      console.warn(`💡 Tip: Ensure local MongoDB service is running at mongodb://localhost:27017/tuition_management or set LOCAL_MONGO_URI in server/.env`);
    }
  }
};
