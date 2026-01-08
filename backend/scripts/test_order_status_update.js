require("dotenv").config();
const mongoose = require("mongoose");
const orderService = require("../src/services/orders");
const logger = require("../src/config/logger");

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.DATABASE_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/social_scale");
    logger.info("Database connected for testing");
  } catch (error) {
    logger.error("Database connection failed:", error);
    process.exit(1);
  }
}

// Test order status update
async function testOrderStatusUpdate() {
  try {
    await connectDB();

    logger.info("Testing order status update...");

    // Get all orders with apiOrderId
    const Order = require("../src/models/Order");
    const orders = await Order.find({
      apiOrderId: { $exists: true, $ne: null }
    }).limit(5);

    logger.info(`Found ${orders.length} orders with API order IDs`);

    for (const order of orders) {
      logger.info(`Checking order ${order._id} with Fampage ID ${order.apiOrderId} (status: ${order.status})`);

      const updatedOrder = await orderService.updateOrderStatusFromFampage(order._id);

      if (updatedOrder) {
        logger.info(`Order ${order._id} status: ${updatedOrder.status}`);
      } else {
        logger.info(`Failed to update order ${order._id}`);
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logger.info("Order status update test completed");

  } catch (error) {
    logger.error("Test failed:", error.message);
  } finally {
    await mongoose.connection.close();
    logger.info("Database connection closed");
  }
}

testOrderStatusUpdate();