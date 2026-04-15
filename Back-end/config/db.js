const { Sequelize } = require('sequelize');
require('dotenv').config(); // Ensure variables are loaded

const sequelize = new Sequelize(
    process.env.DB_NAME,   // Database name
    process.env.DB_USER,   // Username
    process.env.DB_PASS,   // Password
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql', // Since you're on Lightsail/Linux
        logging: false,    // Clean terminal output
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = sequelize;