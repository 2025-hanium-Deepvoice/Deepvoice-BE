import { Router } from 'express';
import { createProfile } from '../controllers/profileController.js';
import { requireAuth } from '../middlewares/auth.js';
import { uploadVoice } from '../middlewares/upload.js';

const router = Router();

// POST /profiles (multipart/form-data)
router.post('/', requireAuth, uploadVoice, createProfile);

export default router;
