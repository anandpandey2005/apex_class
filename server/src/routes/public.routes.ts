import { Router } from 'express';
import { getPublicStats } from '../controllers/public.controller';

const router = Router();

router.get('/stats', getPublicStats);

export default router;
