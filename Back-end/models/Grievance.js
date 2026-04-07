const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Grievance = sequelize.define('Grievance', {
    GrievanceID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ResidentID: { type: DataTypes.INTEGER, allowNull: true, references: { model: Resident, key: 'ResidentID' } }, // [cite: 18]
    MunicipalID: { type: DataTypes.INTEGER, allowNull: true, references: { model: MunicipalWorker, key: 'EmployeeID' } }, // [cite: 21]
    Resolved: { type: DataTypes.BOOLEAN, defaultValue: false },
    Attachment: { type: DataTypes.STRING },
    Description: { type: DataTypes.TEXT },
    Date: { type: DataTypes.DATE }
}, { tableName: 'Grievance', timestamps: false });