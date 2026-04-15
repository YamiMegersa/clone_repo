const request = require('supertest');
const express = require('express');
const reportRouter = require('../routes/reports'); // Adjust path to your router file
const { Report } = require('../models');

// Mock the Sequelize models
jest.mock('../models', () => ({
  Report: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  ReportImage: {},
  Allocation: {}
}));

const app = express();
app.use(express.json());
app.use('/reports', reportRouter);

describe('Report API Endpoints', () => {
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /reports', () => {
    it('should fetch all reports', async () => {
      const mockReports = [{ ReportID: 1, Description: 'Pothole' }];
      Report.findAll.mockResolvedValue(mockReports);

      const res = await request(app).get('/reports');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockReports);
    });

    it('should return 500 if database fails', async () => {
      Report.findAll.mockRejectedValue(new Error('Internal Server Error'));
      const res = await request(app).get('/reports');
      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /reports/resident/:residentId', () => {
    it('should fetch reports for a specific resident', async () => {
      Report.findAll.mockResolvedValue([{ ReportID: 1, ResidentID: 'RES-123' }]);

      const res = await request(app).get('/reports/resident/RES-123');

      expect(res.statusCode).toBe(200);
      expect(Report.findAll).toHaveBeenCalledWith({
        where: { ResidentID: 'RES-123' }
      });
    });
  });

  describe('POST /reports', () => {
    it('should log a new report successfully', async () => {
      const payload = { Description: 'Water leak', ResidentID: 5 };
      Report.create.mockResolvedValue({ ReportID: 10, ...payload });

      const res = await request(app).post('/reports').send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Report logged successfully");
      expect(Report.create).toHaveBeenCalledWith(payload);
    });

    it('should create report and return ID for images', async () => {
      const payload = { WardID: 1, Type: 'Pothole', /* ... */ };
      Report.create.mockResolvedValue({ ReportID: 42, ...payload });
      const res = await request(app).post('/reports').send(payload);
      expect(res.statusCode).toBe(201);
      expect(res.body.report.ReportID).toBe(42);
    });

    it('should return 400 if creation fails', async () => {
      Report.create.mockRejectedValue(new Error('Validation Error'));
      const res = await request(app).post('/reports').send({});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /reports/:id/status', () => {
    it('should update the status of a report', async () => {
      const updateData = { Status: 'Fixed', Progress: 100 };
      Report.update.mockResolvedValue([1]); // Returns [rowsAffected]

      const res = await request(app)
        .put('/reports/10/status')
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Report status updated successfully');
      expect(Report.update).toHaveBeenCalledWith(
        expect.objectContaining({ Status: 'Fixed' }),
        { where: { ReportID: '10' } }
      );
    });

    it('should return 404 if the report is not found', async () => {
      Report.update.mockResolvedValue([0]);
      const res = await request(app).put('/reports/999/status').send({});
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /reports/:id', () => {
    it('should delete a report successfully', async () => {
      Report.destroy.mockResolvedValue(1);

      const res = await request(app).delete('/reports/5');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Report deleted successfully');
    });

    it('should return 404 if trying to delete non-existent report', async () => {
      Report.destroy.mockResolvedValue(0);
      const res = await request(app).delete('/reports/999');
      expect(res.statusCode).toBe(404);
    });
  });
});