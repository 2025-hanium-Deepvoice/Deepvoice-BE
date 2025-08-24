import { Router } from 'express';
import { listTranscripts, getTranscript } from '../controllers/voiceTranscriptController.js';
import { requireAuth } from '../middlewares/auth.js';
import { analyzeVoiceFromS3 } from '../controllers/transcriptController.js';


const router = Router();

router.get('/', requireAuth, listTranscripts);         // /transcripts?voice_id=1&skip=&take=
router.get('/:id', requireAuth, getTranscript);        // /transcripts/123
router.post('/analyze/:analysisId', requireAuth, analyzeVoiceFromS3);


export default router;