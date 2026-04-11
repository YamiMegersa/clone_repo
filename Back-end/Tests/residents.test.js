const request = require('supertest');
const express = require('express');
const residentRouter = require('../routes/residents'); 
const { Resident, Ward, Subscription } = require('../models');

// Mocking the Sequelize function calls
jest.mock('../models', () => ({
    Resident: {
        findAll: jest.fn(), //jest.fn allows us to simulate db, with mock responses
        create: jest.fn(),
        findByPk: jest.fn(),
    },
    Ward: {
        findByPk: jest.fn(),
    },
    Subscription: {
        findOne: jest.fn(),
        create: jest.fn(),
        destroy: jest.fn(),
    }
})); //creates a mock object that implements relevant functions locally

const app = express();
app.use(express.json());
app.use('/residents', residentRouter);

describe('Resident API Endpoints test', () => {
    
    afterEach(() => {
        jest.clearAllMocks();
    }); // clears the mock memory of the functions, resets call counts and arguements

    describe('GET /residents', () => { //we use AAA, aarrange, act, assert
        it('should return all residents', async () => {
            const mockResidents = [{ id: 1, Name: 'John Doe' }];
            Resident.findAll.mockResolvedValue(mockResidents); //sets up a mock entity in our mocktable, if you call finall, return this

            const res = await request(app).get('/residents');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockResidents);
        });
    });

    describe('GET /residents/:id/subscriptions', () => {
        it('should return wards for valid resident', async () => {
            const mockData = {
                id: 1,
                Wards: [{ id: 10, name: 'Ward 10' }]
            };
            Resident.findByPk.mockResolvedValue(mockData);

            const res = await request(app).get('/residents/1/subscriptions');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockData.Wards);
        });

        it('should return 404 if resident does not exist', async () => {
            Resident.findByPk.mockResolvedValue(null);
            const res = await request(app).get('/residents/99/subscriptions');
            expect(res.statusCode).toBe(404);
        });
    });

    describe('POST /residents/subscribe', () => {
        it('should create a subscription successfully', async () => {
            // Mock resident and ward exist
            Resident.findByPk.mockResolvedValue({ id: 1 });
            Ward.findByPk.mockResolvedValue({ id: 10 });
            // Mock no existing subscription
            Subscription.findOne.mockResolvedValue(null);//not existing
            // Mock creation
            Subscription.create.mockResolvedValue({ ResidentID: 1, WardID: 10 });

            const res = await request(app)
                .post('/residents/subscribe')
                .send({ ResidentID: 1, WardID: 10 });

            expect(res.statusCode).toBe(201);
            expect(res.body.message).toBe('Subscription successful!');
        });

        it('should return 400 if already subscribed', async () => {
            Resident.findByPk.mockResolvedValue({ id: 1 });
            Ward.findByPk.mockResolvedValue({ id: 10 });
            Subscription.findOne.mockResolvedValue({ id: 500 }); // Existing found

            const res = await request(app)
                .post('/residents/subscribe')
                .send({ ResidentID: 1, WardID: 10 });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('already subscribed');
        });

        it('should return 404 if Resident or Ward is missing', async () => {
            Resident.findByPk.mockResolvedValue(null);
            const res = await request(app)
                .post('/residents/subscribe')
                .send({ ResidentID: 1, WardID: 10 });

            expect(res.statusCode).toBe(404);
        });
    });

    describe('DELETE /residents/unsubscribe', () => {
        it('should unsubscribe successfully', async () => {
            Subscription.destroy.mockResolvedValue(1); // 1 row deleted

            const res = await request(app)
                .delete('/residents/unsubscribe')
                .send({ ResidentID: 1, WardID: 10 });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Unsubscribed successfully!');
        });

        it('should return 404 if no subscription found to delete', async () => {
            Subscription.destroy.mockResolvedValue(0); // 0 rows deleted

            const res = await request(app)
                .delete('/residents/unsubscribe')
                .send({ ResidentID: 1, WardID: 10 });

            expect(res.statusCode).toBe(404);
        });
    });
});