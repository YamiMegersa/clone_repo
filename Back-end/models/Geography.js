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
    WardID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false },
    MunicipalityID: { type: DataTypes.INTEGER }, // [cite: 5]
    WardCouncillor: { type: DataTypes.STRING }
}, { tableName: 'Ward', timestamps: false });

module.exports={Province,Municipality,Ward};