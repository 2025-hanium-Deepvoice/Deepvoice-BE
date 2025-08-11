import User from '../models/User.js';
import { toMyNameResponse } from '../dto/responses/MyNameResponseDto.js';

export const getMyName = async (req, res) => {
  try {
    const userId = req.user?.id;                 // requireAuth에서 세팅
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findByPk(userId, {
      attributes: ['id', 'user_id', 'name']      // 필요한 필드만
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json(toMyNameResponse(user));
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Invalid request' });
  }
};
