// dto/queries/AnalysisQueryDto.js
import { z } from 'zod';

export const AnalysisQueryDto = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
  is_phishing: z.enum(['true','false']).optional(),  // 선택 필터
});

export function parseAnalysisQuery(query) {
  const parsed = AnalysisQueryDto.safeParse(query);
  if (!parsed.success) {
    const msg = parsed.error.errors.map(e => e.message).join(', ');
    throw new Error(msg);
  }
  const { skip, take, is_phishing } = parsed.data;
  const whereExtra = {};
  if (is_phishing !== undefined) whereExtra.is_phishing = (is_phishing === 'true');
  return { skip, take, whereExtra };
}
