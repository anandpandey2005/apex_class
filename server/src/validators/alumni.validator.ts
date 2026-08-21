import { z } from 'zod';

export const createAlumniSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    aadharNumber: z.string().optional(),
    batchId: z.string().optional(),
    batchName: z.string().min(1, 'Batch name is required'),
    courseName: z.string().optional(),
    passingYear: z.number().int().min(1990).max(2100),
    graduationDate: z.string().min(4, 'Graduation date is required'),
    currentStatus: z
      .enum(['HIGHER_STUDIES', 'EMPLOYED', 'PREPARING', 'ENTREPRENEUR', 'OTHER'])
      .default('HIGHER_STUDIES'),
    organizationOrCollege: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateAlumniSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    aadharNumber: z.string().optional(),
    batchName: z.string().optional(),
    courseName: z.string().optional(),
    passingYear: z.number().int().optional(),
    graduationDate: z.string().optional(),
    currentStatus: z
      .enum(['HIGHER_STUDIES', 'EMPLOYED', 'PREPARING', 'ENTREPRENEUR', 'OTHER'])
      .optional(),
    organizationOrCollege: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const graduateStudentSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    passingYear: z.number().int().min(1990).max(2100),
    graduationDate: z.string().min(4, 'Graduation date is required'),
    currentStatus: z
      .enum(['HIGHER_STUDIES', 'EMPLOYED', 'PREPARING', 'ENTREPRENEUR', 'OTHER'])
      .default('HIGHER_STUDIES'),
    organizationOrCollege: z.string().optional(),
    notes: z.string().optional(),
  }),
});
