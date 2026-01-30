const Notification = require("../models/Notification");
const { getPaginationParams } = require("../utils/pagination");
const logger = require("../config/logger");

class NotificationService {
  // Create a notification
  async createNotification(userId, notificationData) {
    try {
      const notification = await Notification.create({
        userId,
        ...notificationData,
      });
      logger.info(`Notification created for user ${userId}: ${notification._id}`);
      return notification;
    } catch (error) {
      logger.error("Error creating notification:", {
        message: error.message,
        userId: userId,
        stack: error.stack
      });
      throw error;
    }
  }

  // Create notification for order
  async notifyOrderCreated(userId, order) {
    return this.createNotification(userId, {
      type: "info",
      title: "Order Created",
      message: `Your order #${order._id.toString().slice(-6)} for ${order.serviceName} has been created successfully.`,
      metadata: {
        orderId: order._id,
        amount: order.amount,
      },
    });
  }

  async notifyOrderCompleted(userId, order) {
    return this.createNotification(userId, {
      type: "success",
      title: "Order Completed",
      message: `Your order #${order._id.toString().slice(-6)} for ${order.serviceName} has been completed successfully!`,
      metadata: {
        orderId: order._id,
      },
    });
  }

  async notifyOrderFailed(userId, order, reason) {
    return this.createNotification(userId, {
      type: "error",
      title: "Order Failed",
      message: `Your order #${order._id.toString().slice(-6)} for ${order.serviceName} has failed. ${reason || ""}`,
      metadata: {
        orderId: order._id,
      },
    });
  }

  // Create notification for payment/subscription
  async notifyPaymentSuccess(userId, subscription) {
    return this.createNotification(userId, {
      type: "success",
      title: "Payment Successful",
      message: `Your payment for ${subscription.credits} credits has been processed successfully!`,
      metadata: {
        subscriptionId: subscription._id,
        credits: subscription.credits,
        amount: subscription.price,
      },
    });
  }

  async notifyPaymentFailed(userId, subscription, reason) {
    return this.createNotification(userId, {
      type: "error",
      title: "Payment Failed",
      message: `Your payment failed. ${reason || "Please try again or contact support."}`,
      metadata: {
        subscriptionId: subscription._id,
      },
    });
  }

  // Create notification for low credits
  async notifyLowCredits(userId, currentBalance) {
    return this.createNotification(userId, {
      type: "warning",
      title: "Low Credit Balance",
      message: `Your credit balance is low (${currentBalance} credits remaining). Please top up to continue placing orders.`,
      metadata: {
        credits: currentBalance,
      },
    });
  }

  // Create notification for low wallet balance
  async notifyLowBalance(userId, currentBalance) {
    return this.createNotification(userId, {
      type: "warning",
      title: "Low Wallet Balance",
      message: `Your wallet balance is low (₹${currentBalance.toFixed(2)} remaining). Please add funds to continue placing orders.`,
      metadata: {
        balance: currentBalance,
      },
    });
  }

  // Create notification for credits added
  async notifyCreditsAdded(userId, amount, reason) {
    return this.createNotification(userId, {
      type: "success",
      title: "Credits Added",
      message: `${amount} credits have been added to your account. ${reason || ""}`,
      metadata: {
        credits: amount,
      },
    });
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      read,
      type,
    } = options;

    const query = { userId };
    if (typeof read === "boolean") query.read = read;
    if (type) query.type = type;

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get unread count
  async getUnreadCount(userId) {
    return Notification.countDocuments({ userId, read: false });
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
    return notification;
  }

  // Mark all as read
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    return result;
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });
    return notification;
  }

  // Delete all notifications for user
  async deleteAllNotifications(userId) {
    const result = await Notification.deleteMany({ userId });
    return result;
  }
}

module.exports = new NotificationService();
