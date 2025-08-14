import { S3Client } from '@aws-sdk/client-s3';

export const S3_BUCKET = process.env.S3_BUCKET || 'deepvoice-hanium';

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 퍼블릭 URL 생성 (S3 기본 엔드포인트 기준)
export function buildPublicUrl(key) {
  return `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
