const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Report = sequelize.define('Report', {
    ReportID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    WardID: { type: DataTypes.INTEGER },
    ResidentID: { type: DataTypes.INTEGER },
    Lattitude: { type: DataTypes.FLOAT },
    Longitude: { type: DataTypes.FLOAT },
    Status: { type: DataTypes.STRING },
    Date: { type: DataTypes.DATE },
    DateFulfilled: { type: DataTypes.DATE, allowNull: true },
    Type: { type: DataTypes.STRING },
    Progress: { type: DataTypes.STRING },
    Frequency: { type: DataTypes.STRING }
}, { tableName: 'Reports', timestamps: false });

const ReportImage = sequelize.define('ReportImage', {
    ImageID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ReportID: { type: DataTypes.INTEGER },
    Type: { type: DataTypes.STRING },
    Image: { type: DataTypes.BLOB }
}, { tableName: 'ReportImages', timestamps: false });

const Allocation = sequelize.define('Allocation', {
    AllocationID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ReportID: { type: DataTypes.INTEGER },
    EmployeeID: { type: DataTypes.INTEGER }
}, { tableName: 'Allocation', timestamps: false });

module.exports = { Report, ReportImage, Allocation };