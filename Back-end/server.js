require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const models = require('./models'); 

const { OAuth2Client } = require('google-auth-library');
const { Resident } = require('./models/Resident');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const app = express();

// --- 1. MIDDLEWARE ---
app.use(cors()); 
app.use(express.json()); 

// --- 2. GOOGLE AUTH API ROUTE ---
// Must be ABOVE static files to avoid 404/HTML redirect errors
app.post('/api/auth/google', async (req, res) => {
    const { idToken } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID, 
        });
        
        const payload = ticket.getPayload();
        const { email, name } = payload;

        const [resident, created] = await Resident.findOrCreate({
            where: { Email: email }, 
            defaults: {
                Username: name || email,
                Email: email,
                CellphoneNumber: `G-${Date.now().toString().slice(-8)}`,
                BlackListed: false
            }
        });

        if (resident.BlackListed) {
            return res.status(403).json({ success: false, message: "Account restricted." });
        }

        res.status(200).json({ 
            success: true, 
            residentId: resident.ResidentID 
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(401).json({ success: false, message: "Invalid Token" });
    }
});

// --- 3. API ROUTES ---
const residentRoutes = require('./routes/residents');
const workerRoutes = require('./routes/workers');
const reportRoutes = require('./routes/reports');
const geographyRoutes = require('./routes/geography');
const allocationRoutes = require('./routes/allocations');
const reportImageRoutes = require('./routes/reportImages');
const grievanceRoutes = require('./routes/grievances');

app.use('/api/workers', workerRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/geography', geographyRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/report-images', reportImageRoutes);
app.use('/api/grievances', grievanceRoutes);

// --- 4. STATIC FILES & FRONTEND ---
const frontendPath = path.resolve(__dirname, '..', 'Front-end');
app.use(express.static(frontendPath));

// Default route to serve Login.html
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'Login', 'Login.html'));
});

// --- 5. DATABASE & START ---
sequelize.sync({ alter: true })
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