import { DataTypes, Model } from 'sequelize';

export default class VoiceTranscript extends Model {
  static initialize(sequelize) {
    VoiceTranscript.init(
      {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        transcript: { type: DataTypes.TEXT, allowNull: true },
        type: { type: DataTypes.STRING, allowNull: true },
        suspicious_sentences: { type: DataTypes.TEXT, allowNull: true }, 
        guidance: { type: DataTypes.TEXT, allowNull: true },
        voice_id: { type: DataTypes.BIGINT, allowNull: false },
      },
      {
        sequelize,
        tableName: 'voice_transcript',
        modelName: 'VoiceTranscript',
        timestamps: false,
      }
    );
  }

  static associate({ VoiceAnalysis }) {
    this.belongsTo(VoiceAnalysis, { foreignKey: 'voice_id', targetKey: 'id', as: 'analysis' });
  }
}
