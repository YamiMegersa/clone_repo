const express = require('express');
const cors=require('cors');
const sequelize = require('./config/db');
const models=require('./models'); // Import models and associations
require('dotenv').config();

const app = express();

//Middleware
app.use(cors());  //Allows our local front-end to talk to Azure
app.use(express.json());  //Allows the API to understand JSON Data

//Import Routes
const residentRoutes = require('./routes/residents');
const workerRoutes=require('./routes/workers');
const reportRoutes=require('./routes/reports');
const geographyRoutes=require('./routes/geography');
const allocationRoutes=require('./routes/allocations');
const reportImageRoutes=require('./routes/reportImages');
const grievanceRoutes=require('./routes/grievances');

//Use Routes
app.use('/api/workers', workerRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/geography', geographyRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/report-images', reportImageRoutes);
app.use('/api/grievances', grievanceRoutes);


//Test Route
app.get('/', (req, res) => {
    res.send('Welcome to LUCS API!');
});

// Database Connection
sequelize.sync({ alter: true }) // <--- This forces Azure to apply autoIncrement rule
    .then(() => {
        console.log('✅ Connected to Azure MySQL and Tables Updated!');
        const PORT = process.env.PORT || 8080;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Unable to connect or sync:', err);
    });


