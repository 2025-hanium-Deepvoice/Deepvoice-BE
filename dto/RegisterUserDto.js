import { z } from 'zod';

// 회원가입 DTO (zod로 검증)
export const RegisterUserDto = z.object({
  name: z.string().min(1, '이름은 필수입니다.'),
  user_id: z.string().min(4, '아이디는 4자 이상이어야 합니다.'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다.'),
});

// 헬퍼 함수
export function parseRegisterUserDto(body) {
  const parsed = RegisterUserDto.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => e.message);
    throw new Error(errors.join(', '));
  }
  return parsed.data;
}
