const Order = require("../models/Order");
const ApiProvider = require("../models/ApiProvider");
const FampageProvider = require("./FampageProvider");
const logger = require("../config/logger");

class OrderSyncService {
  // Sync single order status from Fampay
  async syncOrderStatus(orderId) {
    const order = await Order.findById(orderId).populate("providerId");
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (!order.apiOrderId) {
      logger.warn(`Order ${orderId} has no API order ID, skipping sync`);
      return order;
    }

    const provider = this.getProviderInstance(order.providerId);
    const result = await provider.getOrderStatus(order.apiOrderId);

    if (!result.success) {
      logger.error(`Failed to sync order ${orderId}: ${result.error}`);
      return order;
    }

    // Update order status based on API response
    const statusMap = {
      Pending: "pending",
      "In progress": "in_progress",
      Processing: "in_progress",
      Completed: "completed",
      Partial: "partial",
      Canceled: "canceled",
      Refunded: "canceled",
    };

    const apiStatus = result.data.status;
    const newStatus = statusMap[apiStatus] || order.status;

    if (newStatus !== order.status) {
      order.status = newStatus;
      
      // Update progress information if available
      if (result.data.start_count !== undefined) {
        order.stats.before.count = result.data.start_count;
      }
      if (result.data.remains !== undefined) {
        const delivered = order.quantity - result.data.remains;
        order.stats.after.count = (order.stats.before.count || 0) + delivered;
        order.stats.after.capturedAt = new Date();
      }

      await order.save();
      logger.info(`Order ${orderId} status updated: ${order.status}`);
    }

    return order;
  }

  // Sync multiple orders
  async syncMultipleOrders(orderIds) {
    const results = [];
    
    for (const orderId of orderIds) {
      try {
        const order = await this.syncOrderStatus(orderId);
        results.push({ orderId, status: "success", order });
      } catch (error) {
        logger.error(`Error syncing order ${orderId}:`, {
          message: error.message,
          stack: error.stack
        });
        results.push({ orderId, status: "error", error: error.message });
      }
    }

    return results;
  }

  // Sync all pending and in-progress orders
  async syncPendingOrders() {
    const orders = await Order.find({
      status: { $in: ["pending", "in_progress"] },
      apiOrderId: { $ne: null, $exists: true },
    }).populate("providerId");

    logger.info(`Syncing ${orders.length} pending/in-progress orders`);

    const results = [];
    for (const order of orders) {
      try {
        const provider = this.getProviderInstance(order.providerId);
        const result = await provider.getOrderStatus(order.apiOrderId);

        if (result.success) {
          const statusMap = {
            Pending: "pending",
            "In progress": "in_progress",
            Processing: "in_progress",
            Completed: "completed",
            Partial: "partial",
            Canceled: "canceled",
            Refunded: "canceled",
          };

          const apiStatus = result.data.status;
          const newStatus = statusMap[apiStatus] || order.status;

          if (newStatus !== order.status) {
            order.status = newStatus;
            
            if (result.data.start_count !== undefined) {
              order.stats.before.count = result.data.start_count;
            }
            if (result.data.remains !== undefined) {
              const delivered = order.quantity - result.data.remains;
              order.stats.after.count = (order.stats.before.count || 0) + delivered;
              order.stats.after.capturedAt = new Date();
            }

            await order.save();
            results.push({
              orderId: order._id,
              apiOrderId: order.apiOrderId,
              oldStatus: order.status,
              newStatus,
              synced: true,
            });
          }
        }
      } catch (error) {
        logger.error(`Error syncing order ${order._id}:`, {
          message: error.message,
          orderId: order._id
        });
        results.push({
          orderId: order._id,
          apiOrderId: order.apiOrderId,
          error: error.message,
          synced: false,
        });
      }
    }

    logger.info(`Synced ${results.filter(r => r.synced).length} orders`);

    return results;
  }

  // Get provider instance
  getProviderInstance(providerConfig) {
    if (providerConfig.name === "Fampage") {
      return new FampageProvider(providerConfig);
    }
    throw new Error(`Unsupported provider: ${providerConfig.name}`);
  }

  // Schedule periodic sync (to be called by cron job or background worker)
  async schedulePeriodicSync(intervalMinutes = 5) {
    logger.info(`Starting periodic order sync every ${intervalMinutes} minutes`);
    
    const sync = async () => {
      try {
        await this.syncPendingOrders();
      } catch (error) {
        logger.error("Error in periodic sync:", {
          message: error.message,
          stack: error.stack
        });
      }
    };

    // Run immediately
    await sync();

    // Then run periodically
    setInterval(sync, intervalMinutes * 60 * 1000);
  }
}

module.exports = new OrderSyncService();
