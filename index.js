// index.js
import 'dotenv/config';
import express from 'express';
import { sequelize, initModels } from './src/db/sequelize.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import transcriptRoutes from './routes/transcriptRoutes.js';

async function bootstrap() {
  await sequelize.authenticate();
  await initModels();
  // 개발 단계: 테이블 없으면 생성 (운영은 마이그레이션 권장)
  await sequelize.sync({ alter: true })

  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);
  app.use('/profiles', profileRoutes);
  app.use('/analyses', analysisRoutes);
  app.use('/transcripts', transcriptRoutes);

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

  // 종료 시 커넥션 종료
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
