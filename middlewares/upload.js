import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const uploadDir = path.resolve('uploads/voices');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const base = crypto.randomBytes(6).toString('hex');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

function fileFilter(_req, file, cb) {

  if (file.mimetype?.startsWith('audio/')) return cb(null, true);
  cb(new Error('지원하지 않는 오디오 형식입니다.'), false);
}

export const uploadVoice = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
}).single('voice');
