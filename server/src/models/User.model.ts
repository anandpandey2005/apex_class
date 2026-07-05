import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  DIRECTOR = 'DIRECTOR',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export enum UserPermission {
  MANAGE_PERMISSIONS = 'MANAGE_PERMISSIONS',
  MARK_ATTENDANCE = 'MARK_ATTENDANCE',
  MANAGE_FEES = 'MANAGE_FEES',
  MANAGE_BATCHES = 'MANAGE_BATCHES',
  MANAGE_USERS = 'MANAGE_USERS',
  BROADCAST_ANNOUNCEMENTS = 'BROADCAST_ANNOUNCEMENTS',
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  permissions?: string[];
  phone?: string;
  avatar?: string;
  batchIds?: mongoose.Types.ObjectId[];
  parentStudentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
      required: true,
    },
    permissions: [{ type: String }],
    phone: { type: String, trim: true },
    avatar: { type: String, default: '/avatars/default.png' },
    batchIds: [{ type: Schema.Types.ObjectId, ref: 'Batch' }],
    parentStudentId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password || '');
};

export const User = mongoose.model<IUser>('User', userSchema);
