// dto/responses/VoiceAnalysisListResponseDto.js
import { z } from 'zod';
import { VoiceAnalysisResponseDto } from './VoiceAnalysisResponseDto.js';

export const VoiceAnalysisListResponseDto = z.object({
  items: z.array(VoiceAnalysisResponseDto),
  meta: z.object({
    total: z.number(),
    skip: z.number(),
    take: z.number(),
  }),
});

export function toVoiceAnalysisListResponse(items, total, skip, take) {
  return VoiceAnalysisListResponseDto.parse({
    items, meta: { total, skip, take },
  });
}
