import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '../models/User.model';
import { Batch } from '../models/Batch.model';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, batchId } = req.query;

    const filter: any = {};
    if (role) filter.role = role;
    if (batchId) filter.batchIds = batchId;

    const users = await User.find(filter)
      .populate('batchIds', 'name code subject schedule scheduleType days')
      .select('-password')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, phone, batchIds, permissions } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return next(new AppError('User with this email already exists', 400));
    }

    const user = await User.create({
      name,
      email,
      password: password || 'password123',
      role: role || UserRole.STUDENT,
      phone,
      batchIds: batchIds || [],
      permissions: permissions || [],
    });

    // Synchronize batch.studentIds if user has batchIds
    if (batchIds && Array.isArray(batchIds) && batchIds.length > 0) {
      await Batch.updateMany(
        { _id: { $in: batchIds } },
        { $addToSet: { studentIds: user._id } }
      );
    }

    const userObj = user.toObject();
    delete userObj.password;

    return sendSuccess(res, 201, `${role || 'User'} created successfully`, userObj);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates.password; // Do not allow password update via general update

    const oldUser = await User.findById(id);
    if (!oldUser) {
      return next(new AppError('User not found', 404));
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('batchIds', 'name code subject schedule scheduleType days')
      .select('-password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Sync batchIds if changed
    if (updates.batchIds && Array.isArray(updates.batchIds)) {
      // Remove from batches no longer in user's batchIds
      const removedBatches = (oldUser.batchIds || []).filter(
        (bId) => !updates.batchIds.includes(bId.toString())
      );
      if (removedBatches.length > 0) {
        await Batch.updateMany(
          { _id: { $in: removedBatches } },
          { $pull: { studentIds: user._id } }
        );
      }

      // Add to new batches
      await Batch.updateMany(
        { _id: { $in: updates.batchIds } },
        { $addToSet: { studentIds: user._id } }
      );
    }

    return sendSuccess(res, 200, 'User updated successfully', user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Remove user from batches
    await Batch.updateMany(
      { studentIds: id },
      { $pull: { studentIds: id } }
    );

    return sendSuccess(res, 200, 'User removed successfully', {});
  } catch (error) {
    next(error);
  }
};
