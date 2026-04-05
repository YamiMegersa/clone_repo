const express = require('express');
const router = express.Router();
const Resident = require('../models/Resident');

// GET: Fetch all residents
router.get('/', async (req, res) => {
  try {
    const residents = await Resident.findAll();
    res.json(residents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Create a new resident (Sign-up)
router.post('/', async (req, res) => {
  try {
    const newResident = await Resident.create(req.body);
    res.status(201).json(newResident);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;