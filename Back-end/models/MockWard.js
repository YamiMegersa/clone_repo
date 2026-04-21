const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MockWard = sequelize.define('MockWard', {
        WardID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        MunicipalityID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        WardCouncillor: {
            type: DataTypes.STRING(150),
            allowNull: true
        }
    }, {
        tableName: 'MockWard',
        timestamps: false // Disables automatic createdAt/updatedAt columns
    });

    return MockWard;
};