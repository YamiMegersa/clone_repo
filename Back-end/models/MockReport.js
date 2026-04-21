const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MockReport = sequelize.define('MockReport', {
        ReportID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        WardID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        MunicipalityID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        ResidentID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        Latitude: {
            type: DataTypes.DECIMAL(9, 6),
            allowNull: false
        },
        Longitude: {
            type: DataTypes.DECIMAL(9, 6),
            allowNull: false
        },
        Progress: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'Pending Allocation'
        },
        Type: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        Description: { // --- NEW FIELD ---
            type: DataTypes.TEXT,
            allowNull: true
        },
        Frequency: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        CreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        AssignedAt: { // --- NEW FIELD ---
            type: DataTypes.DATE,
            allowNull: true
        },
        DateFulfilled: {
            type: DataTypes.DATE,
            allowNull: true
        },
        Priority: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        tableName: 'MockReports',
        timestamps: false
    });

    return MockReport;
};