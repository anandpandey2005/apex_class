import mongoose, { Document, Schema } from 'mongoose';

export interface IAlumniFeeRecord {
  feeId?: mongoose.Types.ObjectId;
  month: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paidDate?: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'UNDER_VERIFICATION';
  receiptNumber?: string;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
}

export interface IAlumniAttendanceSummary {
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
}

export interface IAlumni extends Document {
  _id: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  aadharNumber?: string;
  avatar?: string;
  batchId?: mongoose.Types.ObjectId;
  batchName: string;
  courseName?: string;
  passingYear: number;
  graduationDate: string; // YYYY-MM-DD
  feeHistory: IAlumniFeeRecord[];
  totalPaid: number;
  totalPendingDues: number;
  attendanceSummary: IAlumniAttendanceSummary;
  currentStatus: 'HIGHER_STUDIES' | 'EMPLOYED' | 'PREPARING' | 'ENTREPRENEUR' | 'OTHER';
  organizationOrCollege?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const alumniFeeRecordSchema = new Schema<IAlumniFeeRecord>(
  {
    feeId: { type: Schema.Types.ObjectId, ref: 'Fee' },
    month: { type: String, required: true },
    amountDue: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, required: true, default: 0 },
    dueDate: { type: String, required: true },
    paidDate: { type: String },
    status: {
      type: String,
      enum: ['PAID', 'PENDING', 'OVERDUE', 'PARTIAL', 'UNDER_VERIFICATION'],
      default: 'PAID',
    },
    receiptNumber: { type: String },
    paymentMethod: { type: String },
    transactionId: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

const alumniSchema = new Schema<IAlumni>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, index: true },
    aadharNumber: { type: String, trim: true, sparse: true, index: true },
    avatar: { type: String, default: '/avatars/default.png' },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
    batchName: { type: String, required: true, trim: true, index: true },
    courseName: { type: String, trim: true },
    passingYear: { type: Number, required: true, index: true },
    graduationDate: { type: String, required: true },
    feeHistory: [alumniFeeRecordSchema],
    totalPaid: { type: Number, default: 0 },
    totalPendingDues: { type: Number, default: 0 },
    attendanceSummary: {
      totalClasses: { type: Number, default: 0 },
      attendedClasses: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
    },
    currentStatus: {
      type: String,
      enum: ['HIGHER_STUDIES', 'EMPLOYED', 'PREPARING', 'ENTREPRENEUR', 'OTHER'],
      default: 'HIGHER_STUDIES',
    },
    organizationOrCollege: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Indexes for high performance paginated query and search
alumniSchema.index({ name: 1, email: 1 });
alumniSchema.index({ batchName: 1, passingYear: -1 });
alumniSchema.index({ createdAt: -1 });

export const Alumni = mongoose.model<IAlumni>('Alumni', alumniSchema);
