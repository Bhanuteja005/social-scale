require("express-async-errors");
const app = require("./app");
const config = require("./config/env");
const connectDB = require("./config/db");
const logger = require("./config/logger");
const { scheduleOrderStatusUpdates } = require("./schedulers/orderStatusScheduler");

const start = async () => {
  try {
    await connectDB();

    const server = app.listen(config.port, () => {
      logger.info(
        `Server running in ${config.env} mode on port ${config.port}`
      );
      logger.info(`API base: http://localhost:${config.port}/api/${config.apiVersion}`);
    });

    try {
      scheduleOrderStatusUpdates();
    } catch (err) {
      logger.error("Failed to start order status scheduler", { message: err.message });
    }

    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection", { reason: reason?.message || reason });
    });
    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception", { message: err.message, stack: err.stack });
    });
  } catch (error) {
    logger.error("Failed to start server", { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

if (process.env.VERCEL) {
  connectDB().catch((err) =>
    logger.error("DB connect failed (serverless)", { message: err.message })
  );
  module.exports = app;
} else {
  start();
}
