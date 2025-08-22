import { Router } from 'express';
import { testRag } from '../controllers/ragController.js';

const router = Router();

// POST /rag/test
router.post('/test', testRag);

export default router;
