const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notifications");
const { authenticate } = require("../middlewares/auth");

// All routes require authentication
router.use(authenticate);

// Get user notifications
router.get("/", notificationController.getUserNotifications);

// Get unread count
router.get("/unread-count", notificationController.getUnreadCount);

// Mark notification as read
router.put("/:id/read", notificationController.markAsRead);

// Mark all as read
router.put("/mark-all-read", notificationController.markAllAsRead);

// Delete notification
router.delete("/:id", notificationController.deleteNotification);

// Delete all notifications
router.delete("/", notificationController.deleteAllNotifications);

module.exports = router;
