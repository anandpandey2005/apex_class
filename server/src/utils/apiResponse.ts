import { Response } from 'express';

export const sendSuccess = <T>(
  res: Response,
  statusCode = 200,
  message: string,
  data: T,
  meta?: object
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
};

export const sendError = (
  res: Response,
  statusCode = 400,
  message: string,
  errors?: unknown
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
};
