const express = require('express');
const router = express.Router();
const { Grievance, Resident, Municipality } = require('../models');

// =======================
// VIEW GRIEVANCES
// =======================

// GET: Fetch ALL grievances in the database
router.get('/', async (req, res) => {
    try {
        const grievances = await Grievance.findAll();
        res.json(grievances);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET: Fetch all grievances submitted by a SPECIFIC Resident (For the Resident's "My Grievances" tab)
router.get('/resident/:residentId', async (req, res) => {
    try {
        const grievances = await Grievance.findAll({
            where: { ResidentID: req.params.residentId }
        });
        res.json(grievances);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET: Fetch all grievances logged against a SPECIFIC Municipality (For the Municipal Admin Dashboard)
router.get('/municipality/:municipalId', async (req, res) => {
    try {
        const grievances = await Grievance.findAll({
            where: { MunicipalID: req.params.municipalId }
        });
        res.json(grievances);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET: Fetch a single grievance by its exact ID
router.get('/:id', async (req, res) => {
    try {
        const grievance = await Grievance.findByPk(req.params.id);
        if (!grievance) {
            return res.status(404).json({ message: 'Grievance not found' });
        }
        res.json(grievance);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// =======================
// MANAGE GRIEVANCES
// =======================

// POST: Submit a new grievance (by a resident)
router.post('/', async (req, res) => {
    try {
        // The frontend will send ResidentID, MunicipalID, Description, Date, and potentially the Attachment
        const newGrievance = await Grievance.create(req.body);
        res.status(201).json({ message: "Grievance submitted successfully!", grievance: newGrievance });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
});

// PUT: Mark a grievance as resolved (When the municipality has officially handled the complaint)
router.put('/:id/resolve', async (req, res) => {
    try {
        const [updatedRows] = await Grievance.update(
            { Resolved: true },
            { where: { GrievanceID: req.params.id } }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ message: 'Grievance not found' });
        }
        res.status(200).json({ message: 'Grievance marked as resolved successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE: Remove a grievance
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Grievance.destroy({ where: { GrievanceID: req.params.id } });
        if (deleted === 0) {
            return res.status(404).json({ message: 'Grievance not found' });
        }
        res.status(200).json({ message: 'Grievance deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;