import { sequelize } from '../src/db/sequelize.js';
import Profile from '../models/Profile.js';
import Voice from '../models/Voice.js';
import { parseProfileCreateDto } from '../dto/ProfileCreateDto.js';
import { toProfileResponse } from '../dto/responses/ProfileResponseDto.js';

export const createProfile = async (req, res) => {
  try {
    // JWT 미들웨어에서 셋: req.user.id
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // text 필드 검증
    const { name, relation } = parseProfileCreateDto(req.body);

    // 파일 존재 확인
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'voice 파일이 필요합니다.' });
    }

    // 트랜잭션: 프로필 생성 -> 음성 생성
    const result = await sequelize.transaction(async (t) => {
      const profile = await Profile.create(
        { name, relation, user_id: userId },
        { transaction: t }
      );
      const voice = await Voice.create(
        { file_path: `uploads/voices/${req.file.filename}`, profile_id: profile.id },
        { transaction: t }
      );
      return { profile, voice };
    });

    return res.status(201).json(toProfileResponse(result.profile, result.voice));
  } catch (e) {
    console.error(e);
    return res.status(400).json({ message: e.message || 'Invalid request' });
  }
};
