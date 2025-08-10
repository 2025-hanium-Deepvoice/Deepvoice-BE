import { z } from 'zod';

export const UserResponseDto = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.string(),
});

export function toUserResponse(user) {
  return UserResponseDto.parse({
    id: Number(user.id),
    name: user.name,
    user_id: user.user_id,
  });
}
