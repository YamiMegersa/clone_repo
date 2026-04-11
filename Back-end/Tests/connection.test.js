const { sequelize } = require('../models');

describe('Database Connection', () => {
    
    // Close the connection after the test so Jest can exit
    afterAll(async () => {
        await sequelize.close();
    });

    it('should successfully connect to the database', async () => {
        try {
            // .authenticate() is a Sequelize method that tries to log in
            await sequelize.authenticate();
            
            // If we reach this line, the connection worked
            expect(true).toBe(true); 
        } catch (error) {
            // If it fails, the test will catch the error and show it to you
            throw new Error('Unable to connect to the database: ' + error.message);
        }
    });
});