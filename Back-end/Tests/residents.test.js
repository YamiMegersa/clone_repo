const request = require('supertest');
const app = require('../index'); // Path to your main app file
const { sequelize, Resident, Ward, Subscription } = require('../models');

// Setup and Teardown
beforeAll(async () => {
    // Sync the database before tests (use a test DB in .env if possible!)
    await sequelize.sync({ force: true });
    
    // Create a dummy Ward so we have something to subscribe to
    await Ward.create({ WardID: 1, WardCouncillor: 'Test Councillor' });
});

afterAll(async () => {
    await sequelize.close(); // Close DB connection so Jest can exit
});

describe('Resident API Routes', () => {
    let testResidentId;

    // 1. Test POST: Create Resident
    test('POST /api/residents - Should create a new resident', async () => {
        const res = await request(app)
            .post('/api/residents')
            .send({
                Username: 'JestUser',
                Email: 'jest@test.com',
                CellphoneNumber: '0999999999'
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('ResidentID');
        testResidentId = res.body.ResidentID;
    });

    // 2. Test GET: All Residents
    test('GET /api/residents - Should return all residents', async () => {
        const res = await request(app).get('/api/residents');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    // 3. Test POST: Subscribe
    test('POST /api/residents/subscribe - Should link resident to ward', async () => {
        const res = await request(app)
            .post('/api/residents/subscribe')
            .send({
                ResidentID: testResidentId,
                WardID: 1
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Subscription successful!');
    });

    // 4. Test GET: Subscriptions (The JOIN test)
    test('GET /api/residents/:id/subscriptions - Should return ward array', async () => {
        const res = await request(app).get(`/api/residents/${testResidentId}/subscriptions`);
        
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toHaveProperty('WardID', 1);
    });

    // 5. Test DELETE: Unsubscribe
    test('DELETE /api/residents/unsubscribe - Should remove the link', async () => {
        const res = await request(app)
            .delete('/api/residents/unsubscribe')
            .send({
                ResidentID: testResidentId,
                WardID: 1
            });
        
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Unsubscribed successfully!');
    });
});