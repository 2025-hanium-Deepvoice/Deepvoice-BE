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
  let uploadedKeys = [];

  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, relation } = parseProfileCreateDto(req.body);

    if (!req.files?.voice?.[0]) {
      return res.status(400).json({ message: 'voice 파일이 필요합니다.' });
    }

    const result = await sequelize.transaction(async (t) => {
      const profile = await Profile.create(
        { name, relation, user_id: userId },
        { transaction: t }
      );

      // 음성 업로드
      const voiceFile = req.files.voice[0];
      const voiceExt = path.extname(voiceFile.originalname || '').toLowerCase();
      const voiceContentType =
        voiceFile.mimetype?.startsWith('audio/')
          ? voiceFile.mimetype
          : (mimeLookup(voiceExt) || 'application/octet-stream');

      const voiceKey = `uploads/voices/${profile.id}/${Date.now()}_${crypto.randomUUID()}${voiceExt}`;

      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: voiceKey,
        Body: voiceFile.buffer,
        ContentType: voiceContentType,
        Metadata: { profileId: String(profile.id), userId: String(userId) }
      }));

      uploadedKeys.push(voiceKey);
      const voiceUrl = buildPublicUrl(voiceKey);

      const voice = await Voice.create(
        { file_path: voiceUrl, profile_id: profile.id },
        { transaction: t }
      );

      // 프로필 이미지 업로드 (옵션)
      if (req.files?.profile_image?.[0]) {
        const imageFile = req.files.profile_image[0];
        const imageExt = path.extname(imageFile.originalname || '').toLowerCase();
        const imageContentType =
          imageFile.mimetype?.startsWith('image/')
            ? imageFile.mimetype
            : (mimeLookup(imageExt) || 'application/octet-stream');

        const imageKey = `uploads/profiles/${profile.id}/${Date.now()}_${crypto.randomUUID()}${imageExt}`;

        await s3.send(new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: imageKey,
          Body: imageFile.buffer,
          ContentType: imageContentType,
          Metadata: { profileId: String(profile.id), userId: String(userId) }
        }));

        uploadedKeys.push(imageKey);
        const imageUrl = buildPublicUrl(imageKey);

        profile.profile_image_url = imageUrl;
        await profile.save({ transaction: t });
      }

      return { profile, voice };
    });

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

    // 실패 시 S3 정리
    for (const key of uploadedKeys) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
      } catch (delErr) {
        console.error('S3 정리 실패:', delErr);
      }
    }

    return res.status(400).json({ message: e.message || 'Invalid request' });
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
      profile_image_url: p.profile_image_url, // ✅ 추가
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
