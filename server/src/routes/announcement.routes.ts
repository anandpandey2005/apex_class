import { Router } from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
} from '../controllers/announcement.controller';
import { validate } from '../middlewares/validate.middleware';
import { createAnnouncementSchema } from '../validators/announcement.validator';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User.model';

const router = Router();

router.use(authenticate);

router
  .route('/')
  .get(getAnnouncements)
  .post(
    authorizeRoles(UserRole.ADMIN, UserRole.TEACHER),
    validate(createAnnouncementSchema),
    createAnnouncement
  );

router.delete('/:id', authorizeRoles(UserRole.ADMIN), deleteAnnouncement);

export default router;
