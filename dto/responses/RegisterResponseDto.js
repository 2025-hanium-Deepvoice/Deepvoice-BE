import { z } from 'zod';

export const RegisterResponseDto = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.string(),
});

export function toRegisterResponse(user) {
  return RegisterResponseDto.parse({
    id: Number(user.id),
    name: user.name,
    user_id: user.user_id,
  });
}
