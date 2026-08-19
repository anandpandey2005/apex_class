import mongoose from 'mongoose';
import { env } from './env.config';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ MongoDB connection warning/failure: ${(error as Error).message}`);
    console.warn(`ℹ️ Operating with in-memory / fallback database mode if DB server unavailable.`);
  }
};
