require('dotenv').config();
const path = require('path');
const express = require('express');
const cors=require('cors');
const sequelize = require('./config/db');

// Google auth stuff
const { OAuth2Client } = require('google-auth-library');
const Resident = require('./models/Resident'); 
// The Traffic Cop: Used for your /api/residents endpoints
const residentRoutes = require('./routes/residents');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const app = express();
app.use(express.json());

//Middleware
app.use(cors());  //Allows our local front-end to talk to Azure
app.use(express.json());  //Allows the API to understand JSON Data

// Link your routes folder to a specific URL path
app.use('/api/residents', residentRoutes);

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
app.use('/api/residents', residentRoutes);

//Test Route
//app.get('/', (req, res) => {
//    res.send('Welcome to LUCS API!');
//});

// Database Connection
sequelize.authenticate()
    .then(() => console.log('Connected to Azure MySQL!'))
    .catch(err => console.error('Unable to connect:', err));

const PORT = process.env.PORT || 8080;

//Google auth stuff
app.post('/api/auth/google', async (req, res) => {
    const { idToken } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID, 
        });
        
        const payload = ticket.getPayload();
        const { email, name } = payload;

        // Using findOrCreate with your Resident model
        const [resident, created] = await Resident.findOrCreate({
            where: { Email: email }, 
            defaults: {
                Username: name || email,
                Email: email,
                // CellphoneNumber cannot be null, we provide a placeholder for new Google sign-ups
                CellphoneNumber: `G-${Date.now().toString().slice(-8)}`, //Ensures the placeholder isn't longer than the one in the DB column 
                BlackListed: false
            }
        });

        if (resident.BlackListed) {
            return res.status(403).json({ success: false, message: "Account is restricted." });
        }

        res.status(200).json({ 
            success: true, 
            message: created ? "Resident registered" : "Resident logged in",
            residentId: resident.ResidentID
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(401).json({ success: false, message: "Invalid Token" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
