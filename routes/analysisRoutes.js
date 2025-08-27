// routes/analysisRoutes.js
import { Router } from 'express';
import multer from "multer";
import { listAnalyses, getAnalysis, analyzeVoice } from '../controllers/analysisController.js'; // ✅ 추가
import { requireAuth } from '../middlewares/auth.js';

const router = Router();
const upload = multer();

router.get('/', requireAuth, listAnalyses);
router.get('/:id', requireAuth, getAnalysis);
router.post("/analyze", requireAuth, upload.single("file"), analyzeVoice);

export default router;
