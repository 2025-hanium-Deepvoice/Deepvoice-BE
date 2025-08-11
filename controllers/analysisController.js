// controllers/analysisController.js
import VoiceAnalysis from '../models/VoiceAnalysis.js';
import { parseAnalysisQuery } from '../dto/AnalysisQueryDto.js';
import { toVoiceAnalysisResponse } from '../dto/responses/VoiceAnalysisResponseDto.js';
import { toVoiceAnalysisListResponse } from '../dto/responses/VoiceAnalysisListResponseDto.js';

// GET /analyses?skip=0&take=20&is_phishing=true|false
export const listAnalyses = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { skip, take, whereExtra } = parseAnalysisQuery(req.query);

    const { rows, count } = await VoiceAnalysis.findAndCountAll({
      where: { user_id: userId, ...whereExtra },
      order: [['detected_at', 'DESC'], ['id', 'DESC']],
      offset: skip,
      limit: take,
    });

    const items = rows.map(toVoiceAnalysisResponse);
    return res.json(toVoiceAnalysisListResponse(items, count, skip, take));
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Invalid request' });
  }
};

// GET /analyses/:id
export const getAnalysis = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'Invalid id' });

    const a = await VoiceAnalysis.findOne({ where: { id, user_id: userId } });
    if (!a) return res.status(404).json({ message: 'Analysis not found' });

    return res.json(toVoiceAnalysisResponse(a));
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Invalid request' });
  }
};
