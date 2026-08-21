import { Router } from 'express';
import {
  getAlumniList,
  getAlumniById,
  graduateStudent,
  createAlumni,
  updateAlumni,
  deleteAlumni,
  getAlumniStats,
  downloadAlumniReceiptPDF,
} from '../controllers/alumni.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createAlumniSchema,
  updateAlumniSchema,
  graduateStudentSchema,
} from '../validators/alumni.validator';
import { UserRole } from '../models/User.model';

const router = Router();

router.use(authenticate);

// Statistics endpoint (fast aggregation)
router.get('/stats', getAlumniStats);

// Graduate student endpoint
router.post(
  '/graduate',
  authorizeRoles(UserRole.DIRECTOR, UserRole.ADMIN),
  validate(graduateStudentSchema),
  graduateStudent
);

// Main paginated & searchable list & create
router
  .route('/')
  .get(getAlumniList)
  .post(
    authorizeRoles(UserRole.DIRECTOR, UserRole.ADMIN),
    validate(createAlumniSchema),
    createAlumni
  );

// Receipt download for Alumni fee history
router.get('/:id/receipt', downloadAlumniReceiptPDF);

// Individual Alumni operations
router
  .route('/:id')
  .get(getAlumniById)
  .put(
    authorizeRoles(UserRole.DIRECTOR, UserRole.ADMIN),
    validate(updateAlumniSchema),
    updateAlumni
  )
  .delete(authorizeRoles(UserRole.DIRECTOR, UserRole.ADMIN), deleteAlumni);

export default router;
