import { z } from 'zod';

export const TranscriptQueryDto = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
  voice_id: z.coerce.number().int().positive().optional(), 
});

export function parseTranscriptQuery(query) {
  const parsed = TranscriptQueryDto.safeParse(query);
  if (!parsed.success) {
    const msg = parsed.error.errors.map(e => e.message).join(', ');
    throw new Error(msg);
  }
  return parsed.data;
}
