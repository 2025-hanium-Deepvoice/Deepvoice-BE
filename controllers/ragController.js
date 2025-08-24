import axios from 'axios';

export const testRag = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ ok: false, message: 'text 필드 필요' });
    }

    const ragUrl = process.env.RAG_URL;
    if (!ragUrl) {
      return res.status(500).json({ ok: false, message: 'RAG_URL 환경변수 없음' });
    }

    const { data } = await axios.post(
      ragUrl,
      { text },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.RAG_API_KEY,   // ✅ 여기 추가
        },
      }
    );

    return res.json({ ok: true, rag: data });
  } catch (e) {
    console.warn('[WARN] RAG 호출 실패:', e.message);
    return res.status(502).json({
      ok: false,
      message: 'RAG 서버 호출 실패',
      detail: e.message,
    });
  }
};
