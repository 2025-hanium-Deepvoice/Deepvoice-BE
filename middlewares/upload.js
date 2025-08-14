import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const uploadDir = path.resolve('uploads/voices');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // 허용할 오디오 MIME 타입
  const okTypes = [
    'audio/mpeg',     // mp3
    'audio/wav',      // wav
    'audio/webm',     // webm
    'audio/x-wav',    // wav (다른 mime)
    'audio/mp4'       // m4a (iPhone, Safari 업로드)
  ];

  if (!okTypes.includes(file.mimetype)) {
    return cb(new Error(`지원하지 않는 오디오 형식입니다. (mimetype: ${file.mimetype})`), false);
  }

  cb(null, true);
};

export const uploadVoice = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB 등 필요에 맞게
}).single('voice'); // form-data 필드명: voice
