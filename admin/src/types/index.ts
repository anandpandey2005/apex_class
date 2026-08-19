export type UserRole = 'DIRECTOR' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions?: string[];
  phone?: string;
  avatar?: string;
  batchIds?: any[];
  createdAt?: string;
}

export interface BatchSubject {
  name: string;
  teacherId?: User;
  scheduleType?: 'MWF' | 'TTS' | 'CUSTOM';
  days?: string[];
  schedule?: string;
}

export interface Batch {
  _id: string;
  name: string;
  code: string;
  subject: string;
  teacherId: User;
  subjects?: BatchSubject[];
  studentIds: User[];
  scheduleType?: 'MWF' | 'TTS' | 'CUSTOM';
  days?: string[];
  schedule: string;
  startDate?: string;
  endDate?: string;
  feeAmount: number;
  capacity: number;
  isActive: boolean;
  createdAt: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HOLIDAY';

export interface AttendanceRecord {
  _id: string;
  date: string;
  batchId: Batch;
  studentId: User;
  status: AttendanceStatus;
  remarks?: string;
  markedBy: User;
}

export interface AttendanceStudentStat {
  student: User;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendancePercentage: number;
  isLowAttendance: boolean;
}

export type FeeStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'UNDER_VERIFICATION';

export interface FeeRecord {
  _id: string;
  studentId: User;
  batchId: Batch;
  month: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paidDate?: string;
  transactionTime?: string;
  status: FeeStatus;
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  pendingPaymentAmount?: number;
  receiptNumber?: string;
  paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'RAZORPAY';
  transactionId?: string;
  senderName?: string;
  bankName?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  notes?: string;
}

export type AnnouncementPriority = 'URGENT' | 'EXAM' | 'GENERAL';

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  targetBatchId?: Batch;
  targetBatchIds?: Batch[];
  priority: AnnouncementPriority;
  attachmentUrl?: string;
  authorId: User;
  createdAt: string;
}
