import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User.model';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { env } from '../config/env.config';
import { AuthRequest } from '../middlewares/auth.middleware';

const generateToken = (
  id: string,
  email: string,
  role: UserRole,
  name: string,
  permissions: string[] = []
): string => {
  return jwt.sign({ id, email, role, name, permissions }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

const sendTokenResponse = (user: any, statusCode: number, res: Response, message: string) => {
  const permissions = user.permissions || [];
  const token = generateToken(
    user._id.toString(),
    user.email,
    user.role,
    user.name,
    permissions
  );

  const isProduction = env.NODE_ENV === 'production';
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
  };

  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;

  res.cookie('token', token, cookieOptions);

  return sendSuccess(res, statusCode, message, {
    user: userObj,
    token,
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, phone, batchIds } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('User with this email already exists', 400));
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || UserRole.STUDENT,
      phone,
      batchIds,
    });

    return sendTokenResponse(user, 201, res, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    return sendTokenResponse(user, 200, res, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response) => {
  const isProduction = env.NODE_ENV === 'production';
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
  });

  return sendSuccess(res, 200, 'Logged out successfully', {});
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const user = await User.findById(req.user.id).populate('batchIds');
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    return sendSuccess(res, 200, 'User profile fetched successfully', user);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Incorrect current password', 400));
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, 200, 'Password updated successfully', {});
  } catch (error) {
    next(error);
  }
};
