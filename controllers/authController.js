import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 요청 DTO 
import { parseRegisterUserDto } from '../dto/RegisterUserDto.js';
import { parseLoginUserDto }    from '../dto/LoginUserDto.js';

// 응답 DTO
import { toRegisterResponse } from '../dto/responses/RegisterResponseDto.js';
import { toAuthResponse }     from '../dto/responses/AuthResponseDto.js';

const ACCESS_TTL = process.env.JWT_EXPIRES_IN || '30m';
const signAccess = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });

export const register = async (req, res) => {
  try {
    const { name, user_id, password } = parseRegisterUserDto(req.body);

    const exists = await User.findOne({ where: { user_id } });
    if (exists) return res.status(409).json({ message: '이미 사용 중인 아이디입니다.' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, user_id, password: hash });

    // 회원가입 응답: 토큰 없이 유저 정보만
    return res.status(201).json(toRegisterResponse(user));
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Invalid request' });
  }
};

export const login = async (req, res) => {
  try {
    const { user_id, password } = parseLoginUserDto(req.body);

    const user = await User.findOne({ where: { user_id } });
    if (!user) return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });

    const token = signAccess(user.id);

    // 로그인 응답: 유저 + access_token (expires_in 제거)
    return res.json(toAuthResponse(user, token));
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Invalid request' });
  }
};
