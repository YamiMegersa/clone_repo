const request = require('supertest');
const express = require('express');
const imageRouter = require('../routes/reportImages'); // Adjust path as needed
const { ReportImage, Report } = require('../models');

// Mock the Sequelize models
jest.mock('../models', () => ({
    ReportImage: {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
        destroy: jest.fn(),
    },
    Report: {
        findByPk: jest.fn(),
    }
}));

const app = express();
app.use(express.json());
app.use('/images', imageRouter);

describe('ReportImage API Endpoints', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /images/report/:reportId', () => {
        it('should fetch all images for a specific report', async () => {
            const mockImages = [{ ImageID: 1, ReportID: 10, ImageData: 'base64...' }];
            ReportImage.findAll.mockResolvedValue(mockImages);

            const res = await request(app).get('/images/report/10');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockImages);
            expect(ReportImage.findAll).toHaveBeenCalledWith({ where: { ReportID: '10' } });
        });

        it('should return 404 if no images exist for the report', async () => {
            ReportImage.findAll.mockResolvedValue([]);

            const res = await request(app).get('/images/report/99');

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('No images found for this report.');
        });
    });

    describe('GET /images/:id', () => {
        it('should fetch a single image by ID', async () => {
            const mockImage = { ImageID: 1, ImageData: 'base64...' };
            ReportImage.findByPk.mockResolvedValue(mockImage);

            const res = await request(app).get('/images/1');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockImage);
        });

        it('should return 404 if the image ID does not exist', async () => {
            ReportImage.findByPk.mockResolvedValue(null);
            const res = await request(app).get('/images/500');
            expect(res.statusCode).toBe(404);
        });
    });

    describe('POST /images/report/:reportId', () => {
        it('should upload an image if the report exists', async () => {
            // 1. Mock the Report check
            Report.findByPk.mockResolvedValue({ ReportID: 10 });
            // 2. Mock the Image creation
            const newImageData = { ImageData: 'new-image-data' };
            ReportImage.create.mockResolvedValue({ ImageID: 1, ReportID: 10, ...newImageData });

            const res = await request(app)
                .post('/images/report/10')
                .send(newImageData);

            expect(res.statusCode).toBe(201);
            expect(res.body.message).toBe("Image uploaded successfully!");
            expect(ReportImage.create).toHaveBeenCalled();
        });

        it('should upload base64 image to existing report', async () => {
            Report.findByPk.mockResolvedValue({ ReportID: 42 });
            ReportImage.create.mockResolvedValue({ ImageID: 1, ReportID: 42 });
            const res = await request(app)
                .post('/images/report/42')
                .send({ Image: 'fakebase64data' });
            expect(res.statusCode).toBe(201);
            expect(res.body.message).toBe('Image uploaded successfully!');
            expect(ReportImage.create).toHaveBeenCalledWith(expect.objectContaining({ ReportID: '42', Image: 'fakebase64data' }));
});

        it('should return 404 if the report does not exist', async () => {
            Report.findByPk.mockResolvedValue(null);

            const res = await request(app)
                .post('/images/report/999')
                .send({ ImageData: 'data' });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Cannot attach image. Report not found.');
            // Ensure create was never called because the report check failed
            expect(ReportImage.create).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /images/:id', () => {
        it('should delete an image successfully', async () => {
            ReportImage.destroy.mockResolvedValue(1);

            const res = await request(app).delete('/images/1');

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Image deleted successfully');
        });

        it('should return 404 if image to delete is not found', async () => {
            ReportImage.destroy.mockResolvedValue(0);

            const res = await request(app).delete('/images/1');

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Image not found');
        });
    });
});