import { Router } from 'express';
import authRoutes from './auth.routes';
import batchRoutes from './batch.routes';
import attendanceRoutes from './attendance.routes';
import feeRoutes from './fee.routes';
import announcementRoutes from './announcement.routes';
import userRoutes from './user.routes';
import alumniRoutes from './alumni.routes';
import publicRoutes from './public.routes';

const router = Router();

router.use('/public', publicRoutes);
router.use('/auth', authRoutes);
router.use('/batches', batchRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/fees', feeRoutes);
router.use('/announcements', announcementRoutes);
router.use('/users', userRoutes);
router.use('/alumni', alumniRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
