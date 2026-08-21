import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Alumni } from '../models/Alumni.model';
import { User } from '../models/User.model';
import { Batch } from '../models/Batch.model';
import { Fee } from '../models/Fee.model';
import { Attendance, AttendanceStatus } from '../models/Attendance.model';
import { generateFeeReceiptPDF } from '../services/pdf.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export const getAlumniList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const search = (req.query.search as string)?.trim() || '';
    const passingYear = req.query.passingYear ? parseInt(req.query.passingYear as string) : undefined;
    const batchId = req.query.batchId as string;
    const currentStatus = req.query.currentStatus as string;
    const sortBy = (req.query.sortBy as string) || 'passingYear';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter: any = {};

    if (search) {
      const searchRegex = new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { aadharNumber: searchRegex },
        { batchName: searchRegex },
        { courseName: searchRegex },
        { organizationOrCollege: searchRegex },
      ];
    }

    if (passingYear && !isNaN(passingYear)) {
      filter.passingYear = passingYear;
    }

    if (batchId && mongoose.Types.ObjectId.isValid(batchId)) {
      filter.batchId = batchId;
    }

    if (currentStatus) {
      filter.currentStatus = currentStatus;
    }

    if (req.query.hasPendingDues === 'true') {
      filter.totalPendingDues = { $gt: 0 };
    } else if (req.query.hasPendingDues === 'false') {
      filter.totalPendingDues = 0;
    }

    const skip = (page - 1) * limit;

    const [alumniList, totalRecords] = await Promise.all([
      Alumni.find(filter)
        .sort({ [sortBy]: sortOrder, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Alumni.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return sendSuccess(res, 200, 'Alumni records retrieved successfully', alumniList, {
      pagination: {
        page,
        limit,
        total: totalRecords,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAlumniById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid Alumni ID format', 400));
    }

    const alumni = await Alumni.findById(id).populate('batchId', 'name code subject schedule feeAmount');
    if (!alumni) {
      return next(new AppError('Alumni record not found', 404));
    }

    return sendSuccess(res, 200, 'Alumni profile retrieved successfully', alumni);
  } catch (error) {
    next(error);
  }
};

export const graduateStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, passingYear, graduationDate, currentStatus, organizationOrCollege, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return next(new AppError('Invalid Student ID format', 400));
    }

    const student = await User.findById(studentId).populate('batchIds');
    if (!student) {
      return next(new AppError('Student user account not found', 404));
    }

    // Check if student is already in Alumni
    const existingAlumni = await Alumni.findOne({ studentId });
    if (existingAlumni) {
      return next(new AppError('This student has already been archived to Alumni directory', 400));
    }

    // Find primary or associated batch
    let batchId: mongoose.Types.ObjectId | undefined;
    let batchName = 'Graduated Batch';
    let courseName = 'General Studies';

    if (student.batchIds && student.batchIds.length > 0) {
      const primaryBatch: any = student.batchIds[0];
      batchId = primaryBatch._id || primaryBatch;
      if (primaryBatch.name) {
        batchName = primaryBatch.name;
        courseName = primaryBatch.subject || primaryBatch.name;
      } else {
        const batchDoc = await Batch.findById(batchId);
        if (batchDoc) {
          batchName = batchDoc.name;
          courseName = batchDoc.subject;
        }
      }
    }

    // Aggregate all historical Fee records & Receipts for this student
    const studentFees = await Fee.find({ studentId }).sort({ dueDate: 1 });

    let totalPaid = 0;
    let totalPendingDues = 0;

    const feeHistory = studentFees.map((fee) => {
      totalPaid += fee.amountPaid || 0;
      const pending = Math.max(0, (fee.amountDue || 0) - (fee.amountPaid || 0));
      totalPendingDues += pending;

      return {
        feeId: fee._id,
        month: fee.month,
        amountDue: fee.amountDue,
        amountPaid: fee.amountPaid,
        dueDate: fee.dueDate,
        paidDate: fee.paidDate,
        status: fee.status,
        receiptNumber: fee.receiptNumber,
        paymentMethod: fee.paymentMethod,
        transactionId: fee.transactionId,
        notes: fee.notes,
      };
    });

    // Aggregate Attendance Statistics
    const [totalClasses, attendedClasses] = await Promise.all([
      Attendance.countDocuments({ studentId }),
      Attendance.countDocuments({ studentId, status: AttendanceStatus.PRESENT }),
    ]);

    const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 100;

    // Create Alumni document
    const alumni = await Alumni.create({
      studentId: student._id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      aadharNumber: student.aadharNumber,
      avatar: student.avatar,
      batchId,
      batchName,
      courseName,
      passingYear: Number(passingYear) || new Date().getFullYear(),
      graduationDate: graduationDate || new Date().toISOString().split('T')[0],
      feeHistory,
      totalPaid,
      totalPendingDues,
      attendanceSummary: {
        totalClasses,
        attendedClasses,
        percentage,
      },
      currentStatus: currentStatus || 'HIGHER_STUDIES',
      organizationOrCollege,
      notes,
    });

    // Remove student from active batch studentIds roster so active batch counts are accurate
    if (student.batchIds && student.batchIds.length > 0) {
      await Batch.updateMany(
        { _id: { $in: student.batchIds } },
        { $pull: { studentIds: student._id } }
      );
    }

    return sendSuccess(res, 201, `Student ${student.name} successfully graduated and archived to Alumni Hub!`, alumni);
  } catch (error) {
    next(error);
  }
};

export const createAlumni = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      email,
      phone,
      aadharNumber,
      batchId,
      batchName,
      courseName,
      passingYear,
      graduationDate,
      currentStatus,
      organizationOrCollege,
      notes,
      feeHistory,
      totalPaid,
      totalPendingDues,
      attendanceSummary,
    } = req.body;

    const existing = await Alumni.findOne({ email });
    if (existing) {
      return next(new AppError('Alumni record with this email already exists', 400));
    }

    const alumni = await Alumni.create({
      name,
      email,
      phone,
      aadharNumber,
      batchId,
      batchName,
      courseName,
      passingYear: Number(passingYear),
      graduationDate: graduationDate || new Date().toISOString().split('T')[0],
      feeHistory: feeHistory || [],
      totalPaid: totalPaid || 0,
      totalPendingDues: totalPendingDues || 0,
      attendanceSummary: attendanceSummary || { totalClasses: 0, attendedClasses: 0, percentage: 100 },
      currentStatus: currentStatus || 'HIGHER_STUDIES',
      organizationOrCollege,
      notes,
    });

    return sendSuccess(res, 201, 'Alumni profile created successfully', alumni);
  } catch (error) {
    next(error);
  }
};

export const updateAlumni = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid Alumni ID format', 400));
    }

    const updates = { ...req.body };

    const alumni = await Alumni.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!alumni) {
      return next(new AppError('Alumni record not found', 404));
    }

    return sendSuccess(res, 200, 'Alumni record updated successfully', alumni);
  } catch (error) {
    next(error);
  }
};

export const deleteAlumni = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid Alumni ID format', 400));
    }

    const alumni = await Alumni.findByIdAndDelete(id);
    if (!alumni) {
      return next(new AppError('Alumni record not found', 404));
    }

    return sendSuccess(res, 200, 'Alumni record deleted successfully', {});
  } catch (error) {
    next(error);
  }
};

export const getAlumniStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalAlumni, aggregateFinancials, yearAggregates, statusAggregates] = await Promise.all([
      Alumni.countDocuments(),
      Alumni.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPaid' },
            totalPendingDues: { $sum: '$totalPendingDues' },
          },
        },
      ]),
      Alumni.aggregate([
        {
          $group: {
            _id: '$passingYear',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
      ]),
      Alumni.aggregate([
        {
          $group: {
            _id: '$currentStatus',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalRevenue = aggregateFinancials.length > 0 ? aggregateFinancials[0].totalRevenue : 0;
    const totalPendingDues = aggregateFinancials.length > 0 ? aggregateFinancials[0].totalPendingDues : 0;

    return sendSuccess(res, 200, 'Alumni statistics retrieved successfully', {
      totalAlumni,
      totalRevenue,
      totalPendingDues,
      yearBreakdown: yearAggregates,
      statusBreakdown: statusAggregates,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadAlumniReceiptPDF = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = req.params.id;
    const alumniId = (Array.isArray(rawId) ? rawId[0] : rawId) as string;
    const receiptNumber = req.query.receiptNumber as string;

    const alumni = await Alumni.findById(alumniId);
    if (!alumni) {
      return next(new AppError('Alumni record not found', 404));
    }

    let receipt: any = alumni.feeHistory?.find((r: any) => r.receiptNumber === receiptNumber);
    if (!receipt && alumni.feeHistory && alumni.feeHistory.length > 0) {
      receipt = alumni.feeHistory[0];
    }

    if (!receipt) {
      receipt = {
        receiptNumber: `RCP-ALM-${alumni._id.toString().slice(-6)}`,
        month: `Class of ${alumni.passingYear}`,
        amountPaid: alumni.totalPaid,
        amountDue: alumni.totalPaid + alumni.totalPendingDues,
        paidDate: alumni.graduationDate || new Date().toISOString().split('T')[0],
        paymentMethod: 'UPI',
        transactionId: 'ALUMNI-HISTORICAL-ARCHIVE',
        bankName: 'Official Accounts Desk',
        senderName: alumni.name,
      };
    }

    const pdfBuffer = await generateFeeReceiptPDF({
      receiptNumber: receipt.receiptNumber || `RCP-ALM-${alumni._id.toString().slice(-6)}`,
      studentName: alumni.name,
      studentEmail: alumni.email,
      studentPhone: alumni.phone,
      aadharNumber: alumni.aadharNumber,
      batchName: alumni.batchName,
      subject: alumni.courseName,
      month: receipt.month || `Class of ${alumni.passingYear}`,
      amountDue: receipt.amountDue || receipt.amountPaid || alumni.totalPaid,
      amountPaid: receipt.amountPaid || alumni.totalPaid,
      paidDate: receipt.paidDate || alumni.graduationDate || new Date().toISOString().split('T')[0],
      transactionTime: '12:00:00',
      paymentMethod: receipt.paymentMethod || 'UPI',
      transactionId: receipt.transactionId || 'N/A',
      senderName: receipt.senderName || alumni.name,
      bankName: receipt.bankName || 'N/A',
      status: 'PAID',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Alumni-Receipt-${receipt.receiptNumber || alumni.name}.pdf`
    );
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
