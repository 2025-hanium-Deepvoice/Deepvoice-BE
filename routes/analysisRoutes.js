// routes/analysisRoutes.js
import { Router } from 'express';
import { listAnalyses, getAnalysis } from '../controllers/analysisController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();
router.get('/', requireAuth, listAnalyses);
router.get('/:id', requireAuth, getAnalysis);

export default router;
