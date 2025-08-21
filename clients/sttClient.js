import axios from 'axios';
import FormData from 'form-data';

const STT_URL = process.env.STT_URL;
const STT_API_KEY = process.env.STT_API_KEY;

/**
 * 메모리 버퍼를 STT 서버로 전송
 * @param {Buffer} buffer
 * @param {string} filename - 예: 'sample.m4a'
 * @param {string} mimetype - 예: 'audio/mp4'
 * @returns {Promise<any>} STT 서버의 원본 응답
 */
export async function speechToTextBuffer(buffer, filename, mimetype) {
  if (!STT_URL || !STT_API_KEY) {
    throw new Error('STT_URL / STT_API_KEY가 .env에 설정되어야 합니다.');
  }

  const form = new FormData();
  // 서버가 요구하는 필드명이 'file'이라고 가정 (다르면 바꿔줘)
  form.append('file', buffer, { filename, contentType: mimetype });

  const headers = {
    ...form.getHeaders(),
    'x-api-key': STT_API_KEY,
  };

  const { data } = await axios.post(STT_URL, form, { headers, timeout: 60_000 });
  return data; // { text: "...", ... } 형태라고 가정
}
