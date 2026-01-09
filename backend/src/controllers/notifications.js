const notificationService = require("../services/notifications");

// Get user notifications
exports.getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { page, limit, read, type } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      read: read !== undefined ? read === "true" : undefined,
      type,
    });

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Get unread count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { id } = req.params;

    const notification = await notificationService.markAsRead(id, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const result = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: "All notifications marked as read",
      data: { modified: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
exports.deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { id } = req.params;

    const notification = await notificationService.deleteNotification(id, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    next(error);
  }
};

// Delete all notifications
exports.deleteAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const result = await notificationService.deleteAllNotifications(userId);

    res.json({
      success: true,
      message: "All notifications deleted",
      data: { deleted: result.deletedCount },
    });
  } catch (error) {
    next(error);
  }
};
