import { z } from 'zod';

export const VoiceTranscriptResponseDto = z.object({
  id: z.number(),
  transcript: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  guidance: z.string().nullable().optional(),
  voice_id: z.number(),
});

export function toVoiceTranscriptResponse(model) {
  return {
    id: model.id,
    voice_id: model.voice_id,
    transcript: model.transcript,
    type: model.type,
    guidance: model.guidance,
    similar_cases_summary: model.similar_cases_summary,
    suspicious_sentences: model.suspicious_sentences
      ? model.suspicious_sentences.map(s => ({
        id: s.id,
        sentence: s.sentence,
      }))
      : [],
  };
}
