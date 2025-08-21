// index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';  
import { sequelize, initModels } from './src/db/sequelize.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import transcriptRoutes from './routes/transcriptRoutes.js';
import userRoutes from './routes/userRoutes.js';
import sttRoutes from './routes/sttRoutes.js';

async function bootstrap() {
  await sequelize.authenticate();
  await initModels();
  await sequelize.sync({ alter: true });

  const app = express();

  // ✅ CORS 허용 (프론트엔드 주소만)
  app.use(
    cors({
      origin: [
        'http://localhost:3000'   // 로컬 개발용
      ],
      credentials: true,
    })
  );

  app.use(express.json());

  // 라우트 등록
  app.use('/auth', authRoutes);
  app.use('/profiles', profileRoutes);
  app.use('/analyses', analysisRoutes);
  app.use('/transcripts', transcriptRoutes);
  app.use('/users', userRoutes);
  app.use('/stt', sttRoutes);
  app.use('/uploads', express.static('uploads'));

  // Health check
  app.get('/health', async (_, res) => {
    try {
      await sequelize.query('SELECT 1');
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false });
    }
  });

  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, () =>
    console.log(`API running on http://localhost:${port}`)
  );

  // 종료 시 커넥션 정리
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, async () => {
      server.close(async () => {
        await sequelize.close();
        process.exit(0);
      });
    });
  }
}

bootstrap().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
