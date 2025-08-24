import axios from 'axios';
import VoiceAnalysis from '../models/VoiceAnalysis.js';
import VoiceTranscript from '../models/VoiceTranscript.js';
import VoiceSuspiciousSentence from '../models/VoiceSuspiciousSentence.js';
import { speechToTextUrl } from '../clients/sttClient.js';

export const analyzeVoiceFromS3 = async (req, res) => {
  try {
    const { analysisId } = req.params;

    // 1) voice_analysis 찾기
    const analysis = await VoiceAnalysis.findByPk(analysisId);
    if (!analysis) {
      return res.status(404).json({ ok: false, message: 'VoiceAnalysis not found' });
    }
    if (!analysis.file_path) {
      return res.status(400).json({ ok: false, message: 'file_path not found in VoiceAnalysis' });
    }

    // 2) S3 경로 기반 STT 실행
    const sttRaw = await speechToTextUrl(analysis.file_path);

    // 3) RAG 호출
    let ragType = null;
    let ragGuidance = null;
    let ragSuspicious = [];
    let ragProbability = null;
    let ragSimilarSummary = null;

    try {
      const ragResp = await axios.post(
        process.env.RAG_URL,
        { text: sttRaw?.text ?? '' },
        {
          headers: { 'x-api-key': process.env.RAG_API_KEY },
          timeout: 30000,
        }
      );

      const ragData = ragResp.data;
      ragType = ragData?.type ?? null;
      ragProbability = ragData?.probability ?? null;
      ragSuspicious = Array.isArray(ragData?.suspicious_sentences)
        ? ragData.suspicious_sentences
        : [];
      ragGuidance = ragData?.actions ? JSON.stringify(ragData.actions) : null;
      ragSimilarSummary = ragData?.similar_cases_summary ?? null;
    } catch (err) {
      console.warn('[WARN] RAG 호출 실패:', err.message);
    }

    // 4) Transcript 저장
    const transcript = await VoiceTranscript.create({
      voice_id: analysis.id,
      transcript: sttRaw?.text ?? '',
      type: ragType,
      guidance: ragGuidance,
      similar_cases_summary: ragSimilarSummary,
      llm_confidence: ragProbability,
    });

    // 5) Suspicious Sentences 저장
    if (ragSuspicious.length > 0) {
      const suspiciousRows = ragSuspicious.map(sentence => ({
        transcript_id: transcript.id,
        sentence,
      }));
      await VoiceSuspiciousSentence.bulkCreate(suspiciousRows);
    }

    // 6) 응답
    return res.json({
      ok: true,
      analysisId: analysis.id,
      transcript,
      suspicious_sentences: ragSuspicious,
      stt_raw: sttRaw,
    });
  } catch (e) {
    console.error('[analyzeVoiceFromS3 error]', e?.response?.data || e);
    return res.status(502).json({
      ok: false,
      message: 'STT or RAG 호출 실패',
      detail: e?.response?.data || e?.message || String(e),
    });
  }
};
