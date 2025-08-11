import { z } from 'zod';

export const MyNameResponseDto = z.object({
  id: z.number(),
  user_id: z.string(),
  name: z.string(),
});

export function toMyNameResponse(user) {
  return MyNameResponseDto.parse({
    id: Number(user.id),
    user_id: user.user_id,
    name: user.name,
  });
}
