import { Router } from 'express';
import { listTranscripts, getTranscript } from '../controllers/voiceTranscriptController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, listTranscripts);         // /transcripts?voice_id=1&skip=&take=
router.get('/:id', requireAuth, getTranscript);        // /transcripts/123

export default router;