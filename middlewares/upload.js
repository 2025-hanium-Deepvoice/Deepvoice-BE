import multer from 'multer';

const storage = multer.memoryStorage();

const audioTypes = [
  'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/x-wav', 'audio/mp4'
];

const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if ([...audioTypes, ...imageTypes].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`지원하지 않는 파일 형식입니다. (mimetype: ${file.mimetype})`), false);
  }
};

// ✅ STT 용 (음성만)
export const uploadVoice = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (audioTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('지원하지 않는 오디오 형식입니다.'), false);
  },
  limits: { fileSize: 50 * 1024 * 1024 }
}).single('voice');

// ✅ 프로필 등록용 (음성 + 프로필 사진)
export const uploadProfile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
}).fields([
  { name: 'voice', maxCount: 1 },
  { name: 'profile_image', maxCount: 1 }
]);
