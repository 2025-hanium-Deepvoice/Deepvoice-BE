import { DataTypes, Model } from 'sequelize';

export default class VoiceSuspiciousSentence extends Model {
  static initialize(sequelize) {
    VoiceSuspiciousSentence.init(
      {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        transcript_id: { type: DataTypes.BIGINT, allowNull: false },
        sentence: { type: DataTypes.TEXT, allowNull: false },
      },
      {
        sequelize,
        tableName: 'voice_suspicious_sentence',
        modelName: 'VoiceSuspiciousSentence',
        timestamps: false,
      }
    );
  }

  static associate({ VoiceTranscript }) {
    this.belongsTo(VoiceTranscript, {
      foreignKey: 'transcript_id',
      targetKey: 'id',
      as: 'transcript',
      onDelete: 'CASCADE',
    });
  }
}
