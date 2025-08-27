// controllers/profileController.js
import { sequelize } from '../src/db/sequelize.js';
import Profile from '../models/Profile.js';
import Voice from '../models/Voice.js';
import { parseProfileCreateDto } from '../dto/ProfileCreateDto.js';
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import os from "os";
import { s3, S3_BUCKET, buildPublicUrl } from '../s3.js';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import path from 'path';
import { lookup as mimeLookup } from 'mime-types';
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath);

async function convertToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-ar 16000", // 16kHz 샘플레이트
        "-ac 1",     // 모노 채널
        "-f wav"     // wav 형식 강제
      ])
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .save(outputPath);
  });
}

export const createProfile = async (req, res) => {
  let uploadedKeys = [];

  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { name, relation } = parseProfileCreateDto(req.body);

    if (!req.files?.voice?.[0]) {
      return res.status(400).json({ message: "voice 파일이 필요합니다." });
    }

    // ✅ DB 트랜잭션 : Profile + Voice 저장
    const result = await sequelize.transaction(async (t) => {
      const profile = await Profile.create(
        { name, relation, user_id: userId },
        { transaction: t }
      );

      const voiceFile = req.files.voice[0];
      const voiceExt = path.extname(voiceFile.originalname || "").toLowerCase();
      const voiceContentType =
        voiceFile.mimetype?.startsWith("audio/")
          ? voiceFile.mimetype
          : mimeLookup(voiceExt) || "application/octet-stream";

      const voiceKey = `uploads/voices/${profile.id}/${Date.now()}_${crypto.randomUUID()}${voiceExt}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: voiceKey,
          Body: voiceFile.buffer,
          ContentType: voiceContentType,
          Metadata: { profileId: String(profile.id), userId: String(userId) },
        })
      );

      uploadedKeys.push(voiceKey);
      const voiceUrl = buildPublicUrl(voiceKey);

      const voice = await Voice.create(
        { file_path: voiceUrl, profile_id: profile.id },
        { transaction: t }
      );

      if (req.files?.profile_image?.[0]) {
        const imageFile = req.files.profile_image[0];
        const imageExt = path.extname(imageFile.originalname || "").toLowerCase();
        const imageContentType =
          imageFile.mimetype?.startsWith("image/")
            ? imageFile.mimetype
            : mimeLookup(imageExt) || "application/octet-stream";

        const imageKey = `uploads/profiles/${profile.id}/${Date.now()}_${crypto.randomUUID()}${imageExt}`;

        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: imageKey,
            Body: imageFile.buffer,
            ContentType: imageContentType,
            Metadata: { profileId: String(profile.id), userId: String(userId) },
          })
        );

        uploadedKeys.push(imageKey);
        const imageUrl = buildPublicUrl(imageKey);

        profile.profile_image_url = imageUrl;
        await profile.save({ transaction: t });
      }

      return { profile, voice, voiceFile };
    });

    // XGBoost 학습 API 호출
    try {
      const { voiceFile } = result;
      const tempDir = os.tmpdir();
      const tempPath = path.join(
        tempDir,
        `${Date.now()}_${voiceFile.originalname || "voice.wav"}`
      );
      fs.writeFileSync(tempPath, voiceFile.buffer);

      const wavPath = tempPath.replace(path.extname(tempPath), ".wav");
      await convertToWav(tempPath, wavPath);

      const formData = new FormData();
      formData.append("file", fs.createReadStream(wavPath), {
        filename: "voice.wav",
        contentType: "audio/wav",
      });
      formData.append("label", "real");

      await axios.post(`${process.env.XGB_API_URL}/train`, formData, {
        headers: formData.getHeaders(),
      });

      console.log("✅ XGBoost 모델에 wav 학습 데이터 전송 성공");

      // 파일 정리
      fs.unlinkSync(tempPath);
      fs.unlinkSync(wavPath);

    } catch (err) {
      console.error(
        "⚠️ XGBoost 모델 학습 API 호출 실패:",
        err.response?.data || err.message
      );
    }


    // ✅ 응답 DTO
    const dto = {
      id: result.profile.id,
      name: result.profile.name,
      relation: result.profile.relation,
      profile_image_url: result.profile.profile_image_url,
      voice: {
        id: result.voice.id,
        file_path: result.voice.file_path,
      },
    };

    return res.status(201).json(dto);
  } catch (e) {
    console.error(e);

    for (const key of uploadedKeys) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
      } catch (delErr) {
        console.error("S3 정리 실패:", delErr);
      }
    }

    return res
      .status(400)
      .json({ message: e.message || "Invalid request" });
  }
};

// GET /profiles (내 프로필 목록)
export const listProfiles = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const profiles = await Profile.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Voice,
          as: 'voices',
          attributes: ['id', 'file_path'],
        },
      ],
      order: [['id', 'DESC']],
    });

    const result = profiles.map((p) => ({
      id: p.id,
      name: p.name,
      relation: p.relation,
      profile_image_url: p.profile_image_url,
      voices: p.voices?.map((v) => ({
        id: v.id,
        file_path: v.file_path,
      })) ?? [],
    }));

    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(400).json({ message: e.message || 'Invalid request' });
  }
};
