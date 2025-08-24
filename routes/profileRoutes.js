import { Router } from 'express';
import { listProfiles, createProfile } from '../controllers/profileController.js';
import { requireAuth } from '../middlewares/auth.js';
import { uploadProfile } from '../middlewares/upload.js';

const router = Router();

// POST /profiles (multipart/form-data)
router.post('/', requireAuth, uploadProfile, createProfile);

// GET /profiles
router.get('/', requireAuth, listProfiles);

export default router;
