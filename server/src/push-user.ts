import mongoose from 'mongoose';
import { User, UserRole } from './models/User.model';
import { env } from './config/env.config';

const pushUser = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('📡 Connected to MongoDB to insert initial user...');

    const email = 'anandpandey20005@gmail.com';
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      existingUser.name = 'Anand Pandey (Director)';
      existingUser.phone = '8750309712';
      existingUser.role = UserRole.ADMIN;
      existingUser.password = 'password123';
      await existingUser.save();
      console.log('✅ Updated user account for:', email);
    } else {
      const newUser = await User.create({
        name: 'Anand Pandey (Director)',
        email,
        phone: '8750309712',
        role: UserRole.ADMIN,
        password: 'password123',
      });
      console.log('✅ Successfully created initial Admin user account:', newUser.email);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to push user:', error);
    process.exit(1);
  }
};

pushUser();
