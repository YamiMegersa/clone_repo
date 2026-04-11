const request = require('supertest');
const express = require('express');
const workerRouter = require('../routes/workers'); // Adjust path as needed
const { MunicipalWorker } = require('../models');

// 1. Mock the Sequelize Model
jest.mock('../models', () => ({
    MunicipalWorker: {
        findAll: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn(),
        destroy: jest.fn(),
        findOne: jest.fn(),
    }
}));

// 2. Mock the external verifyGoogleToken function
// Assuming it's defined in the same file or imported; we mock it globally for the route
global.verifyGoogleToken = jest.fn();

const app = express();
app.use(express.json());
app.use('/workers', workerRouter);

describe('MunicipalWorker API Endpoints', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /workers', () => {
        it('should return all workers', async () => {
            const mockWorkers = [{ EmployeeID: 1, Name: 'John Doe' }];
            MunicipalWorker.findAll.mockResolvedValue(mockWorkers);

            const res = await request(app).get('/workers');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockWorkers);
        });
    });

    describe('POST /workers', () => {
        it('should create a new worker (sign-up)', async () => {
            const newWorker = { Name: 'Jane Smith', email: 'jane@municipality.gov' };
            MunicipalWorker.create.mockResolvedValue({ EmployeeID: 2, ...newWorker });

            const res = await request(app).post('/workers').send(newWorker);

            expect(res.statusCode).toBe(201);
            expect(res.body.EmployeeID).toBe(2);
        });

        it('should return 400 if creation fails', async () => {
            MunicipalWorker.create.mockRejectedValue(new Error('Validation error'));
            const res = await request(app).post('/workers').send({});
            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /workers/:id', () => {
        it('should return a worker by ID', async () => {
            MunicipalWorker.findByPk.mockResolvedValue({ EmployeeID: 1, Name: 'John' });
            const res = await request(app).get('/workers/1');
            expect(res.statusCode).toBe(200);
        });

        it('should return 404 if worker not found', async () => {
            MunicipalWorker.findByPk.mockResolvedValue(null);
            const res = await request(app).get('/workers/99');
            expect(res.statusCode).toBe(404);
        });
    });

    describe('DELETE /workers/:id', () => {
        it('should delete a worker successfully', async () => {
            MunicipalWorker.destroy.mockResolvedValue(1); // 1 row deleted
            const res = await request(app).delete('/workers/1');
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Worker deleted successfully');
        });
    });

    describe('POST /workers/login', () => {
        const mockGoogleToken = 'fake-token';

        it('should login successfully for a valid, validated worker', async () => {
            // Mock Google verification
            global.verifyGoogleToken.mockResolvedValue({ email: 'test@gov.com' });
            // Mock DB find
            MunicipalWorker.findOne.mockResolvedValue({
                email: 'test@gov.com',
                Blacklisted: false,
                Validated: true
            });

            const res = await request(app)
                .post('/workers/login')
                .send({ googleToken: mockGoogleToken });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Login successful!');
        });

        it('should return 403 if worker is blacklisted', async () => {
            global.verifyGoogleToken.mockResolvedValue({ email: 'bad@gov.com' });
            MunicipalWorker.findOne.mockResolvedValue({
                email: 'bad@gov.com',
                Blacklisted: true,
                Validated: true
            });

            const res = await request(app)
                .post('/workers/login')
                .send({ googleToken: mockGoogleToken });

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toContain('blacklisted');
        });

        it('should return 403 if worker is not yet validated', async () => {
            global.verifyGoogleToken.mockResolvedValue({ email: 'new@gov.com' });
            MunicipalWorker.findOne.mockResolvedValue({
                email: 'new@gov.com',
                Blacklisted: false,
                Validated: false
            });

            const res = await request(app)
                .post('/workers/login')
                .send({ googleToken: mockGoogleToken });

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toContain('pending validation');
        });
    });
});