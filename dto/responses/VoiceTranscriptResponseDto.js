import { z } from 'zod';

export const VoiceTranscriptResponseDto = z.object({
  id: z.number(),
  transcript: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  guidance: z.string().nullable().optional(),
  voice_id: z.number(),
});

export function toVoiceTranscriptResponse(t) {
  return VoiceTranscriptResponseDto.parse({
    id: Number(t.id),
    transcript: t.transcript ?? null,
    type: t.type ?? null,
    guidance: t.guidance ?? null,
    voice_id: Number(t.voice_id),
  });
}
