const request = require('supertest');
const express = require('express');
const notificationRouter = require('../routes/notifications');
const { Notification } = require('../models');

// Mock the Notification model
jest.mock('../models', () => ({
    Notification: {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        count: jest.fn(),
    }
}));

const app = express();
app.use(express.json());
app.use('/notifications', notificationRouter);

describe('Notification API Endpoints', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ── GET /:recipientId ────────────────────────────────────────────────────
    describe('GET /notifications/:recipientId', () => {
        it('should fetch all notifications for admin', async () => {
            const mockNotifs = [
                { NotificationID: 1, RecipientID: 'admin', Type: 'NEW_REPORT', Title: 'New Report', Message: 'A fault was logged', IsRead: false }
            ];
            Notification.findAll.mockResolvedValue(mockNotifs);

            const res = await request(app).get('/notifications/admin');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockNotifs);
            expect(Notification.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { RecipientID: 'admin' }
                })
            );
        });

        it('should fetch all notifications for a specific worker', async () => {
            const mockNotifs = [
                { NotificationID: 2, RecipientID: '123', Type: 'TASK_ASSIGNED', Title: 'New Task', Message: 'You have been assigned', IsRead: false }
            ];
            Notification.findAll.mockResolvedValue(mockNotifs);

            const res = await request(app).get('/notifications/123');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockNotifs);
        });

        it('should return empty array if no notifications exist', async () => {
            Notification.findAll.mockResolvedValue([]);
            const res = await request(app).get('/notifications/admin');
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('should return 500 if database fails', async () => {
            Notification.findAll.mockRejectedValue(new Error('DB Error'));
            const res = await request(app).get('/notifications/admin');
            expect(res.statusCode).toBe(500);
        });
    });

    // ── GET /:recipientId/unread/count ───────────────────────────────────────
    describe('GET /notifications/:recipientId/unread/count', () => {
        it('should return unread count for admin', async () => {
            Notification.count.mockResolvedValue(5);

            const res = await request(app).get('/notifications/admin/unread/count');

            expect(res.statusCode).toBe(200);
            expect(res.body.count).toBe(5);
            expect(Notification.count).toHaveBeenCalledWith({
                where: { RecipientID: 'admin', IsRead: false }
            });
        });

        it('should return 0 if all notifications are read', async () => {
            Notification.count.mockResolvedValue(0);
            const res = await request(app).get('/notifications/admin/unread/count');
            expect(res.statusCode).toBe(200);
            expect(res.body.count).toBe(0);
        });

        it('should return 500 if count query fails', async () => {
            Notification.count.mockRejectedValue(new Error('Count Failed'));
            const res = await request(app).get('/notifications/admin/unread/count');
            expect(res.statusCode).toBe(500);
        });
    });

    // ── PUT /:recipientId/read-all ───────────────────────────────────────────
    describe('PUT /notifications/:recipientId/read-all', () => {
        it('should mark all notifications as read for admin', async () => {
            Notification.update.mockResolvedValue([3]);

            const res = await request(app).put('/notifications/admin/read-all');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Notification.update).toHaveBeenCalledWith(
                { IsRead: true },
                { where: { RecipientID: 'admin', IsRead: false } }
            );
        });

        it('should return 500 if update fails', async () => {
            Notification.update.mockRejectedValue(new Error('Update Failed'));
            const res = await request(app).put('/notifications/admin/read-all');
            expect(res.statusCode).toBe(500);
        });
    });

    // ── DELETE /:recipientId/clear-all ──────────────────────────────────────
    describe('DELETE /notifications/:recipientId/clear-all', () => {
        it('should clear all notifications for a recipient', async () => {
            Notification.destroy.mockResolvedValue(4);

            const res = await request(app).delete('/notifications/admin/clear-all');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Notification.destroy).toHaveBeenCalledWith({
                where: { RecipientID: 'admin' }
            });
        });

        it('should still return success if no notifications existed', async () => {
            Notification.destroy.mockResolvedValue(0);
            const res = await request(app).delete('/notifications/admin/clear-all');
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return 500 if destroy fails', async () => {
            Notification.destroy.mockRejectedValue(new Error('Destroy Failed'));
            const res = await request(app).delete('/notifications/admin/clear-all');
            expect(res.statusCode).toBe(500);
        });
    });

    // ── PUT /:notificationId/read ────────────────────────────────────────────
    describe('PUT /notifications/:notificationId/read', () => {
        it('should mark a single notification as read', async () => {
            Notification.update.mockResolvedValue([1]);

            const res = await request(app).put('/notifications/1/read');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Notification.update).toHaveBeenCalledWith(
                { IsRead: true },
                { where: { NotificationID: '1' } }
            );
        });

        it('should return 500 if update fails', async () => {
            Notification.update.mockRejectedValue(new Error('Read Update Failed'));
            const res = await request(app).put('/notifications/1/read');
            expect(res.statusCode).toBe(500);
        });
    });

    // ── DELETE /:notificationId ──────────────────────────────────────────────
    describe('DELETE /notifications/:notificationId', () => {
        it('should delete a single notification successfully', async () => {
            Notification.destroy.mockResolvedValue(1);

            const res = await request(app).delete('/notifications/1');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return 404 if notification does not exist', async () => {
            Notification.destroy.mockResolvedValue(0);
            const res = await request(app).delete('/notifications/999');
            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Notification not found');
        });

        it('should return 500 if destroy fails', async () => {
            Notification.destroy.mockRejectedValue(new Error('Delete Failed'));
            const res = await request(app).delete('/notifications/1');
            expect(res.statusCode).toBe(500);
        });
    });

    // ── POST / ──────────────────────────────────────────────────────────────
    describe('POST /notifications', () => {
        it('should create a new notification for admin', async () => {
            const payload = {
                RecipientID: 'admin',
                Type: 'NEW_REPORT',
                Title: 'New Pothole Report',
                Message: 'A fault was logged in Ward 3',
                ReportID: 42
            };
            Notification.create.mockResolvedValue({ NotificationID: 1, ...payload });

            const res = await request(app).post('/notifications').send(payload);

            expect(res.statusCode).toBe(201);
            expect(Notification.create).toHaveBeenCalledWith(payload);
        });

        it('should create a notification for a worker', async () => {
            const payload = {
                RecipientID: '123',
                Type: 'TASK_ASSIGNED',
                Title: 'New Assignment',
                Message: 'You have been assigned a task in Ward 5',
                ReportID: 7
            };
            Notification.create.mockResolvedValue({ NotificationID: 2, ...payload });

            const res = await request(app).post('/notifications').send(payload);

            expect(res.statusCode).toBe(201);
            expect(Notification.create).toHaveBeenCalledWith(payload);
        });

        it('should return 500 if creation fails', async () => {
            Notification.create.mockRejectedValue(new Error('Create Failed'));
            const res = await request(app).post('/notifications').send({});
            expect(res.statusCode).toBe(500);
        });
    });
});