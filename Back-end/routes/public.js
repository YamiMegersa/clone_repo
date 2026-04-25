const express = require('express');
const router = express.Router();
const { Report, Ward, Op } = require('../models');

router.get('/reports/ward/:wardId', async (req, res)=>{
    const report=await Report.findAll({
        where:{
            WardID:req.params.wardId,
        },
        order:[['CreatedAt','DESC']]
    });
    res.json(report);




});

router.get('/geography/wards', async (req, res)=>{
    const wards=await Ward.findAll();
    res.json(wards);
});

module.exports=router;