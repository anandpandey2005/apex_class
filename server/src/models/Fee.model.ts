import mongoose, { Document, Schema } from 'mongoose';

export enum FeeStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE',
  PARTIAL = 'PARTIAL',
  UNDER_VERIFICATION = 'UNDER_VERIFICATION',
}

export interface IFee extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  month: string; // e.g. "August 2026"
  amountDue: number;
  amountPaid: number;
  dueDate: string; // YYYY-MM-DD
  paidDate?: string; // YYYY-MM-DD
  transactionTime?: string; // HH:mm:ss or HH:mm
  status: FeeStatus;
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  pendingPaymentAmount?: number;
  receiptNumber?: string;
  paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'RAZORPAY';
  transactionId?: string; // UTR / Payment Ref / Txn ID
  senderName?: string; // Name of Sender / Payer
  bankName?: string; // Bank Name / Payment Gateway / App
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const feeSchema = new Schema<IFee>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    month: { type: String, required: true },
    amountDue: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, default: 0, min: 0 },
    dueDate: { type: String, required: true },
    paidDate: { type: String },
    transactionTime: { type: String },
    status: {
      type: String,
      enum: Object.values(FeeStatus),
      default: FeeStatus.PENDING,
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
    },
    rejectionReason: { type: String, trim: true },
    pendingPaymentAmount: { type: Number, min: 0 },
    receiptNumber: { type: String, unique: true, sparse: true },
    paymentMethod: { type: String, enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'RAZORPAY'] },
    transactionId: { type: String, trim: true },
    senderName: { type: String, trim: true },
    bankName: { type: String, trim: true },
    razorpayOrderId: { type: String, trim: true },
    razorpayPaymentId: { type: String, trim: true },
    razorpaySignature: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Fee = mongoose.model<IFee>('Fee', feeSchema);

