import { z } from 'zod';
import { AnnouncementPriority } from '../models/Announcement.model';

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title is required'),
    message: z.string().min(5, 'Message must be at least 5 characters'),
    targetBatchId: z
      .any()
      .optional()
      .nullable()
      .transform((val) => (val && val !== 'Institute-Wide' && val !== '' ? val : null)),
    priority: z.nativeEnum(AnnouncementPriority).default(AnnouncementPriority.GENERAL),
    attachmentUrl: z.string().optional(),
  }),
});
