// src/db/sequelize.js
import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
  }
);

export async function initModels() {
  // 루트/models 에서 동적 import
  const { default: User }                   = await import('../../models/User.js');
  const { default: Profile }                = await import('../../models/Profile.js');
  const { default: Voice }                  = await import('../../models/Voice.js');
  const { default: VoiceTranscript }        = await import('../../models/VoiceTranscript.js');
  const { default: VoiceAnalysis }          = await import('../../models/VoiceAnalysis.js');
  const { default: VoiceSuspiciousSentence } = await import('../../models/VoiceSuspiciousSentence.js'); // ✅ 추가

  // 1) init
  User.initialize(sequelize);
  Profile.initialize(sequelize);
  Voice.initialize(sequelize);
  VoiceTranscript.initialize(sequelize);
  VoiceAnalysis.initialize(sequelize);
  VoiceSuspiciousSentence.initialize(sequelize); // ✅ 추가

  // 2) associate
  User.associate?.({ Profile, VoiceAnalysis });
  Profile.associate?.({ User, Voice });
  Voice.associate?.({ Profile });
  VoiceTranscript.associate?.({ VoiceAnalysis, VoiceSuspiciousSentence }); // ✅ SuspiciousSentence 연결
  VoiceAnalysis.associate?.({ User, Profile, VoiceTranscript });
  VoiceSuspiciousSentence.associate?.({ VoiceTranscript }); // ✅ Transcript 연결
}
