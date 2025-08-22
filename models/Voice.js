import { DataTypes, Model } from 'sequelize';

export default class Voice extends Model {
  static initialize(sequelize) {
    Voice.init(
      {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        file_path: { type: DataTypes.STRING, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
        profile_id: { type: DataTypes.BIGINT, allowNull: false },
      },
      {
        sequelize,
        tableName: 'voice',
        modelName: 'Voice',
        timestamps: false,
      }
    );
  }

  static associate({ Profile, VoiceTranscript }) {
    this.belongsTo(Profile, { foreignKey: 'profile_id', targetKey: 'id', as: 'profile' });  
  }
}
