const express = require('express');
const router = express.Router();
const { ReportImage, Report } = require('../models');

// =======================
// VIEW IMAGES
// =======================

// GET: Fetch ALL images attached to a SPECIFIC Report
// (Useful when a worker clicks on a report and wants to see the photos)
router.get('/report/:reportId', async (req, res) => {
    try {
        const images = await ReportImage.findAll({
            where: { ReportID: req.params.reportId }
        });
        
        if (!images || images.length === 0) {
            return res.status(404).json({ message: 'No images found for this report.' });
        }

        const formattedImages = images.map(img => {
            const imgData = img.toJSON();

            if (imgData.Image) {
                imgData.base64 = Buffer.from(imgData.Image).toString('base64');
            }
        
        res.json(formattedImages);
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET: Fetch a single image by its exact ID
router.get('/:id', async (req, res) => {
    try {
        const image = await ReportImage.findByPk(req.params.id);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        res.json(image);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// =======================
// MANAGE IMAGES
// =======================

// POST: Upload a new image for a specific report
router.post('/report/:reportId', async (req, res) => {
    try {
        // We grab the ReportID from the URL, and the image data from the body
        const reportId = req.params.reportId;
        const {imageBase64} = req.body;
        // Ensure the report actually exists before attaching an image to it
        const reportExists = await Report.findByPk(reportId);
        if (!reportExists) {
            return res.status(404).json({ message: 'Cannot attach image. Report not found.' });
        }

        if(!imageBase64){
            return res.status(400).json({ message: 'No image data provided.' });
        }

        //split the image headers from the raw data
        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
        let type = 'image/jpeg';
        let rawData = imageBase64;

        if(matches && matches.length === 3){
            type = matches[1];
            rawData = matches[2];
        }

        // Create the image record
        // The frontend will send the image data (either a Base64 string or a file path) in the req.body
        const imageBuffer = Buffer.from(rawData, 'base64');

        const newImage = await ReportImage.create({
            ReportID: reportId,
            Type: type,
            Image: imageBuffer
        });

        res.status(201).json({ message: "Image uploaded successfully!", image: newImage

        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
});

// DELETE: Remove a specific image
router.delete('/:id', async (req, res) => {
    try {
        
        const deleted = await ReportImage.destroy({ 
            where: { ImageID: req.params.id } 
        });
        
        if (deleted === 0) {
            return res.status(404).json({ message: 'Image not found' });
        }
        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;