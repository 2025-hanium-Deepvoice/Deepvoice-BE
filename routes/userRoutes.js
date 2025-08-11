import { Router } from 'express';
import { getMyName } from '../controllers/userController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();
router.get('/me', requireAuth, getMyName);
export default router;
