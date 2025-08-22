import axios from 'axios';

const RAG_URL = process.env.RAG_URL; 
const RAG_API_KEY = process.env.RAG_API_KEY;

export async function analyzeWithRag(text) {
  if (!RAG_URL || !RAG_API_KEY) {
    throw new Error('RAG_URL / RAG_API_KEY가 .env에 설정되어야 합니다.');
  }

  const { data } = await axios.post(
    RAG_URL,
    { text },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': RAG_API_KEY,
      },
      timeout: 60_000,
    }
  );

  return data; // { result: "...", sources: [...] }
}
