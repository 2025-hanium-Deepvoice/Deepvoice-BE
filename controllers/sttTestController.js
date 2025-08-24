import { speechToTextBuffer } from '../clients/sttClient.js';
import { s3, S3_BUCKET, buildPublicUrl } from '../s3.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import * as mm from 'music-metadata';
import VoiceAnalysis from '../models/VoiceAnalysis.js';
import VoiceTranscript from '../models/VoiceTranscript.js';
import axios from 'axios';
import VoiceSuspiciousSentence from '../models/VoiceSuspiciousSentence.js';


export const testStt = async (req, res) => {

  try {
    const f = req.file;
    if (!f || !f.buffer) {
      return res.status(400).json({
        message: 'voice 파일이 필요합니다. (form-data: key=voice, type=File)'
      });
    }

    // ✅ 1) 파일 길이 추출
    let durationSeconds = null;
    try {
      const metadata = await mm.parseBuffer(f.buffer, f.mimetype);
      durationSeconds = Math.round(metadata.format.duration);
    } catch (err) {
      console.warn('[WARN] duration 추출 실패:', err.message);
    }

    // ✅ 2) 안전한 S3 키 생성
    const ext = path.extname(f.originalname) || '.bin';
    const key = `uploads/voices/${Date.now()}_${uuidv4()}${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: f.buffer,
      ContentType: f.mimetype,
    }));
    const s3Url = buildPublicUrl(key);

    // ✅ 3) VoiceAnalysis row 생성
    const analysis = await VoiceAnalysis.create({
      file_path: s3Url,
      file_name: f.originalname || null,
      user_id: req.user.id,
      detected_at: new Date(),        // 저장 시각
      duration_seconds: durationSeconds, // 음성 길이
    });

    // ✅ 4) STT 호출
    const sttRaw = await speechToTextBuffer(
      f.buffer,
      f.originalname || 'audio.bin',
      f.mimetype
    );


    // ✅ 5) RAG 호출
    let ragType = null;
    let ragGuidance = null;
    let ragSuspicious = [];
    let ragProbability = null;let ragSimilarSummary = null; 

    try {
      const ragResp = await axios.post(
        `${process.env.RAG_URL}`,
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

      ragGuidance = ragData?.actions
        ? JSON.stringify(ragData.actions)
        : null;

      ragSimilarSummary = ragData?.similar_cases_summary ?? null;  // ✅ 요약 저장
    } catch (err) {
      console.warn('[WARN] RAG 호출 실패:', err.message);
    }

    // ✅ 7) Transcript 저장
     const transcript = await VoiceTranscript.create({
      voice_id: analysis.id,
      transcript: sttRaw?.text ?? '',
      type: ragType,
      guidance: ragGuidance,
      similar_cases_summary: ragSimilarSummary, 
      llm_confidence: ragProbability,
    });

    // ✅ 8) Suspicious Sentences 저장 (bulk insert)
    if (ragSuspicious.length > 0) {
      const suspiciousRows = ragSuspicious.map(sentence => ({
        transcript_id: transcript.id,
        sentence: sentence,
      }));

      await VoiceSuspiciousSentence.bulkCreate(suspiciousRows);
    }

    return res.json({
      ok: true,
      s3Url,
      analysis,
      transcript,
      suspicious_sentences: ragSuspicious, // 응답에 포함
      stt_raw: sttRaw,
    });
  } catch (e) {
    console.error('[STT test error]', e?.response?.data || e);
    return res.status(502).json({
      ok: false,
      message: 'STT 서버/RAG 호출 실패',
      detail: e?.response?.data || e?.message || String(e),
    });
  }
};
