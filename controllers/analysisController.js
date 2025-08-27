// controllers/analysisController.js
import VoiceAnalysis from '../models/VoiceAnalysis.js';
import { parseAnalysisQuery } from '../dto/AnalysisQueryDto.js';
import { toVoiceAnalysisResponse } from '../dto/responses/VoiceAnalysisResponseDto.js';
import { toVoiceAnalysisListResponse } from '../dto/responses/VoiceAnalysisListResponseDto.js';
import axios from "axios";
import FormData from "form-data";
import crypto from "crypto";
import { s3, S3_BUCKET, buildPublicUrl } from '../s3.js';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import os from "os";
import path from "path";
import { parseBuffer } from "music-metadata";

ffmpeg.setFfmpegPath(ffmpegPath);

async function convertToWavBuffer(inputBuffer) {
  return new Promise((resolve, reject) => {
    const tmpIn = path.join(os.tmpdir(), `${Date.now()}_in`);
    const tmpOut = path.join(os.tmpdir(), `${Date.now()}_out.wav`);

    fs.writeFileSync(tmpIn, inputBuffer);

    ffmpeg(tmpIn)
      .outputOptions([
        "-ar 16000", // 16kHz
        "-ac 1",     // mono
        "-f wav"     // wav
      ])
      .on("end", () => {
        const outBuf = fs.readFileSync(tmpOut);
        fs.unlinkSync(tmpIn);
        fs.unlinkSync(tmpOut);
        resolve(outBuf);
      })
      .on("error", (err) => reject(err))
      .save(tmpOut);
  });
}

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

export const analyzeVoice = async (req, res) => {
  let uploadedKey = null;

  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!req.file) {
      return res.status(400).json({ message: "음성 파일이 필요합니다." });
    }

    // === 1) ffmpeg 변환: m4a/mp3 → wav ===
    const wavBuffer = await convertToWavBuffer(req.file.buffer);

    // === 2) FastAPI infer 호출 ===
    const formData = new FormData();
    const baseName = path.parse(req.file.originalname).name; // 확장자 제거
    formData.append("file", wavBuffer, {
      filename: `${baseName}.wav`,
      contentType: "audio/wav",
    });

    const inferRes = await axios.post(
      `${process.env.XGB_API_URL}/infer`,
      formData,
      { headers: formData.getHeaders() }
    );

    const { filename, prediction, probability_real, model_key } = inferRes.data;
    const metadata = await parseBuffer(wavBuffer, "audio/wav");
    const duration = Math.round(metadata.format.duration || 0);

    // === 3) S3 업로드 (변환된 WAV 저장) ===
    const voiceKey = `uploads/analyses/${userId}/${Date.now()}_${crypto.randomUUID()}.wav`;

    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: voiceKey,
        Body: wavBuffer,
        ContentType: "audio/wav",
        Metadata: { userId: String(userId) },
      })
    );

    uploadedKey = voiceKey;
    const fileUrl = buildPublicUrl(voiceKey);

    // === 4) DB 저장 ===
    const isPhishing = prediction === "fake";

    // 항상 fake 확률만 저장
    const rawConfidence = 1 - probability_real;

    // 소수점 4자리 내림
    const confidence = Math.floor(rawConfidence * 10000) / 10000;

    const analysis = await VoiceAnalysis.create({
      file_path: fileUrl,      // ✅ 변환된 S3 URL
      confidence,
      detected_at: new Date(),
      user_id: userId,
      is_phishing: isPhishing,
      duration_seconds: duration,
      file_name: filename,     
      profile_id: req.body.profile_id || null,
    });

    // === 5) 응답 ===
    return res.status(201).json({
      ok: true,
      analysis,
      model_key,
    });
  } catch (e) {
    console.error("Voice analysis error:", e.response?.data || e.message);

    if (uploadedKey) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: uploadedKey }));
      } catch (delErr) {
        console.error("S3 정리 실패:", delErr);
      }
    }

    return res.status(500).json({ message: "Analysis failed", detail: e.message });
  }
};
