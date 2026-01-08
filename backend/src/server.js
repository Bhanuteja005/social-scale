require("express-async-errors");
const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./config/logger");
const config = require("./config/env");
const orderSyncService = require("./services/orderSync");
const orderStatusScheduler = require("./schedulers/orderStatusScheduler");

// Global flag to track DB connection status
let isDbConnected = false;

// Initialize database connection
const initializeDB = async () => {
  try {
    await connectDB();
    isDbConnected = true;
    logger.info("Database connected successfully");
    
    // Start order sync service (every 5 minutes)
    if (config.env === "production") {
      orderSyncService.schedulePeriodicSync(5);
    }

    // Start order status update scheduler (every 4 hours)
    orderStatusScheduler.scheduleOrderStatusUpdates();
  } catch (error) {
    logger.error("Failed to connect to database:", error);
    isDbConnected = false;
  }
};

// Initialize DB connection
initializeDB();

// Middleware to check DB connection for critical routes
app.use('/api', (req, res, next) => {
  if (!isDbConnected) {
    logger.error("Database not connected, returning 500");
    return res.status(500).json({
      success: false,
      message: "Database connection failed. Please try again later."
    });
  }
  next();
});

// Export the app for Vercel serverless functions
module.exports = app;

// For local development, start the server
if (require.main === module) {
  const startServer = async () => {
    try {
      const server = app.listen(config.port, () => {
        logger.info(
          `Server running on port ${config.port} in ${config.env} mode`
        );
      });

      process.on("unhandledRejection", (err) => {
        logger.error("UNHANDLED REJECTION! Shutting down...");
        logger.error(err);
        server.close(() => {
          process.exit(1);
        });
      });

      process.on("SIGTERM", () => {
        logger.info("SIGTERM RECEIVED. Shutting down gracefully");
        server.close(() => {
          logger.info("Process terminated!");
        });
      });
    } catch (error) {
      logger.error("Failed to start server:", error);
      process.exit(1);
    }
  };

  startServer();
}
