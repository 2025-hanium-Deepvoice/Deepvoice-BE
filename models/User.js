import { DataTypes, Model } from 'sequelize';

export default class User extends Model {
  static initialize(sequelize) {
    User.init(
      {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: true },
        name: { type: DataTypes.STRING, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
      },
      {
        sequelize,
        tableName: 'user',
        modelName: 'User',
        timestamps: false, // created_at만 사용
      }
    );
  }

  static associate({ Profile, VoiceAnalysis }) {
    this.hasMany(Profile, { foreignKey: 'user_id', sourceKey: 'id', as: 'profiles' });
    this.hasMany(VoiceAnalysis, { foreignKey: 'user_id', sourceKey: 'id', as: 'voiceAnalyses' });
  }
}
