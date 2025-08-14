// controllers/profileController.js
import { sequelize } from '../src/db/sequelize.js';
import Profile from '../models/Profile.js';
import Voice from '../models/Voice.js';
import { parseProfileCreateDto } from '../dto/ProfileCreateDto.js';
import { toProfileResponse } from '../dto/responses/ProfileResponseDto.js';

import { s3, S3_BUCKET, buildPublicUrl } from '../s3.js';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import path from 'path';
import { lookup as mimeLookup } from 'mime-types';

export const createProfile = async (req, res) => {
  let uploadedKey = null;

  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, relation } = parseProfileCreateDto(req.body);
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'voice 파일이 필요합니다.' });
    }

    const result = await sequelize.transaction(async (t) => {
      const profile = await Profile.create(
        { name, relation, user_id: userId },
        { transaction: t }
      );

      const ext = path.extname(req.file.originalname || '').toLowerCase();
      const contentType =
        req.file.mimetype?.startsWith('audio/')
          ? req.file.mimetype
          : (mimeLookup(ext) || 'application/octet-stream');

      const key = `uploads/voices/${profile.id}/${Date.now()}_${crypto.randomUUID()}${ext}`;

      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: contentType,
        //  퍼블릭로 열 방법 1: 객체 단위 공개
        // ACL: 'public-read',
        //  메타데이터는 ASCII만 허용. 한글 파일명은 넣지 않거나 Base64 등으로 처리.
        Metadata: {
          profileId: String(profile.id),
          userId: String(userId),
        }
      }));

      uploadedKey = key;

      // 여기서 퍼블릭 URL 생성하여 DB에 저장
      const fileUrl = buildPublicUrl(key);

      const voice = await Voice.create(
        { file_path: fileUrl, profile_id: profile.id }, // ← URL 저장
        { transaction: t }
      );

      return { profile, voice };
    });

    const dto = toProfileResponse(result.profile, result.voice);
    return res.status(201).json(dto);
  } catch (e) {
    console.error(e);

    if (uploadedKey) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: uploadedKey }));
      } catch (delErr) {
        console.error('S3 정리 실패:', delErr);
      }
    }

    return res.status(400).json({ message: e.message || 'Invalid request' });
  }
};
