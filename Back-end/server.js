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
app.use('/api/residents', residentRoutes);

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