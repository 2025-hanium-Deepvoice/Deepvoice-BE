import { z } from 'zod';

export const ProfileCreateDto = z.object({
  name: z.string().min(1, 'name은 필수입니다.'),
  relation: z.string().min(1, 'relation은 필수입니다.'),
});

export function parseProfileCreateDto(body) {
  const parsed = ProfileCreateDto.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map(e => e.message).join(', ');
    throw new Error(msg);
  }
  return parsed.data;
}
