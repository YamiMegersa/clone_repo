const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Municipal Workers Model [cite: 1, 7]
const MunicipalWorker = sequelize.define('MunicipalWorker', {
    EmployeeID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false },
    Cell: { type: DataTypes.STRING },
    Email: { type: DataTypes.STRING },
    FirstName: { type: DataTypes.STRING },
    LastName: { type: DataTypes.STRING },
    Blacklisted: { type: DataTypes.BOOLEAN, defaultValue: false },
    Validated: { type: DataTypes.BOOLEAN, defaultValue: false },
    ProfilePicture: { type: DataTypes.BLOB } // Assuming URL or Path
}, { tableName: 'MunicipalWorkers', timestamps: false });
module.exports=MunicipalWorker;