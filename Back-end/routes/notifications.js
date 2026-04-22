const express = require('express');
const router = express.Router();
const { Notification } = require('../models');

// ── Specific routes FIRST (before the /:id wildcards) ──────────────────────

// GET: Count unread
router.get('/:recipientId/unread/count', async (req, res) => {
    try {
        const count = await Notification.count({
            where: { RecipientID: req.params.recipientId, IsRead: false }
        });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT: Mark ALL read for a recipient
router.put('/:recipientId/read-all', async (req, res) => {
    try {
        await Notification.update(
            { IsRead: true },
            { where: { RecipientID: req.params.recipientId, IsRead: false } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE: Clear ALL for a recipient
router.delete('/:recipientId/clear-all', async (req, res) => {
    try {
        await Notification.destroy({
            where: { RecipientID: req.params.recipientId }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Generic single-item routes AFTER the specific ones ─────────────────────

// GET: Fetch all notifications for a recipient
router.get('/:recipientId', async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { RecipientID: req.params.recipientId },
            order: [['CreatedAt', 'DESC']],
            limit: 50
        });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT: Mark single notification as read
router.put('/:notificationId/read', async (req, res) => {
    try {
        await Notification.update(
            { IsRead: true },
            { where: { NotificationID: req.params.notificationId } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE: Remove a single notification
router.delete('/:notificationId', async (req, res) => {
    try {
        const deleted = await Notification.destroy({
            where: { NotificationID: req.params.notificationId }
        });
        if (deleted === 0) return res.status(404).json({ message: 'Notification not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Create a notification
router.post('/', async (req, res) => {
    try {
        const { RecipientID, Type, Title, Message, ReportID } = req.body;
        const notif = await Notification.create({ RecipientID, Type, Title, Message, ReportID });
        res.status(201).json(notif);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Helper exported for use in reports.js ──────────────────────────────────
async function createNotification(recipientId, type, title, message, reportId = null) {
    try {
        await Notification.create({
            RecipientID: String(recipientId),
            Type: type,
            Title: title,
            Message: message,
            ReportID: reportId
        });
    } catch (err) {
        console.error('[Notification] Failed to create:', err.message);
    }
}

module.exports = router;
module.exports.createNotification = createNotification;