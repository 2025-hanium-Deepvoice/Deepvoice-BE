import { z } from 'zod';
import { VoiceTranscriptResponseDto } from './VoiceTranscriptResponseDto.js';

export const VoiceTranscriptListResponseDto = z.object({
  items: z.array(VoiceTranscriptResponseDto),
  meta: z.object({
    total: z.number(),
    skip: z.number(),
    take: z.number(),
  }),
});

export function toVoiceTranscriptListResponse(items, total, skip, take) {
  return VoiceTranscriptListResponseDto.parse({
    items, meta: { total, skip, take },
  });
}
