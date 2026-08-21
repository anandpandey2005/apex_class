export type UserRole = 'DIRECTOR' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface UserFeeSummary {
  totalPaid: number;
  totalDue: number;
  pendingDues: number;
  pendingCount: number;
  dueStatus: 'PENDING' | 'CLEARED' | 'NO_INVOICES';
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions?: string[];
  phone?: string;
  aadharNumber?: string;
  avatar?: string;
  batchIds?: any[];
  feeSummary?: UserFeeSummary;
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

export type AlumniStatus = 'HIGHER_STUDIES' | 'EMPLOYED' | 'PREPARING' | 'ENTREPRENEUR' | 'OTHER';

export interface AlumniFeeRecord {
  feeId?: string;
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

export interface AlumniAttendanceSummary {
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
}

export interface Alumni {
  _id: string;
  studentId?: string;
  name: string;
  email: string;
  phone?: string;
  aadharNumber?: string;
  avatar?: string;
  batchId?: any;
  batchName: string;
  courseName?: string;
  passingYear: number;
  graduationDate: string;
  feeHistory: AlumniFeeRecord[];
  totalPaid: number;
  totalPendingDues: number;
  attendanceSummary: AlumniAttendanceSummary;
  currentStatus: AlumniStatus;
  organizationOrCollege?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AlumniStats {
  totalAlumni: number;
  totalRevenue: number;
  totalPendingDues: number;
  yearBreakdown: { _id: number; count: number }[];
  statusBreakdown: { _id: string; count: number }[];
}

export interface AlumniPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

