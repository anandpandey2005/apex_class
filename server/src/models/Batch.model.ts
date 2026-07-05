import mongoose, { Document, Schema } from 'mongoose';

export interface IBatchSubject {
  name: string;
  teacherId?: mongoose.Types.ObjectId;
  scheduleType?: 'MWF' | 'TTS' | 'CUSTOM';
  days?: string[]; // e.g. ['Mon', 'Wed', 'Fri']
  schedule?: string; // e.g. "Mon, Wed, Fri (04:00 PM - 05:30 PM)"
}

export interface IBatch extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  subject: string;
  teacherId: mongoose.Types.ObjectId;
  subjects?: IBatchSubject[];
  studentIds: mongoose.Types.ObjectId[];
  schedule: string; // Aggregate schedule
  startDate?: string; // e.g. "2026-08-01"
  endDate?: string;   // e.g. "2027-05-31"
  feeAmount: number;
  capacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const batchSubjectSchema = new Schema<IBatchSubject>(
  {
    name: { type: String, required: true, trim: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User' },
    scheduleType: { type: String, enum: ['MWF', 'TTS', 'CUSTOM'], default: 'MWF' },
    days: [{ type: String }],
    schedule: { type: String, default: 'Mon, Wed, Fri (04:00 PM - 05:30 PM)' },
  },
  { _id: false }
);

const batchSchema = new Schema<IBatch>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    subject: { type: String, required: true, trim: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subjects: [batchSubjectSchema],
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    schedule: { type: String, required: true },
    startDate: { type: String, default: '2026-08-01' },
    endDate: { type: String, default: '2027-05-31' },
    feeAmount: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, default: 30 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Batch = mongoose.model<IBatch>('Batch', batchSchema);
