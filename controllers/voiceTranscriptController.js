import VoiceTranscript from '../models/VoiceTranscript.js';
import { parseTranscriptQuery } from '../dto/TranscriptQueryDto.js';
import { toVoiceTranscriptResponse } from '../dto/responses/VoiceTranscriptResponseDto.js';
import { toVoiceTranscriptListResponse } from '../dto/responses/VoiceTranscriptListResponseDto.js';
import VoiceSuspiciousSentence from '../models/VoiceSuspiciousSentence.js';

// GET /transcripts?skip=0&take=20&voice_id=1
export const listTranscripts = async (req, res) => {
  try {
    const { skip, take, voice_id } = parseTranscriptQuery(req.query);

    const where = {};
    if (voice_id) where.voice_id = voice_id;

    const { rows, count } = await VoiceTranscript.findAndCountAll({
      where,
      offset: skip,
      limit: take,
      order: [['id', 'DESC']],
      include: [
        {
          model: VoiceSuspiciousSentence,
          as: 'suspicious_sentences',
          attributes: ['id', 'sentence'], // ✅ id 포함
        },
      ],
    });

    const items = rows.map(toVoiceTranscriptResponse);
    return res.json(toVoiceTranscriptListResponse(items, count, skip, take));
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Invalid request' });
  }
};


// GET /transcripts/:id
export const getTranscript = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const t = await VoiceTranscript.findByPk(id, {
      include: [
        {
          model: VoiceSuspiciousSentence,
          as: 'suspicious_sentences',
          attributes: ['id', 'sentence'], // ✅ id 포함
        },
      ],
    });

    if (!t) return res.status(404).json({ message: 'Transcript not found' });

    return res.json(toVoiceTranscriptResponse(t));
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Invalid request' });
  }
};
