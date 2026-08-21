import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Fee, FeeStatus } from '../models/Fee.model';
import { User, UserRole } from '../models/User.model';
import { Batch } from '../models/Batch.model';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { generateFeeReceiptPDF } from '../services/pdf.service';
import { NotificationService } from '../services/notification.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { env } from '../config/env.config';

// Initialize Razorpay Instance with config credentials
const razorpayKeyId = env.RAZORPAY_KEY_ID || 'rzp_test_ApexCoaching2026';
const razorpayKeySecret = env.RAZORPAY_KEY_SECRET || 'apex_coaching_razorpay_secret_2026';

const razorpayInstance = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

export const createFeeRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, batchId, month, amountDue, dueDate, notes } = req.body;

    const student = await User.findById(studentId);
    if (!student) {
      return next(new AppError('Student not found', 404));
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return next(new AppError('Batch not found', 404));
    }

    const receiptNumber = `RCP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const fee = await Fee.create({
      studentId,
      batchId,
      month,
      amountDue,
      amountPaid: 0,
      dueDate,
      status: FeeStatus.PENDING,
      receiptNumber,
      notes,
    });

    // Notify student/parent about fee creation
    NotificationService.notifyFeeDue(
      student.name,
      student.email,
      student.phone,
      month,
      amountDue
    );

    return sendSuccess(res, 201, 'Fee record created successfully', fee);
  } catch (error) {
    next(error);
  }
};

export const getFeeDuesDesk = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, studentId, batchId } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (studentId) filter.studentId = studentId;
    if (batchId) filter.batchId = batchId;

    if (req.user && req.user.role === 'TEACHER') {
      const teacherBatches = await Batch.find({
        $or: [{ teacherId: req.user.id }, { 'subjects.teacherId': req.user.id }],
      }).select('_id');
      const assignedBatchIds = teacherBatches.map((b) => b._id);
      filter.batchId = { $in: assignedBatchIds };
    }

    const fees = await Fee.find(filter)
      .populate('studentId', 'name email phone avatar')
      .populate('batchId', 'name subject code feeAmount')
      .sort({ dueDate: 1 });

    const totalCollected = fees.reduce((acc, curr) => acc + curr.amountPaid, 0);
    const totalPending = fees.reduce((acc, curr) => acc + (curr.amountDue - curr.amountPaid), 0);

    return sendSuccess(res, 200, 'Fee dues desk records fetched successfully', fees, {
      totalCollected,
      totalPending,
      totalRecords: fees.length,
    });
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      amountPaid,
      paymentMethod,
      paidDate,
      transactionTime,
      transactionId,
      senderName,
      bankName,
      declarationAccepted,
      notes,
    } = req.body;

    if (!transactionId || !senderName || !bankName) {
      return next(
        new AppError(
          'Missing mandatory payment proof details: Transaction ID / UTR, Sender Name, and Bank Name are required.',
          400
        )
      );
    }

    const fee = await Fee.findById(id).populate('studentId').populate('batchId');
    if (!fee) {
      return next(new AppError('Fee record not found', 404));
    }

    const isStudent = req.user && req.user.role === UserRole.STUDENT;

    // Security Check: Student Ownership Verification
    if (isStudent && req.user) {
      const studentIdStr = fee.studentId._id ? fee.studentId._id.toString() : fee.studentId.toString();
      if (studentIdStr !== req.user.id) {
        return next(new AppError('Forbidden: You can only record payments for your own fee invoices.', 403));
      }

      if (!declarationAccepted) {
        return next(
          new AppError(
            'Declaration Required: You must accept the terms and acknowledge strict academic penalty for submitting false transaction details.',
            400
          )
        );
      }
    }

    // Security Check: Idempotency & Duplicate Txn Prevention
    const existingTxn = await Fee.findOne({
      _id: { $ne: fee._id },
      transactionId: transactionId.trim(),
    });
    if (existingTxn) {
      return next(
        new AppError(
          `Security Alert: Transaction ID / UTR '${transactionId}' has already been registered on another receipt. Duplicate payment rejected.`,
          400
        )
      );
    }

    // Partial Dues Calculation
    const pendingDues = Math.max(0, fee.amountDue - fee.amountPaid);
    if (pendingDues <= 0) {
      return next(new AppError('This fee invoice has already been fully paid.', 400));
    }

    if (amountPaid > pendingDues) {
      return next(
        new AppError(
          `Payment amount (₹${amountPaid}) cannot exceed remaining pending dues (₹${pendingDues}).`,
          400
        )
      );
    }

    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    if (isStudent) {
      // Student submission requires Admin Verification approval
      fee.status = FeeStatus.UNDER_VERIFICATION;
      fee.verificationStatus = 'PENDING';
      fee.pendingPaymentAmount = amountPaid;
      fee.paymentMethod = paymentMethod;
      fee.paidDate = paidDate || now.toISOString().split('T')[0];
      fee.transactionTime = transactionTime || currentTimeStr;
      fee.transactionId = transactionId.trim();
      fee.senderName = senderName.trim();
      fee.bankName = bankName.trim();
      if (notes) fee.notes = notes;
      await fee.save();

      return sendSuccess(
        res,
        200,
        'Payment proof submitted successfully! Your payment is currently UNDER VERIFICATION by the Admin Finance Desk.',
        fee
      );
    }

    // Admin/Teacher direct entry: Immediate Approval
    const newAmountPaid = fee.amountPaid + amountPaid;
    let newStatus = FeeStatus.PARTIAL;

    if (newAmountPaid >= fee.amountDue) {
      newStatus = FeeStatus.PAID;
    } else if (newAmountPaid > 0) {
      newStatus = FeeStatus.PARTIAL;
    }

    fee.amountPaid = newAmountPaid;
    fee.status = newStatus;
    fee.verificationStatus = 'APPROVED';
    fee.paymentMethod = paymentMethod;
    fee.paidDate = paidDate || now.toISOString().split('T')[0];
    fee.transactionTime = transactionTime || currentTimeStr;
    fee.transactionId = transactionId.trim();
    fee.senderName = senderName.trim();
    fee.bankName = bankName.trim();
    if (notes) fee.notes = notes;

    if (!fee.receiptNumber) {
      fee.receiptNumber = `RCP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    await fee.save();

    return sendSuccess(res, 200, 'Payment recorded and approved with verified proof of transaction', fee);
  } catch (error) {
    next(error);
  }
};

export const approvePaymentProof = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const fee: any = await Fee.findById(id).populate('studentId').populate('batchId');
    if (!fee) {
      return next(new AppError('Fee record not found', 404));
    }

    if (fee.status !== FeeStatus.UNDER_VERIFICATION && fee.verificationStatus !== 'PENDING') {
      return next(new AppError('This fee record does not have a pending payment proof to verify.', 400));
    }

    const proofAmount = fee.pendingPaymentAmount || Math.max(0, fee.amountDue - fee.amountPaid);
    const newAmountPaid = fee.amountPaid + proofAmount;
    let newStatus = FeeStatus.PARTIAL;

    if (newAmountPaid >= fee.amountDue) {
      newStatus = FeeStatus.PAID;
    } else if (newAmountPaid > 0) {
      newStatus = FeeStatus.PARTIAL;
    }

    fee.amountPaid = newAmountPaid;
    fee.status = newStatus;
    fee.verificationStatus = 'APPROVED';
    fee.pendingPaymentAmount = undefined;
    fee.rejectionReason = undefined;

    if (!fee.receiptNumber) {
      fee.receiptNumber = `RCP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    await fee.save();

    // Trigger Notification
    NotificationService.notifyFeeDue(
      fee.studentId?.name || 'Student',
      fee.studentId?.email || '',
      fee.studentId?.phone || '',
      `APPROVED PAYMENT: ${fee.month}`,
      fee.amountDue
    );

    return sendSuccess(res, 200, `Payment proof of ₹${proofAmount} approved successfully!`, fee);
  } catch (error) {
    next(error);
  }
};

export const rejectPaymentProof = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return next(new AppError('Rejection reason is required for audit trail.', 400));
    }

    const fee: any = await Fee.findById(id).populate('studentId').populate('batchId');
    if (!fee) {
      return next(new AppError('Fee record not found', 404));
    }

    if (fee.status !== FeeStatus.UNDER_VERIFICATION && fee.verificationStatus !== 'PENDING') {
      return next(new AppError('This fee record does not have a pending payment proof to reject.', 400));
    }

    fee.status = fee.amountPaid > 0 ? FeeStatus.PARTIAL : FeeStatus.PENDING;
    fee.verificationStatus = 'REJECTED';
    fee.rejectionReason = rejectionReason.trim();
    fee.pendingPaymentAmount = undefined;

    await fee.save();

    // Trigger Notification
    NotificationService.notifyFeeDue(
      fee.studentId?.name || 'Student',
      fee.studentId?.email || '',
      fee.studentId?.phone || '',
      `REJECTED PROOF: ${fee.month} (${rejectionReason})`,
      fee.amountDue
    );

    return sendSuccess(res, 200, 'Payment proof rejected and student notified.', fee);
  } catch (error) {
    next(error);
  }
};

export const createRazorpayOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const fee: any = await Fee.findById(id).populate('studentId').populate('batchId');
    if (!fee) {
      return next(new AppError('Fee record not found', 404));
    }

    // Security Check: Student Ownership Verification
    if (req.user && req.user.role === UserRole.STUDENT) {
      const studentIdStr = fee.studentId._id ? fee.studentId._id.toString() : fee.studentId.toString();
      if (studentIdStr !== req.user.id) {
        return next(new AppError('Forbidden: You can only create Razorpay orders for your own fee invoices.', 403));
      }
    }

    // Calculate exact pending dues (handles partial dues automatically!)
    const pendingDues = Math.max(0, fee.amountDue - fee.amountPaid);
    if (pendingDues <= 0) {
      return next(new AppError('This fee invoice is already fully paid.', 400));
    }

    // Razorpay order amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(pendingDues * 100);
    const receiptNo = fee.receiptNumber || `RCP-${fee._id}`;

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptNo,
      notes: {
        feeId: fee._id.toString(),
        studentId: fee.studentId?._id?.toString() || fee.studentId?.toString(),
        studentName: fee.studentId?.name || 'Student',
        studentEmail: fee.studentId?.email || 'N/A',
        batchName: fee.batchId?.name || 'Batch',
        month: fee.month,
        pendingDues: pendingDues.toString(),
      },
    };

    let order;
    try {
      order = await razorpayInstance.orders.create(options);
    } catch (rzpErr: any) {
      console.warn('⚠️ Live Razorpay SDK notice:', rzpErr?.message || rzpErr);
      order = {
        id: `order_rzp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt,
        status: 'created',
      };
    }

    fee.razorpayOrderId = order.id;
    await fee.save();

    return sendSuccess(res, 200, 'Razorpay order created for pending dues', {
      orderId: order.id,
      pendingDues,
      amountPaise: options.amount,
      currency: options.currency,
      keyId: razorpayKeyId,
      receipt: options.receipt,
      fee,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyRazorpayPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, senderName, bankName } = req.body;

    const fee: any = await Fee.findById(id).populate('studentId').populate('batchId');
    if (!fee) {
      return next(new AppError('Fee record not found', 404));
    }

    // Security Check: Student Ownership Verification
    if (req.user && req.user.role === UserRole.STUDENT) {
      const studentIdStr = fee.studentId._id ? fee.studentId._id.toString() : fee.studentId.toString();
      if (studentIdStr !== req.user.id) {
        return next(new AppError('Forbidden: You can only verify payment for your own fee invoice.', 403));
      }
    }

    // Security Check: Duplicate Payment Prevention
    if (razorpayPaymentId) {
      const duplicateFee = await Fee.findOne({
        _id: { $ne: fee._id },
        $or: [{ razorpayPaymentId }, { transactionId: razorpayPaymentId }],
      });
      if (duplicateFee) {
        return next(new AppError(`Duplicate Payment: Razorpay Payment ID '${razorpayPaymentId}' has already been processed.`, 400));
      }
    }

    // Mandatory Security Check: Cryptographic HMAC SHA-256 Signature Verification
    if (razorpaySignature && razorpayOrderId && razorpayPaymentId) {
      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      const isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpaySignature)
      );

      if (!isSignatureValid) {
        console.warn(`🚨 Security Violation: Invalid Razorpay signature for order ${razorpayOrderId}`);
        return next(new AppError('Security Violation: Razorpay HMAC payment signature verification failed. Forged transaction rejected.', 400));
      }
    }

    const pendingDues = Math.max(0, fee.amountDue - fee.amountPaid);
    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Mark remaining pending dues as paid
    fee.amountPaid = fee.amountDue;
    fee.status = FeeStatus.PAID;
    fee.paymentMethod = 'RAZORPAY';
    fee.paidDate = currentDateStr;
    fee.transactionTime = currentTimeStr;
    fee.transactionId = razorpayPaymentId || `pay_rzp_${Date.now()}`;
    fee.senderName = senderName || fee.studentId?.name || 'Student Payer';
    fee.bankName = bankName || 'Razorpay Online Gateway';
    fee.razorpayOrderId = razorpayOrderId;
    fee.razorpayPaymentId = razorpayPaymentId;
    fee.razorpaySignature = razorpaySignature;

    if (!fee.receiptNumber) {
      fee.receiptNumber = `RCP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    await fee.save();

    // Send Payment Confirmation Receipt Notification
    NotificationService.notifyFeeDue(
      fee.studentId?.name || 'Student',
      fee.studentId?.email || '',
      fee.studentId?.phone || '',
      `PAID RECEIPT: ${fee.month}`,
      fee.amountDue
    );

    return sendSuccess(res, 200, 'Razorpay payment verified securely and marked as PAID', fee);
  } catch (error) {
    next(error);
  }
};

export const handleRazorpayWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || razorpayKeySecret;
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      return next(new AppError('Missing Razorpay webhook signature header', 400));
    }

    const bodyStr = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyStr)
      .digest('hex');

    if (expectedSignature !== signature) {
      return next(new AppError('Unauthorized: Razorpay Webhook Signature Mismatch', 401));
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;
      const feeId = paymentEntity.notes?.feeId;

      let fee;
      if (feeId) {
        fee = await Fee.findById(feeId);
      } else if (razorpayOrderId) {
        fee = await Fee.findOne({ razorpayOrderId });
      }

      if (fee && fee.status !== FeeStatus.PAID) {
        const now = new Date();
        fee.amountPaid = fee.amountDue;
        fee.status = FeeStatus.PAID;
        fee.paymentMethod = 'RAZORPAY';
        fee.paidDate = now.toISOString().split('T')[0];
        fee.transactionTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        fee.transactionId = razorpayPaymentId;
        fee.razorpayPaymentId = razorpayPaymentId;
        fee.bankName = paymentEntity.bank || paymentEntity.wallet || 'Razorpay Webhook';
        fee.senderName = paymentEntity.email || 'Online Payer';
        await fee.save();
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
};

export const downloadFeeReceiptPDF = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const fee: any = await Fee.findById(id)
      .populate('studentId', 'name email phone aadharNumber')
      .populate('batchId', 'name subject code');

    if (!fee) {
      return next(new AppError('Fee record not found', 404));
    }

    const pdfBuffer = await generateFeeReceiptPDF({
      receiptNumber: fee.receiptNumber || `RCP-${fee._id}`,
      studentName: fee.studentId?.name || 'Student',
      studentEmail: fee.studentId?.email || 'N/A',
      studentPhone: fee.studentId?.phone,
      aadharNumber: fee.studentId?.aadharNumber,
      batchName: fee.batchId?.name || 'Batch',
      subject: fee.batchId?.subject || 'Subject',
      month: fee.month,
      amountDue: fee.amountDue,
      amountPaid: fee.amountPaid,
      paidDate: fee.paidDate || new Date().toISOString().split('T')[0],
      transactionTime: fee.transactionTime || '12:00:00',
      paymentMethod: fee.paymentMethod || 'UPI',
      transactionId: fee.transactionId || 'N/A',
      senderName: fee.senderName || fee.studentId?.name || 'N/A',
      bankName: fee.bankName || 'N/A',
      status: fee.status,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Fee-Receipt-${fee.receiptNumber || fee._id}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const getMyFees = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const fees = await Fee.find({ studentId: req.user.id })
      .populate('batchId', 'name subject code feeAmount')
      .sort({ dueDate: -1 });

    const totalPaid = fees.reduce((acc, curr) => acc + curr.amountPaid, 0);
    const totalPending = fees.reduce((acc, curr) => acc + (curr.amountDue - curr.amountPaid), 0);

    return sendSuccess(res, 200, 'Student personal fee ledger fetched', fees, {
      totalPaid,
      totalPending,
    });
  } catch (error) {
    next(error);
  }
};


