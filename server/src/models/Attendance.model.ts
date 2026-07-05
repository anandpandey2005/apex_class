import mongoose, { Document, Schema } from 'mongoose';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
  HOLIDAY = 'HOLIDAY',
}

export interface IAttendance extends Document {
  _id: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  batchId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: AttendanceStatus;
  remarks?: string;
  markedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    date: { type: String, required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(AttendanceStatus),
      default: AttendanceStatus.PRESENT,
      required: true,
    },
    remarks: { type: String, trim: true },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Index to prevent duplicate attendance marks for a student in a batch on the same date
attendanceSchema.index({ date: 1, batchId: 1, studentId: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
