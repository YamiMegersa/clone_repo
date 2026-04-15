const express = require('express');
const router = express.Router();
const {MunicipalWorker} = require('../models');


// --- 1. GET: Fetch all non-validated workers ---
// This MUST be above /:id so 'pending' isn't treated as an ID
router.get('/pending', async (req, res) => {
    try {
        const pending = await MunicipalWorker.findAll({ 
            where: { Validated: false } 
        });
        res.json(pending); 
    } catch (err) {
        console.error("Error fetching pending workers:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- 2. PUT: Validate a worker ---
// This allows the Admin to approve a worker
router.put('/validate/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        const [updated] = await MunicipalWorker.update(
            { Validated: true }, 
            { where: { EmployeeID: employeeId } }
        );

        if (updated === 0) {
            return res.status(404).json({ message: "Worker not found or already validated." });
        }

        res.status(200).json({ success: true, message: "Worker validated successfully!" });
    } catch (err) {
        console.error("Validation error:", err);
        res.status(500).json({ error: err.message });
    }
});
// GET: Fetch all municipal workers
router.get('/', async (req, res) => {
    try{
        const workers=await MunicipalWorker.findAll();
        res.json(workers);
    }
    catch(err){
        console.error(err);
        res.status(500).json({error:err.message});
    }
});

// POST: Create a new municipal worker (Sign-up)
router.post('/', async (req, res) => {
    try{
        const newWorker = await MunicipalWorker.create(req.body);
        res.status(201).json(newWorker);
    }catch(err){
        console.error(err);
        res.status(400).json({error:err.message});
    }
});

//GET: Fetch a specific worker by EmployeeID
router.get('/:id',async (req,res)=>{
    try{
        const worker=await MunicipalWorker.findByPk(req.params.id);
        if (!worker){
            return res.status(404).json({message:'Worker not found'});
        }
        res.json(worker);
    }catch (err){
        console.error(err);
        res.status(500).json({error:err.message});
    }
});

//DELETE: Remove a worker by EmployeeID
router.delete('/:id', async (req, res) => {
    try {
        const deleted=await MunicipalWorker.destroy({where:{EmployeeID:req.params.id}});
        if (deleted===0){
            return res.status(404).json({message:'Worker not found'});
        }
        res.status(200).json({message:"Worker deleted successfully"});
    }catch(err){
        console.error(err);
        res.status(500).json({error:err.message});
    }
});

module.exports=router;