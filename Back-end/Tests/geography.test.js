const request = require('supertest');
const express = require('express');
const router = require('../routes/geography'); // Adjust the path to your router file
const { Province, Municipality, Ward } = require('../models');

// Mock the models
jest.mock('../models', () => ({
    Province: { findAll: jest.fn() },
    Municipality: { findAll: jest.fn() },
    Ward: { findAll: jest.fn(), findByPk: jest.fn() },
    Resident: {}
}));

const app = express(); //new instance of express in case index.js does not work
app.use(express.json());
app.use('/', router);

describe('Location Routes', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    // --- Province Tests ---
    describe('GET /provinces', () => {
        it('should return all provinces', async () => {
            const mockProvinces = [{ id: 1, name: 'Gauteng' }];
            Province.findAll.mockResolvedValue(mockProvinces);

            const res = await request(app).get('/provinces');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockProvinces);
        });

        it('should return 500 on database error', async () => {
            Province.findAll.mockRejectedValue(new Error('DB Error'));
            const res = await request(app).get('/provinces');
            expect(res.statusCode).toBe(500);
        });
    });

    // --- Municipality Tests ---
    describe('GET /provinces/:id/municipalities', () => {
        it('should return municipalities for a specific province', async () => {
            const mockMunis = [{ id: 10, ProvinceID: 1, name: 'City of Joburg' }];
            Municipality.findAll.mockResolvedValue(mockMunis);

            const res = await request(app).get('/provinces/1/municipalities');

            expect(res.statusCode).toBe(200);
            expect(Municipality.findAll).toHaveBeenCalledWith({
                where: { ProvinceID: '1' }
            });
        });
    });

    // --- Ward Tests ---
    describe('GET /wards/:id', () => {
        it('should return a specific ward if found', async () => {
            const mockWard = { id: 5, name: 'Ward 5' };
            Ward.findByPk.mockResolvedValue(mockWard);

            const res = await request(app).get('/wards/5');

            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe('Ward 5');
        });

        it('should return 404 if ward does not exist', async () => {
            Ward.findByPk.mockResolvedValue(null);

            const res = await request(app).get('/wards/999');

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Ward not found');
        });
    });

    describe('GET /wards/:id/subscribers', () => {
        it('should return subscribers for a valid ward', async () => {
            const mockWardWithResidents = {
                id: 1,
                Residents: [{ id: 101, name: 'John Doe' }]
            };
            Ward.findByPk.mockResolvedValue(mockWardWithResidents);

            const res = await request(app).get('/wards/1/subscribers');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].name).toBe('John Doe');
        });

        it('should return 404 if ward is not found for subscribers', async () => {
            Ward.findByPk.mockResolvedValue(null);
            const res = await request(app).get('/wards/1/subscribers');
            expect(res.statusCode).toBe(404);
        });
    });
});