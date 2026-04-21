const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { MockReport, Geography, MockWard, Municipality } = require('../models');

// Helper function to build the date filter
const buildDateFilter = (startDate, endDate) => {
    let dateFilter = {};
    if (startDate && endDate) {
        // Op.between includes both the start and end dates
        dateFilter = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else if (startDate) {
        dateFilter = { [Op.gte]: new Date(startDate) }; // Greater than or equal to
    } else if (endDate) {
        dateFilter = { [Op.lte]: new Date(endDate) }; // Less than or equal to
    }
    return dateFilter;
};

// GET /api/reports/ward/:municipalityId/:wardId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/ward/:municipalityId/:wardId', async (req, res) => {
    try {
        const { municipalityId, wardId } = req.params;
        const { startDate, endDate } = req.query;

        // Base query conditions
        const whereClause = {
            MunicipalityID: municipalityId,
            WardID: wardId
        };

        // Append date filter if provided
        const dateFilter = buildDateFilter(startDate, endDate);
        if (Object.keys(dateFilter).length > 0) {
            whereClause.CreatedAt = dateFilter;
        }

        const reports = await MockReport.findAll({ where: whereClause });
        res.status(200).json(reports);

    } catch (error) {
        console.error('Error fetching ward reports:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/reports/municipality/:municipalityId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/municipality/:municipalityId', async (req, res) => {
    try {
        const { municipalityId } = req.params;
        const { startDate, endDate } = req.query;

        const whereClause = { MunicipalityID: municipalityId };

        const dateFilter = buildDateFilter(startDate, endDate);
        if (Object.keys(dateFilter).length > 0) {
            whereClause.CreatedAt = dateFilter;
        }

        const reports = await MockReport.findAll({ where: whereClause });
        res.status(200).json(reports);

    } catch (error) {
        console.error('Error fetching municipality reports:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/reports/province/:provinceId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/province/:provinceId', async (req, res) => {
    try {
        const { provinceId } = req.params;
        const { startDate, endDate } = req.query;

        const whereClause = {};

        const dateFilter = buildDateFilter(startDate, endDate);
        if (Object.keys(dateFilter).length > 0) {
            whereClause.CreatedAt = dateFilter;
        }

        const reports = await MockReport.findAll({
            where: whereClause,
            include: [{
                model: Municipality,
                // This forces an INNER JOIN. It only returns reports where the 
                // linked Municipality belongs to the specified ProvinceID
                where: { ProvinceID: provinceId }, 
                attributes: [] // We don't necessarily need to return the municipality data, just filter by it
            }]
        });

        res.status(200).json(reports);

    } catch (error) {
        console.error('Error fetching province reports:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;