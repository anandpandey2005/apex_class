import { Response, NextFunction } from 'express';
import { Attendance, AttendanceStatus } from '../models/Attendance.model';
import { User } from '../models/User.model';
import { Batch } from '../models/Batch.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { NotificationService } from '../services/notification.service';

export const markBatchAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { date, batchId, records } = req.body;
    const markedBy = req.user?.id;

    if (!markedBy) {
      return next(new AppError('Unauthorized: Marking user missing', 401));
    }

    const attendanceOperations = records.map((rec: { studentId: string; status: AttendanceStatus; remarks?: string }) => ({
      updateOne: {
        filter: { date, batchId, studentId: rec.studentId },
        update: {
          $set: {
            status: rec.status,
            remarks: rec.remarks || '',
            markedBy,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(attendanceOperations);

    // Asynchronously check attendance thresholds for students marked ABSENT
    for (const rec of records) {
      if (rec.status === AttendanceStatus.ABSENT) {
        const student = await User.findById(rec.studentId);
        if (student) {
          const totalClasses = await Attendance.countDocuments({ studentId: rec.studentId });
          const attendedClasses = await Attendance.countDocuments({
            studentId: rec.studentId,
            status: { $in: [AttendanceStatus.PRESENT, AttendanceStatus.LATE] },
          });

          const percentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 100;
          if (percentage < 75) {
            NotificationService.notifyLowAttendance(
              student.name,
              student.email,
              student.phone,
              percentage
            );
          }
        }
      }
    }

    return sendSuccess(res, 200, 'Batch attendance marked successfully', {
      date,
      batchId,
      processedRecords: records.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceRegister = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { batchId, date, month, studentId } = req.query;

    const filter: any = {};
    if (batchId) filter.batchId = batchId;
    if (studentId) filter.studentId = studentId;
    if (date) filter.date = date;
    if (month) filter.date = new RegExp(`^${month}`); // e.g. "2026-08"

    const records = await Attendance.find(filter)
      .populate('studentId', 'name email phone avatar')
      .populate('batchId', 'name subject code')
      .populate('markedBy', 'name role')
      .sort({ date: -1 });

    return sendSuccess(res, 200, 'Attendance register fetched successfully', records);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { batchId } = req.query;
    const filter: any = batchId ? { batchId } : {};

    const studentStatsMap = new Map<string, { student: any; total: number; present: number; absent: number; late: number; excused: number }>();

    // If batchId is specified, pre-fill map with all enrolled students in the batch
    if (batchId) {
      const batch = await Batch.findById(batchId).populate('studentIds', 'name email phone avatar');
      if (batch && batch.studentIds) {
        batch.studentIds.forEach((st: any) => {
          if (st && st._id) {
            studentStatsMap.set(st._id.toString(), {
              student: st,
              total: 0,
              present: 0,
              absent: 0,
              late: 0,
              excused: 0,
            });
          }
        });
      }
    }

    const allRecords = await Attendance.find(filter).populate('studentId', 'name email phone avatar');

    allRecords.forEach((record: any) => {
      if (!record.studentId) return;
      const sId = record.studentId._id.toString();

      if (!studentStatsMap.has(sId)) {
        studentStatsMap.set(sId, {
          student: record.studentId,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        });
      }

      const stat = studentStatsMap.get(sId)!;
      stat.total += 1;
      if (record.status === AttendanceStatus.PRESENT) stat.present += 1;
      else if (record.status === AttendanceStatus.ABSENT) stat.absent += 1;
      else if (record.status === AttendanceStatus.LATE) stat.late += 1;
      else if (record.status === AttendanceStatus.EXCUSED) stat.excused += 1;
    });

    const summaryList = Array.from(studentStatsMap.values()).map((item) => {
      const percentage = item.total > 0 ? ((item.present + item.late) / item.total) * 100 : 100;
      return {
        student: item.student,
        totalClasses: item.total,
        present: item.present,
        absent: item.absent,
        late: item.late,
        excused: item.excused,
        attendancePercentage: Number(percentage.toFixed(1)),
        isLowAttendance: percentage < 75 && item.total > 0,
      };
    });

    const flaggedStudents = summaryList.filter((s) => s.isLowAttendance);

    return sendSuccess(res, 200, 'Attendance statistics compiled', {
      totalStudentsTracked: summaryList.length,
      flaggedLowAttendanceCount: flaggedStudents.length,
      students: summaryList,
      flaggedStudents,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const records = await Attendance.find({ studentId: req.user.id })
      .populate('batchId', 'name subject code startDate endDate')
      .populate('markedBy', 'name role')
      .sort({ date: -1 });

    const user = await User.findById(req.user.id).populate('batchIds', 'name code startDate endDate');
    let startDate: string | undefined = undefined;
    let endDate: string | undefined = undefined;

    if (user && user.batchIds && user.batchIds.length > 0) {
      const startDates = (user.batchIds as any[]).map((b) => b.startDate).filter(Boolean);
      const endDates = (user.batchIds as any[]).map((b) => b.endDate).filter(Boolean);
      if (startDates.length > 0) startDate = [...startDates].sort()[0];
      if (endDates.length > 0) endDate = [...endDates].sort().reverse()[0];
    }

    // Fallback to defaults if no batch dates found
    if (!startDate) startDate = '2026-08-01';
    if (!endDate) endDate = '2027-05-31';

    const total = records.length;
    const present = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const late = records.filter((r) => r.status === AttendanceStatus.LATE).length;
    const absent = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const excused = records.filter((r) => r.status === AttendanceStatus.EXCUSED).length;

    const percentage = total > 0 ? ((present + late) / total) * 100 : 100;

    return sendSuccess(res, 200, 'Personal attendance history fetched', {
      totalClasses: total,
      present,
      absent,
      late,
      excused,
      attendancePercentage: Number(percentage.toFixed(1)),
      isLowAttendance: percentage < 75,
      startDate,
      endDate,
      records,
    });
  } catch (error) {
    next(error);
  }
};
