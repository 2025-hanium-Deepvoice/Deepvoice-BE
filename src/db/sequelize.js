// src/db/sequelize.js
import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(
  process.env.DB_NAME,     // 예: mydb
  process.env.DB_USER,     // 예: app
  process.env.DB_PASS,     // 예: apppass
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
  }
);

export async function initModels() {
  // 루트/models 에서 동적 import
  const { default: User }            = await import('../../models/User.js');
  const { default: Profile }         = await import('../../models/Profile.js');
  const { default: Voice }           = await import('../../models/Voice.js');
  const { default: VoiceTranscript } = await import('../../models/VoiceTranscript.js');
  const { default: VoiceAnalysis }   = await import('../../models/VoiceAnalysis.js');

  // 1) init
  User.initialize(sequelize);
  Profile.initialize(sequelize);
  Voice.initialize(sequelize);
  VoiceTranscript.initialize(sequelize);
  VoiceAnalysis.initialize(sequelize);

// 2) associate
User.associate?.({ Profile, VoiceAnalysis });
Profile.associate?.({ User, Voice });
Voice.associate?.({ Profile });   // ✅ Transcript 관계 제거
VoiceTranscript.associate?.({ VoiceAnalysis }); // ✅ Voice 대신 VoiceAnalysis
VoiceAnalysis.associate?.({ User, Profile, VoiceTranscript }); // ✅ Transcript까지 연결

}
