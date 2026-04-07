const express = require('express');
const router = express.Router();
const {Resident,Ward} = require('../models');

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

router.get('/:id/subscriptions', async (req, res) => {
    try {
        const residentId = req.params.id;

        // Find the resident by Primary Key and "include" their associated Wards
        const residentWithWards = await Resident.findByPk(residentId, {
            include: [{
                model: Ward,
                // The 'through' option refers to the Subscription table 
                // Setting attributes to [] prevents the junction table data from cluttering the result
                through: { attributes: [] } 
            }]//this is how sqlise does join
        });

        if (!residentWithWards) {
            return res.status(404).json({ message: 'Resident not found' });
        }

        // residentWithWards.Wards is an array of Ward objects
        res.json(residentWithWards.Wards);
    } catch (err) {
        console.error('Error fetching subscriptions:', err);
        res.status(500).json({ error: err.message });
    }
});//Returns an array of wards

module.exports = router;