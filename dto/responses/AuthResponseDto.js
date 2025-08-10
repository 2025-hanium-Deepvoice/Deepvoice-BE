import { z } from 'zod';

export const UserResponseDto = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.string(),
});

export const AuthResponseDto = z.object({
  user: UserResponseDto,
  access_token: z.string(),
});

export function toAuthResponse(user, accessToken) {
  return AuthResponseDto.parse({
    user: {
      id: Number(user.id),
      name: user.name,
      user_id: user.user_id,
    },
    access_token: accessToken,
  });
}
