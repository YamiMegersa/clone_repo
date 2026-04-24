const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { MockReport, Geography, MockWard, Municipality, Allocation, MunicipalWorker } = require('../models');
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

// GET /api/sandbox/municipality/:muniId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/municipality/:muniId', async (req, res) => {
    try {
        const { muniId } = req.params;
        const { startDate, endDate } = req.query; // 🚨 1. Grab the dates from the URL

        // 2. Start building your query rules
        const whereClause = {
            MunicipalityID: muniId
        };

        // 🚨 3. THE FIX: Apply the Date Filter if the frontend sent dates!
        if (startDate && endDate) {
            whereClause.CreatedAt = {
                [Op.gte]: new Date(startDate),
                // Add 23:59:59 to capture the entire final day!
                [Op.lte]: new Date(`${endDate}T23:59:59.999Z`) 
            };
        }

        // 4. Fetch the data using our combined rules
        const reports = await MockReport.findAll({
            where: whereClause,
            raw: true
        });

        res.status(200).json(reports);

    } catch (error) {
        console.error("Error fetching municipality reports:", error);
        res.status(500).json({ error: "Internal Server Error" });
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

// GET /api/sandbox/worker/:workerId/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/worker/:workerId/reports', async (req, res) => {
    try {
        const { workerId } = req.params;
        const { startDate, endDate } = req.query;

        // 🚨 1. Fetch ONLY Accepted Allocations for this worker
        const workerAllocations = await Allocation.findAll({
            where: { 
                EmployeeID: workerId,
                Accepted: true // THIS IS THE NEW LINE! It only pulls accepted tasks.
            },
            attributes: ['ReportID'], // We only need the ReportID now
            raw: true
        });

        const reportIdsArray = workerAllocations.map(a => a.ReportID);
        
        // If they have no accepted tasks, exit early
        if (reportIdsArray.length === 0) return res.status(200).json([]);

        // 2. Build the Sequelize Query to fetch the report details
        const whereClause = { 
            ReportID: { [Op.in]: reportIdsArray } 
        };

        // 3. Apply the Date Filter (Working perfectly from our last step!)
        if (startDate && endDate) {
            whereClause.CreatedAt = {
                [Op.gte]: new Date(startDate),
                [Op.lte]: new Date(`${endDate}T23:59:59.999Z`) 
            };
        }

        // 4. Fetch the filtered reports
        const reports = await MockReport.findAll({ 
            where: whereClause, 
            raw: true 
        });
        
        // 5. Attach the Accepted boolean (We hardcode to true, since we filtered them above)
        const reportsWithAcceptance = reports.map(report => ({
            ...report,
            Accepted: true 
        }));

        res.status(200).json(reportsWithAcceptance);

    } catch (error) {
        console.error(`Error fetching reports:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/sandbox/workers
router.get('/workers', async (req, res) => {
    try {
        // 1. Fetch the raw data from your database
        const dbWorkers = await MunicipalWorker.findAll({
            attributes: ['EmployeeID', 'FirstName', 'LastName'],
            raw: true
        });

        // 2. Combine FirstName and LastName into a single "Name" property 
        // so the frontend doesn't break!
        const workers = dbWorkers.map(worker => ({
            EmployeeID: worker.EmployeeID,
            Name: `${worker.FirstName || ''} ${worker.LastName || ''}`.trim() || 'Unknown Worker',
            //Role: 'Municipal Worker' // Optional: Hardcoded since your model doesn't have a Role column
        }));
        
        res.status(200).json(workers);
    } catch (error) {
        console.error('Error fetching workers:', error);
        res.status(500).json({ error: 'Internal Server Error fetching workers' });
    }
});

// GET /api/sandbox/report/:reportId/workers
router.get('/report/:reportId/workers', async (req, res) => {
    try {
        const { reportId } = req.params;

        // 1. Find all allocations for this specific report
        const allocations = await Allocation.findAll({ 
            where: { ReportID: reportId }, 
            attributes: ['EmployeeID'],
            raw: true 
        });

        const workerIds = allocations.map(a => a.EmployeeID);

        // If no one is assigned, exit early
        if (workerIds.length === 0) {
            return res.status(200).json([]);
        }

        // 2. Fetch the actual worker details
        const dbWorkers = await MunicipalWorker.findAll({
            where: { EmployeeID: { [Op.in]: workerIds } }, // Use the Op.in operator you set up earlier!
            attributes: ['EmployeeID', 'FirstName', 'LastName'],
            raw: true
        });

        // 3. Format them for the frontend
        const workers = dbWorkers.map(w => ({
            EmployeeID: w.EmployeeID,
            Name: `${w.FirstName || ''} ${w.LastName || ''}`.trim() || 'Unknown Worker'
        }));
        
        res.status(200).json(workers);

    } catch (error) {
        console.error(`Error fetching workers for report ${req.params.reportId}:`, error);
        res.status(500).json({ error: 'Internal Server Error fetching allocated workers' });
    }
});

// GET /api/sandbox/worker/:workerId/acceptance
router.get('/worker/:workerId/acceptance', async (req, res) => {
    try {
        const { workerId } = req.params;

        // Fetch ONLY the Accepted column from the Allocation table
        const allocations = await Allocation.findAll({
            where: { EmployeeID: workerId },
            attributes: ['Accepted'],
            raw: true
        });

        const total = allocations.length;
        
        // MySQL occasionally returns booleans as 1/0, so we check for both
        const acceptedCount = allocations.filter(a => a.Accepted === true || a.Accepted === 1).length;

        // Send back a perfectly clean math package!
        res.status(200).json({ 
            total: total, 
            accepted: acceptedCount 
        });

    } catch (error) {
        console.error(`Error fetching acceptance stats for ${req.params.workerId}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;