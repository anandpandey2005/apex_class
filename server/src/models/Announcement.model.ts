import mongoose, { Document, Schema } from 'mongoose';

export enum AnnouncementPriority {
  URGENT = 'URGENT',
  EXAM = 'EXAM',
  GENERAL = 'GENERAL',
}

export interface IAnnouncement extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  message: string;
  targetBatchId?: mongoose.Types.ObjectId; // null or undefined means Institute-wide
  targetBatchIds?: mongoose.Types.ObjectId[];
  priority: AnnouncementPriority;
  attachmentUrl?: string;
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    targetBatchId: { type: Schema.Types.ObjectId, ref: 'Batch', default: null },
    targetBatchIds: [{ type: Schema.Types.ObjectId, ref: 'Batch' }],
    priority: {
      type: String,
      enum: Object.values(AnnouncementPriority),
      default: AnnouncementPriority.GENERAL,
      required: true,
    },
    attachmentUrl: { type: String, trim: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
