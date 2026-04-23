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

//General requestVOlume
router.get('/request-volume', async (req, res) => {
    try {
        const { regionId, regionType, granularity, timePeriod } = req.query;

        // 1. Build the base WHERE clause (Filtering by the Map Click)
        let whereClause = {};

        if (regionId && regionId !== 'All') {
            if (regionType === 'ward') {
                whereClause.WardID = regionId;
            } else if (regionType === 'municipality') {
                whereClause.MunicipalityID = regionId; 
            }
        }

        // 2. Apply Time Period Filtering (Example)
        const now = new Date();
        if (timePeriod === 'last30days') {
            const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
            whereClause.CreatedAt = { [Op.gte]: thirtyDaysAgo };
        } 
        // Add other time periods here...

        // 3. Set up Dynamic Grouping based on Granularity
        let queryAttributes = [
            // We always want to count the number of reports
            [sequelize.fn('COUNT', sequelize.col('MockReport.ReportID')), 'TotalReports']
        ];
        let queryGroup = [];
        let queryInclude = [];

        if (granularity === 'ward') {
            queryAttributes.push('WardID');
            queryGroup.push('WardID');
        } 
        else if (granularity === 'municipal') {
            queryAttributes.push('MunicipalityID');
            queryGroup.push('MunicipalityID');
        } 
        else if (granularity === 'provincial') {
            // To group by province, we MUST join the Municipality table
            queryInclude.push({
                model: Municipality,
                attributes: ['ProvinceID'] // Only pull what we need
            });
            // Group by the joined ProvinceID
            queryGroup.push([Municipality, 'ProvinceID']);
        }

        // 4. Execute the Aggregation Query
        const analyticsData = await MockReport.findAll({
            where: whereClause,
            attributes: queryAttributes,
            include: queryInclude,
            group: queryGroup,
            raw: true // Returns clean JSON instead of bulky Sequelize objects
        });

        res.status(200).json({ success: true, data: analyticsData });

    } catch (error) {
        console.error("Sandbox Analytics Error:", error);
        res.status(500).json({ success: false, message: "Server error calculating volume." });
    }
});

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
        //whereClause={};

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

// Inside routes/Sandbox.js
router.get('/municipality-map', async (req, res) => {
    try {
        const dbMunicipalities = await Municipality.findAll({
            attributes: ['MunicipalityID', 'MunicipalityName'] // Double check your exact column name!
        });

        const muniNameToIdMap = {};
        dbMunicipalities.forEach(muni => {
            if (muni.MunicipalityName) {
                const cleanName = muni.MunicipalityName.toLowerCase()
                    .replace(/ metropolitan municipality/g, '')
                    .replace(/ local municipality/g, '')
                    .replace(/ district municipality/g, '')
                    .replace(/-/g, ' ')
                    .trim();
                muniNameToIdMap[cleanName] = muni.MunicipalityID;
            }
        });

        res.status(200).json(muniNameToIdMap);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to build map' });
    }
});

module.exports = router;