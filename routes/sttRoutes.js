import { Router } from 'express';
import { testStt } from '../controllers/sttTestController.js';
import { uploadVoice } from '../middlewares/upload.js';

const router = Router();

// ✅ 업로드 미들웨어가 반드시 testStt 앞에 있어야 함
router.post('/test', uploadVoice, testStt);

export default router;
