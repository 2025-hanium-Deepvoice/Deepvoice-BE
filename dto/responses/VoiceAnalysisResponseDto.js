// dto/responses/VoiceAnalysisResponseDto.js
import { z } from 'zod';

export const VoiceAnalysisResponseDto = z.object({
  id: z.number(),
  file_name: z.string().nullable().optional(),
  file_path: z.string().nullable().optional(),
  duration_seconds: z.number().nullable().optional(),
  is_phishing: z.boolean(),
  confidence: z.number().nullable().optional(),
  detected_at: z.string(), // ISO
});

export function toVoiceAnalysisResponse(a) {
  return VoiceAnalysisResponseDto.parse({
    id: Number(a.id),
    file_name: a.file_name ?? null,
    file_path: a.file_path ?? null,
    duration_seconds: a.duration_seconds ?? null,
    is_phishing: !!a.is_phishing,
    confidence: a.confidence ?? null,
    detected_at: a.detected_at?.toISOString?.() ?? String(a.detected_at),
  });
}
