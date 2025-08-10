import 'dotenv/config';
import express from 'express';
import sequelize from './db.js';
import User from './models/User.js';

const app = express();
app.use(express.json());

// DB 연결 & 동기화
await sequelize.authenticate();
await sequelize.sync(); // 기존 테이블 없으면 생성

// 사용자 생성
app.post('/users', async (req, res) => {
  try {
    const { email, name } = req.body;
    const user = await User.create({ email, name });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 사용자 조회
app.get('/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

app.listen(process.env.PORT, () =>
  console.log(`API running on http://localhost:${process.env.PORT}`)
);
