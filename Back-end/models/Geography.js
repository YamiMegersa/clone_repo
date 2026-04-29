const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Province Model [cite: 1, 2]
const Province = sequelize.define('Province', {
    ProvinceID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ProvinceName: { type: DataTypes.STRING, allowNull: false }
}, { tableName: 'Province', timestamps: false });

// Municipality Model [cite: 1, 6]
const Municipality = sequelize.define('Municipality', {
    MunicipalityID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ProvinceID: { type: DataTypes.INTEGER}, // [cite: 9]
    MunicipalityName: { type: DataTypes.STRING, allowNull: false }
}, { tableName: 'Municipality', timestamps: false });

// Ward Model [cite: 1, 4]
const Ward = sequelize.define('Ward', {
    WardID: { 
        type: DataTypes.INTEGER, 
        primaryKey: true,       // Keep this
        allowNull: false
    },
    MunicipalityID: { 
        type: DataTypes.INTEGER,
        primaryKey: true,       // 🚨 ADD THIS: Tell Sequelize it's a composite key
        allowNull: false
    },
    WardCouncillor: { 
        // We stick with 255 from the main table so we don't accidentally truncate long names
        type: DataTypes.STRING(255), 
        allowNull: true 
    }
}, { 
    tableName: 'Ward', // Or 'Ward', ensure this matches your DB
    timestamps: false 
});

module.exports={Province,Municipality,Ward};