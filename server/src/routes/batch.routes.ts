import { Router } from 'express';
import {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  assignStudentToBatch,
} from '../controllers/batch.controller';
import { validate } from '../middlewares/validate.middleware';
import { createBatchSchema, updateBatchSchema } from '../validators/batch.validator';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User.model';

const router = Router();

router.use(authenticate);

router
  .route('/')
  .get(getBatches)
  .post(authorizeRoles(UserRole.ADMIN, UserRole.TEACHER), validate(createBatchSchema), createBatch);

router
  .route('/:id')
  .get(getBatchById)
  .put(authorizeRoles(UserRole.ADMIN, UserRole.TEACHER), validate(updateBatchSchema), updateBatch)
  .delete(authorizeRoles(UserRole.ADMIN, UserRole.TEACHER), deleteBatch);

router.post(
  '/:id/assign-student',
  authorizeRoles(UserRole.ADMIN, UserRole.TEACHER),
  assignStudentToBatch
);

export default router;
