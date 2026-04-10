const express=require('express');
const router=express.Router();
const {Report, ReportImage, Allocation}=require('../models');

//GET: FEtch ALL reports (Useful for the Municipal Dashboard)
router.get('/',async (req,res)=>{
    try{
        const reports=await Report.findAll();
        res.json(reports);
    }catch (err){
        console.error(err);
        res.status(500).json({error:err.message});
    }
});

//GET: Fetch all reports for a SPECIFIC Resident
router.get('/resident/:residentId', async (req,res)=>{
    try{
        const residentReports=await Report.findAll({where:{ResidentID:req.params.residentId}});
        res.json(residentReports);
    }catch (err){
        console.error(err);
        res.status(500).json({error:err.message});
    }
});

//POST: Log a new report/fault
router.post('/', async (req,res)=>{
    try{
        const newReport=await Report.create(req.body);
        res.status(201).json({message:"Report logged successfully", report:newReport});
    }catch (err){
        console.error(err);
        res.status(400).json({error:err.message});
    }
});

//GET: Fetch a single report by its exact ID
router.get('/:id', async (req,res)=>{
    try{
        const report =await Report.findByPk(req.params.id);
        if (!report){
            return res.status(404).json({message:'Report not found'});
        }
        res.json(report);
    }catch (err){
        console.error(err);
        res.status(500).json({error:err.message});
    }
});

//PUT: Update the status of a report (Used by workers when when fixing a fault)
router.put('/:id/status', async(req,res)=>{
    try{
        //Extract the fields the worker wants to update
        const {Status, Progress, DateFulfilled}=req.body;

        const [updatedRows]=await Report.update({Status, Progress, DateFulfilled},{where:{ReportID:req.params.id}});
        if (updatedRows===0) {
            return res.status(404).json({message:'Report not found'});
        }
        res.status(200).json({message:'Report status updated successfully'});
    }catch (err){
        console.error(err);
        res.status(500).json({error:err.message});
    }
});

//DELETE: Remove a report by its ID (Used for testing purposes)
router.delete('/:id', async (req,res)=>{
    try{
        const deleted=await Report.destroy({where:{ReportID:req.params.id}});
        if (deleted===0){
            return res.status(404).json({message:'Report not found'});
        }
        res.status(200).json({message:'Report deleted successfully'});
    }catch (err){
        console.error(err);
        res.status(500).json({error:err.message});
    }
});

module.exports=router;