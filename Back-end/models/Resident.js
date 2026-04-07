const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Resident = sequelize.define('Resident', {
  ResidentID: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  Username: { 
    type: DataTypes.STRING(50), 
    allowNull: false 
  },
  Email: { 
    type: DataTypes.STRING(255), 
    unique: true, 
    allowNull: false 
  },
  CellphoneNumber: { 
    type: DataTypes.STRING(15), 
    unique: true, 
    allowNull: false 
  },
  BlackListed: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false 
  }
}, {
  tableName: 'Residents', // Matches your SQL script
  timestamps: false       // Prevents Sequelize from looking for 'createdAt' columns
});

const Subscription = sequelize.define('Subscription', {
    SubscriptionID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    WardID: { type: DataTypes.INTEGER, references: { model: Ward, key: 'WardID' } }, // [cite: 14]
    ResidentID: { type: DataTypes.INTEGER, references: { model: Resident, key: 'ResidentID' } } // [cite: 13]
}, { tableName: 'Subscription', timestamps: false });

module.exports = Resident;