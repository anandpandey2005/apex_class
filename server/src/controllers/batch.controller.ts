import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { Batch } from '../models/Batch.model';
import { User, UserRole } from '../models/User.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export const createBatch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      code,
      subject,
      teacherId,
      subjects,
      schedule,
      feeAmount,
      capacity,
      studentIds,
    } = req.body;

    const existing = await Batch.findOne({ code: code.toUpperCase() });
    if (existing) {
      return next(new AppError('Batch code already exists', 400));
    }

    const firstSubTeacher = subjects && subjects[0]?.teacherId;
    const rawTeacher = teacherId || firstSubTeacher || req.user?.id;
    const validTeacherId = mongoose.Types.ObjectId.isValid(rawTeacher) ? rawTeacher : req.user?.id;

    const cleanedSubjects = (subjects || []).map((s: any) => ({
      name: s.name,
      teacherId: s.teacherId && mongoose.Types.ObjectId.isValid(s.teacherId) ? s.teacherId : validTeacherId,
      scheduleType: s.scheduleType || 'MWF',
      days: s.days || ['Mon', 'Wed', 'Fri'],
      schedule: s.schedule || 'Mon, Wed, Fri (04:00 PM - 05:30 PM)',
    }));

    const batch = await Batch.create({
      name,
      code: code.toUpperCase(),
      subject: subject || (cleanedSubjects.map((s: any) => s.name).join(', ')) || 'General',
      teacherId: validTeacherId,
      subjects: cleanedSubjects,
      schedule: schedule || cleanedSubjects.map((s: any) => `${s.name}: ${s.schedule}`).join(' | ') || 'Standard Schedule',
      feeAmount,
      capacity: capacity || 30,
      studentIds: studentIds || [],
    });

    // Sync studentIds with User.batchIds
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      await User.updateMany(
        { _id: { $in: studentIds } },
        { $addToSet: { batchIds: batch._id } }
      );
    }

    return sendSuccess(res, 201, 'Batch created successfully', batch);
  } catch (error) {
    next(error);
  }
};

export const getBatches = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filter: any = { isActive: true };

    if (req.user) {
      if (req.user.role === UserRole.TEACHER) {
        filter.$or = [
          { teacherId: req.user.id },
          { 'subjects.teacherId': req.user.id },
        ];
      } else if (req.user.role === UserRole.STUDENT) {
        filter.studentIds = req.user.id;
      }
    }

    const batches = await Batch.find(filter)
      .populate('teacherId', 'name email phone')
      .populate('subjects.teacherId', 'name email phone')
      .populate('studentIds', 'name email phone');

    return sendSuccess(res, 200, 'Batches retrieved successfully', batches);
  } catch (error) {
    next(error);
  }
};

export const getBatchById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('teacherId', 'name email phone')
      .populate('subjects.teacherId', 'name email phone')
      .populate('studentIds', 'name email phone');

    if (!batch) {
      return next(new AppError('Batch not found', 404));
    }

    return sendSuccess(res, 200, 'Batch fetched successfully', batch);
  } catch (error) {
    next(error);
  }
};

export const updateBatch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('teacherId', 'name email phone')
      .populate('subjects.teacherId', 'name email phone')
      .populate('studentIds', 'name email phone');

    if (!batch) {
      return next(new AppError('Batch not found', 404));
    }

    return sendSuccess(res, 200, 'Batch updated successfully', batch);
  } catch (error) {
    next(error);
  }
};

export const assignStudentToBatch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.body;
    const { id: batchId } = req.params;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return next(new AppError('Batch not found', 404));
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== UserRole.STUDENT) {
      return next(new AppError('Invalid student ID', 400));
    }

    if (!batch.studentIds.includes(student._id)) {
      batch.studentIds.push(student._id);
      await batch.save();
    }

    if (!student.batchIds?.includes(batch._id)) {
      student.batchIds = student.batchIds || [];
      student.batchIds.push(batch._id);
      await student.save();
    }

    return sendSuccess(res, 200, 'Student assigned to batch successfully', batch);
  } catch (error) {
    next(error);
  }
};

export const deleteBatch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const batch = await Batch.findByIdAndDelete(id);
    if (!batch) {
      return next(new AppError('Batch not found', 404));
    }

    // Remove batch from users' batchIds array
    await User.updateMany(
      { batchIds: id },
      { $pull: { batchIds: id } }
    );

    return sendSuccess(res, 200, 'Batch deleted successfully', {});
  } catch (error) {
    next(error);
  }
};
