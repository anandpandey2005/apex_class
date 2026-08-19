import { z } from 'zod';

export const createBatchSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Batch name is required'),
    code: z.string().min(2, 'Batch code is required'),
    subject: z.string().min(2, 'Subject is required'),
    teacherId: z.string().min(1, 'Teacher ID is required'),
    schedule: z.string().min(2, 'Schedule is required'),
    feeAmount: z.number().min(0, 'Fee amount must be non-negative'),
    capacity: z.number().min(1).default(30),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    subjects: z.array(z.any()).optional(),
    studentIds: z.array(z.string()).optional(),
  }),
});

export const updateBatchSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().optional(),
    code: z.string().optional(),
    subject: z.string().optional(),
    teacherId: z.string().optional(),
    schedule: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    feeAmount: z.number().min(0).optional(),
    capacity: z.number().min(1).optional(),
    subjects: z.array(z.any()).optional(),
    studentIds: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

