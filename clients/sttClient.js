import axios from 'axios';
import FormData from 'form-data';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const STT_URL = process.env.STT_URL;
const STT_API_KEY = process.env.STT_API_KEY;

/**
 * 메모리 버퍼를 STT 서버로 전송
 */
export async function speechToTextBuffer(buffer, filename, mimetype) {
  if (!STT_URL || !STT_API_KEY) {
    throw new Error('STT_URL / STT_API_KEY가 .env에 설정되어야 합니다.');
  }

  const form = new FormData();
  form.append('file', buffer, { filename, contentType: mimetype });

  const headers = {
    ...form.getHeaders(),
    'x-api-key': STT_API_KEY,
  };

  const { data } = await axios.post(STT_URL, form, { headers, timeout: 60_000 });
  return data; // { text: "...", ... } 형태라고 가정
}

/**
 * S3 URL 기반으로 STT 호출
 */
export async function speechToTextUrl(fileUrl) {
  // 1) S3에서 파일 다운로드
  const resp = await axios.get(fileUrl, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(resp.data);

  // 2) 기존 Buffer 함수 재활용
  return await speechToTextBuffer(
    buffer,
    path.basename(fileUrl) || `${uuidv4()}.mp3`,
    'audio/mpeg' // 보통 S3는 mp3/m4a니까 default 설정
  );
}
