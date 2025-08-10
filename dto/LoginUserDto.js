import { z } from 'zod';

// 로그인 DTO
export const LoginUserDto = z.object({
  user_id: z.string().min(4, '아이디는 4자 이상이어야 합니다.'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다.'),
});

export function parseLoginUserDto(body) {
  const parsed = LoginUserDto.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => e.message);
    throw new Error(errors.join(', '));
  }
  return parsed.data;
}