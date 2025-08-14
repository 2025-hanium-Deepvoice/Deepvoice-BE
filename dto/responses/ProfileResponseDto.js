// dto/responses/ProfileResponseDto.js
import { z } from 'zod';

export const VoiceLiteDto = z.object({
  id: z.number(),
  file_path: z.string(),
  created_at: z.string(),
  url: z.string().url().optional(), 
});

export const ProfileResponseDto = z.object({
  id: z.number(),
  name: z.string(),
  relation: z.string(),
  created_at: z.string(),
  voice: VoiceLiteDto.nullable().optional(),
});

export function toProfileResponse(profile, voice) {
  return ProfileResponseDto.parse({
    id: Number(profile.id),
    name: profile.name,
    relation: profile.relation,
    created_at: profile.created_at?.toISOString?.() ?? String(profile.created_at),
    voice: voice
      ? {
          id: Number(voice.id),
          file_path: voice.file_path,
          created_at: voice.created_at?.toISOString?.() ?? String(voice.created_at),
        }
      : null,
  });
}
