import { Router } from 'express';
import {
  createFeeRecord,
  getFeeDuesDesk,
  recordPayment,
  approvePaymentProof,
  rejectPaymentProof,
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  downloadFeeReceiptPDF,
  getMyFees,
} from '../controllers/fee.controller';
import { validate } from '../middlewares/validate.middleware';
import { createFeeSchema, recordPaymentSchema, verifyRazorpayPaymentSchema } from '../validators/fee.validator';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User.model';

const router = Router();

// Unauthenticated webhook for Razorpay server-to-server notifications
router.post('/webhook/razorpay', handleRazorpayWebhook);

router.use(authenticate);

router.get('/my-fees', getMyFees);

router
  .route('/')
  .get(getFeeDuesDesk)
  .post(authorizeRoles(UserRole.ADMIN), validate(createFeeSchema), createFeeRecord);

router.post(
  '/:id/pay',
  authorizeRoles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT),
  validate(recordPaymentSchema),
  recordPayment
);

router.post(
  '/:id/approve-proof',
  authorizeRoles(UserRole.ADMIN, UserRole.TEACHER),
  approvePaymentProof
);

router.post(
  '/:id/reject-proof',
  authorizeRoles(UserRole.ADMIN, UserRole.TEACHER),
  rejectPaymentProof
);

router.post(
  '/:id/create-razorpay-order',
  authorizeRoles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT),
  createRazorpayOrder
);

router.post(
  '/:id/verify-razorpay-payment',
  authorizeRoles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT),
  validate(verifyRazorpayPaymentSchema),
  verifyRazorpayPayment
);

router.get('/:id/receipt', downloadFeeReceiptPDF);

export default router;



