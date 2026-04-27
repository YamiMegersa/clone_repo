const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

// 1. Import individual model definitions
// models/index.js

// Destructure the files that export multiple models
const { Province, Municipality, Ward } = require('./Geography');
const { Allocation, Report, ReportImage } = require('./Report');
const { Resident, Subscription } = require('./Resident');
const Notification = require('./Notification')(sequelize, DataTypes);

// Import single-model files
const MunicipalWorker = require('./Worker');
const Grievance = require('./Grievance');

// ... keep your association logic (.hasMany / .belongsTo) here ...

// 2. Define Relationship Logic (Associations)

// Geographic Hierarchy
Province.hasMany(Municipality, { foreignKey: 'ProvinceID' }); // [cite: 9]
Municipality.belongsTo(Province, { foreignKey: 'ProvinceID' });

Municipality.hasMany(Ward, { foreignKey: 'MunicipalityID' }); // [cite: 5, 6]
Ward.belongsTo(Municipality, { foreignKey: 'MunicipalityID' });

// Reporting & Wards
Ward.hasMany(Report, { foreignKey: 'WardID' }); // [cite: 3, 4, 10]
Report.belongsTo(Ward, { foreignKey: 'WardID' });

Resident.hasMany(Report, { foreignKey: 'ResidentID' }); // [cite: 3, 8, 11]
Report.belongsTo(Resident, { foreignKey: 'ResidentID' });

Report.hasMany(ReportImage, { foreignKey: 'ReportID' }); // [cite: 3, 22, 23]
ReportImage.belongsTo(Report, { foreignKey: 'ReportID' });

// Many-to-Many: Subscriptions (Residents <-> Wards)
Resident.belongsToMany(Ward, { through: Subscription, foreignKey: 'ResidentID' }); // [cite: 12, 13]
Ward.belongsToMany(Resident, { through: Subscription, foreignKey: 'WardID' }); // [cite: 12, 14]

// Many-to-Many: Allocations (Reports <-> Workers)
Report.belongsToMany(MunicipalWorker, { through: Allocation, foreignKey: 'ReportID' }); // [cite: 15, 17]
MunicipalWorker.belongsToMany(Report, { through: Allocation, foreignKey: 'EmployeeID' }); // [cite: 7, 15, 16]

// Support / Grievances (Nullable Foreign Keys)
Resident.hasMany(Grievance, { foreignKey: 'ResidentID' }); // [cite: 8, 20, 18]
Grievance.belongsTo(Resident, { foreignKey: 'ResidentID' });

MunicipalWorker.hasMany(Grievance, { foreignKey: 'MunicipalID' }); // [cite: 7, 20, 21]
Grievance.belongsTo(MunicipalWorker, { foreignKey: 'MunicipalID' });

const MockWard = require('./MockWard')(sequelize);
const MockReport = require('./MockReport')(sequelize);

// index.js

// Define the relationship WITHOUT strict database-level constraints
MockWard.hasMany(MockReport, {
    foreignKey: 'WardID',
    sourceKey: 'WardID',
    constraints: false // 🚨 Tells SQL not to panic about the missing composite key
});

MockReport.belongsTo(MockWard, {
    foreignKey: 'WardID',
    targetKey: 'WardID',
    constraints: false // 🚨 Tells SQL not to panic about the missing composite key
});

Municipality.hasMany(MockReport, { foreignKey: 'MunicipalityID' });
MockReport.belongsTo(Municipality, { foreignKey: 'MunicipalityID' });

// 3. Export everything
module.exports = {
    sequelize,
    Province,
    Municipality,
    Ward,
    Resident,
    MunicipalWorker,
    Report,
    ReportImage,
    Allocation,
    Subscription,
    Grievance,
    MockWard,
    MockReport,
    Notification
};