import { Router } from 'express';
import { testStt } from '../controllers/sttTestController.js';
import { uploadVoice } from '../middlewares/upload.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.post('/test', requireAuth, uploadVoice, testStt);

export default router;
