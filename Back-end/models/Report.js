const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Report = sequelize.define('Report', {
    ReportID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    WardID: { type: DataTypes.INTEGER, references: { model: Ward, key: 'WardID' } }, // [cite: 10]
    ResidentID: { type: DataTypes.INTEGER, references: { model: Resident, key: 'ResidentID' } }, // [cite: 11]
    Lattitude: { type: DataTypes.FLOAT },
    Longitude: { type: DataTypes.FLOAT },
    Status: { type: DataTypes.STRING },
    Date: { type: DataTypes.DATE },
    DateFulfilled: { type: DataTypes.DATE, allowNull: true }, // (N) denotes Nullable [cite: 3]
    Type: { type: DataTypes.STRING },
    Progress: { type: DataTypes.STRING },
    Frequency: { type: DataTypes.STRING }
}, { tableName: 'Reports', timestamps: false });

// ReportImages Model [cite: 1, 22]
const ReportImage = sequelize.define('ReportImage', {
    ImageID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ReportID: { type: DataTypes.INTEGER, references: { model: Report, key: 'ReportID' } }, // [cite: 23]
    Type: { type: DataTypes.STRING },
    Image: { type: DataTypes.BLOB } // or STRING if storing URL
}, { tableName: 'ReportImages', timestamps: false });

const Allocation = sequelize.define('Allocation', {
    AllocationID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ReportID: { type: DataTypes.INTEGER, references: { model: Report, key: 'ReportID' } }, // [cite: 17]
    EmployeeID: { type: DataTypes.INTEGER, references: { model: MunicipalWorker, key: 'EmployeeID' } } // [cite: 16]
}, { tableName: 'Allocation', timestamps: false });