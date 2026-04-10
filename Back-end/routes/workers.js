const express = require('express');
const router = express.Router();
const {MunicipalWorker} = require('../models');

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

//POST: Worker Login Route(For Worker_Login.html)
router.post('/login',async(req,res)=>{
    try{
        //Recieve the encrypted token from the frontend
        const {googleToken}=req.body;
        
        //Ask Google's servers to decrypt and verify it
        const verifiedGoogleProfile=await verifyGoogleToken(googleToken);

        
        //Search by email to log them in
        const email=verifiedGoogleProfile.email;


        const worker=await MunicipalWorker.findOne({where:{email:email}});

        //1.) Check if the worker exists
        if (!worker){
            return res.status(404).json({message:'Worker not found'});
        }
        //2.) Check if they are blacklisted
        if (worker.Blacklisted){
            return res.status(403).json({message:'Access denied. Worker is blacklisted.'});
        }

        //3.) Check if they are validated by the admin
        if (!worker.Validated){
            return res.status(403).json({message:'Accountpending validation from Admin.'});
        }

        res.status(200).json({message:'Login successful!', worker:worker});
    } catch(err){
        console.error(err);
        res.status(500).json({error:err.message});
    }
});

module.exports=router;