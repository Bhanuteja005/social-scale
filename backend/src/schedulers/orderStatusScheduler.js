const cron = require('node-cron');
const orderService = require('../services/orders');
const logger = require('../config/logger');

// Schedule order status updates every 4 hours
const scheduleOrderStatusUpdates = () => {
  // Run every 4 hours (0 */4 * * *)
  cron.schedule('0 */4 * * *', async () => {
    try {
      logger.info('Running scheduled order status update...');
      const updatedCount = await orderService.updateAllOrderStatuses();
      logger.info(`Scheduled order status update completed. Updated ${updatedCount} orders.`);
    } catch (error) {
      logger.error('Scheduled order status update failed:', error.message);
    }
  });

  logger.info('Order status update scheduler initialized - runs every 4 hours');
};

// Also run immediately on startup (after a short delay)
setTimeout(async () => {
  try {
    logger.info('Running initial order status update on startup...');
    const updatedCount = await orderService.updateAllOrderStatuses();
    logger.info(`Initial order status update completed. Updated ${updatedCount} orders.`);
  } catch (error) {
    logger.error('Initial order status update failed:', error.message);
  }
}, 30000); // 30 seconds after startup

module.exports = {
  scheduleOrderStatusUpdates
};