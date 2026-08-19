import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Announcement } from '../models/Announcement.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export const createAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, message, targetBatchId, targetBatchIds, priority, attachmentUrl } = req.body;
    const authorId = req.user?.id;

    if (!authorId) {
      return next(new AppError('Unauthorized author', 401));
    }

    let validBatchIds: mongoose.Types.ObjectId[] = [];
    if (Array.isArray(targetBatchIds) && targetBatchIds.length > 0) {
      validBatchIds = targetBatchIds
        .filter((id: string) => id && mongoose.Types.ObjectId.isValid(id))
        .map((id: string) => new mongoose.Types.ObjectId(id));
    }

    const validSingleBatchId =
      targetBatchId && mongoose.Types.ObjectId.isValid(targetBatchId)
        ? new mongoose.Types.ObjectId(targetBatchId)
        : validBatchIds.length === 1 ? validBatchIds[0] : null;

    const announcement = await Announcement.create({
      title,
      message,
      targetBatchId: validSingleBatchId,
      targetBatchIds: validBatchIds,
      priority,
      attachmentUrl,
      authorId,
    });

    return sendSuccess(res, 201, 'Announcement posted successfully', announcement);
  } catch (error) {
    next(error);
  }
};

export const getAnnouncements = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { batchId, priority } = req.query;

    const filter: any = {};
    if (priority) filter.priority = priority;

    if (batchId) {
      filter.$or = [
        { targetBatchId: batchId },
        { targetBatchIds: batchId },
        { targetBatchId: null, targetBatchIds: { $size: 0 } },
      ];
    } else if (req.user && req.user.role === 'STUDENT') {
      const user = await mongoose.model('User').findById(req.user.id);
      const userBatches = user?.batchIds || [];
      filter.$or = [
        { targetBatchId: { $in: userBatches } },
        { targetBatchIds: { $in: userBatches } },
        { targetBatchId: null, targetBatchIds: { $size: 0 } },
        { targetBatchId: { $exists: false }, targetBatchIds: { $exists: false } },
      ];
    } else if (req.user && req.user.role === 'TEACHER') {
      const teacherBatches = await mongoose.model('Batch').find({
        $or: [{ teacherId: req.user.id }, { 'subjects.teacherId': req.user.id }],
      }).distinct('_id');
      filter.$or = [
        { targetBatchId: { $in: teacherBatches } },
        { targetBatchIds: { $in: teacherBatches } },
        { targetBatchId: null, targetBatchIds: { $size: 0 } },
        { targetBatchId: { $exists: false }, targetBatchIds: { $exists: false } },
      ];
    }

    const announcements = await Announcement.find(filter)
      .populate('authorId', 'name role email phone')
      .populate('targetBatchId', 'name subject code')
      .populate('targetBatchIds', 'name subject code')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Announcements fetched successfully', announcements);
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    return sendSuccess(res, 200, 'Announcement deleted successfully', {});
  } catch (error) {
    next(error);
  }
};
