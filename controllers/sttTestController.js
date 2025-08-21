import { speechToTextBuffer } from '../clients/sttClient.js';

export const testStt = async (req, res) => {
  try {
    const f = req.file;
    if (!f || !f.buffer) {
      return res.status(400).json({
        message: 'voice 파일이 필요합니다. (form-data: key=voice, type=File)'
      });
    }

    const sttRaw = await speechToTextBuffer(f.buffer, f.originalname || 'audio.bin', f.mimetype);
    return res.json({
      ok: true,
      text: sttRaw?.text ?? '',
      stt_raw: sttRaw,  // STT 서버 원본 응답
      file: {
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size
      }
    });
  } catch (e) {
    console.error('[STT test error]', e?.response?.data || e);
    return res.status(502).json({
      ok: false,
      message: 'STT 서버 호출 실패',
      detail: e?.response?.data || e?.message || String(e),
    });
  }
};
