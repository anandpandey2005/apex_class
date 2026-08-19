import { z } from 'zod';
import { FeeStatus } from '../models/Fee.model';

export const createFeeSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    batchId: z.string().min(1, 'Batch ID is required'),
    month: z.string().min(1, 'Month is required'),
    amountDue: z.number().min(0, 'Amount due must be non-negative'),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
    notes: z.string().optional(),
  }),
});

export const recordPaymentSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    amountPaid: z.number().positive('Payment amount must be greater than 0'),
    paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'RAZORPAY']),
    paidDate: z.string().optional(),
    transactionTime: z.string().optional(),
    transactionId: z.string().min(1, 'Transaction ID / UTR is required for proof of record'),
    senderName: z.string().min(1, 'Sender Name is required for proof of record'),
    bankName: z.string().min(1, 'Bank / Channel Name is required for proof of record'),
    notes: z.string().optional(),
  }),
});

export const verifyRazorpayPaymentSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    razorpayOrderId: z.string().min(1, 'Razorpay Order ID is required'),
    razorpayPaymentId: z.string().min(1, 'Razorpay Payment ID is required'),
    razorpaySignature: z.string().optional(),
    senderName: z.string().optional(),
    bankName: z.string().optional(),
  }),
});

