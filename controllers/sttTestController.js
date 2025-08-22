import { speechToTextBuffer } from '../clients/sttClient.js';
import { s3, S3_BUCKET, buildPublicUrl } from '../s3.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import * as mm from 'music-metadata';
import VoiceAnalysis from '../models/VoiceAnalysis.js';
import VoiceTranscript from '../models/VoiceTranscript.js';
import axios from 'axios';


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
    let ragTypes = [];
    let ragGuidance = null;
    let ragResult = null;  // result 텍스트 저장용

    try {
      const ragResp = await axios.post(
        `${process.env.RAG_URL}`,
        { text: sttRaw?.text ?? '' },
        { headers: { 'x-api-key': process.env.RAG_API_KEY } }
      );

      const ragData = ragResp.data;
      ragResult = ragData?.result ?? null;   // ✅ 최종 답변 텍스트만

      const sources = ragData?.sources || [];

      // type만 추출
      const types = sources.map(s => s.metadata?.type).filter(Boolean);
      ragTypes = [...new Set(types)];

      // guidance는 guide snippet 따로
      const guideSrc = sources.find(s => s.metadata?.type === 'guide');
      ragGuidance = guideSrc?.snippet || null;

    } catch (err) {
      console.warn('[WARN] RAG 호출 실패:', err.message);
    }

    // ✅ 6) VoiceTranscript row 생성
    const transcript = await VoiceTranscript.create({
      voice_id: analysis.id,
      transcript: sttRaw?.text ?? '',
      type: ragTypes.join(','),   // 여러 개면 콤마 구분
      guidance: ragGuidance,
      result: ragResult           // ✅ result 저장
    });


    return res.json({
      ok: true,
      s3Url,
      analysis,
      transcript,
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
