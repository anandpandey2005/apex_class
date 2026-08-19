import { z } from 'zod';
import { AttendanceStatus } from '../models/Attendance.model';

export const markAttendanceSchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    batchId: z.string().min(1, 'Batch ID is required'),
    records: z.array(
      z.object({
        studentId: z.string().min(1, 'Student ID is required'),
        status: z.nativeEnum(AttendanceStatus),
        remarks: z.string().optional(),
      })
    ).min(1, 'At least one student record must be provided'),
  }),
});

export const getAttendanceQuerySchema = z.object({
  query: z.object({
    batchId: z.string().optional(),
    studentId: z.string().optional(),
    date: z.string().optional(),
    month: z.string().optional(),
  }),
});
