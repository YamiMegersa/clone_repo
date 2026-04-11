require('dotenv').config();
const path = require('path');
const express = require('express');
const cors=require('cors');
const sequelize = require('./config/db');
const models=require('./models'); // Import models and associations

// Google auth stuff
const { OAuth2Client } = require('google-auth-library');
const { Resident } = require('./models/Resident');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const app = express();
app.use(express.json());

//Middleware
app.use(cors());  //Allows our local front-end to talk to Azure
app.use(express.json());  //Allows the API to understand JSON Data



// Use 'path.resolve' to create an absolute path from your computer's root
const frontendPath = path.resolve(__dirname, '..', 'Front-end');

// Standard middleware for CSS/JS files
app.use(express.static(frontendPath));

// The "Home" route
app.get('/', (req, res) => {
    // CHANGE THESE to match your sidebar exactly (Case Sensitive!)
    // If your folder is 'login', change 'Login' to 'login'
    res.sendFile(path.join(frontendPath, 'Login', 'Login.html'));
});

// This handles the main entry point
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Front-end/Login/Login.html'));
});

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
//app.get('/', (req, res) => {
//    res.send('Welcome to LUCS API!');
//});

// Link your routes folder to a specific URL path
app.use('/api/residents', residentRoutes);

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


