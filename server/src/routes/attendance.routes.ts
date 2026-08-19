import { Router } from 'express';
import {
  markBatchAttendance,
  getAttendanceRegister,
  getAttendanceStats,
  getMyAttendance,
} from '../controllers/attendance.controller';
import { validate } from '../middlewares/validate.middleware';
import { markAttendanceSchema, getAttendanceQuerySchema } from '../validators/attendance.validator';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User.model';

const router = Router();

router.use(authenticate);

router.get('/my-attendance', getMyAttendance);

router.post(
  '/mark',
  authorizeRoles(UserRole.ADMIN, UserRole.TEACHER),
  validate(markAttendanceSchema),
  markBatchAttendance
);

router.get('/register', validate(getAttendanceQuerySchema), getAttendanceRegister);
router.get('/stats', getAttendanceStats);

export default router;
