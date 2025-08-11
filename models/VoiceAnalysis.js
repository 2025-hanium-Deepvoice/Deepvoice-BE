import { DataTypes, Model } from 'sequelize';

export default class VoiceAnalysis extends Model {
  static initialize(sequelize) {
    VoiceAnalysis.init(
      {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        file_path: { type: DataTypes.STRING, allowNull: true },
        is_phishing: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, 
        confidence: { type: DataTypes.FLOAT, allowNull: true },
        detected_at: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
        user_id: { type: DataTypes.BIGINT, allowNull: false },
        duration_seconds: { type: DataTypes.INTEGER, allowNull: true },
      },
      {
        sequelize,
        tableName: 'voice_analysis',
        modelName: 'VoiceAnalysis',
        timestamps: false,
      }
    );
  }

  static associate({ User }) {
    this.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id', as: 'user' });
  }
}
