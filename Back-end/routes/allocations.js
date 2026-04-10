const express = require('express');
const router = express.Router();
const { Allocation, Report, MunicipalWorker } = require('../models');

// =======================
// VIEW ALLOCATIONS
// =======================

// GET: Fetch all allocations 
router.get('/', async (req, res) => {
    try {
        const allocations = await Allocation.findAll();
        res.json(allocations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET: Fetch all tasks assigned to a SPECIFIC Worker (For the Worker's Dashboard)
router.get('/worker/:workerId', async (req, res) => {
    try {
        const tasks = await Allocation.findAll({
            where: { EmployeeID: req.params.workerId },
            include: [{ model: Report }] // This automatically pulls the details of the fault
        });
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET: Fetch all workers assigned to a SPECIFIC Report (For the Admin/Manager Dashboard)
router.get('/report/:reportId', async (req, res) => {
    try {
        const assignedWorkers = await Allocation.findAll({
            where: { ReportID: req.params.reportId },
            include: [{ model: MunicipalWorker }] // This pulls the details of the workers assigned
        });
        res.json(assignedWorkers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// =======================
// MANAGE ALLOCATIONS
// =======================

// POST: Assign a worker to a report
router.post('/', async (req, res) => {
    try {
        // The manager will send the ReportID and EmployeeID in the JSON body
        const newAllocation = await Allocation.create(req.body);
        res.status(201).json({ message: "Worker successfully assigned to task!", allocation: newAllocation });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
});

// DELETE: Unassign a worker from a report
router.delete('/:id', async (req, res) => {
    try {
        
        const deleted = await Allocation.destroy({ 
            where: { AllocationID: req.params.id } 
        });
        
        if (deleted === 0) {
            return res.status(404).json({ message: 'Allocation not found' });
        }
        res.status(200).json({ message: 'Worker unassigned successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;