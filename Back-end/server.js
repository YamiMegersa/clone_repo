const express = require('express');
const cors=require('cors');
const sequelize = require('./config/db');
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
sequelize.authenticate()
    .then(() => console.log('Connected to Azure MySQL!'))
    .catch(err => console.error('Unable to connect:', err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log('Server running on ${PORT}');
});