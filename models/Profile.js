import { DataTypes, Model } from 'sequelize';

export default class Profile extends Model {
  static initialize(sequelize) {
    Profile.init(
      {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, allowNull: true },
        relation: { type: DataTypes.STRING, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
        user_id: { type: DataTypes.BIGINT, allowNull: false },
      },
      {
        sequelize,
        tableName: 'profile',
        modelName: 'Profile',
        timestamps: false,
      }
    );
  }

  static associate({ User, Voice }) {
    this.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id', as: 'user' });
    this.hasMany(Voice, { foreignKey: 'profile_id', sourceKey: 'id', as: 'voices' });
  }
}
