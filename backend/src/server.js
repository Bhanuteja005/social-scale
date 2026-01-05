require("express-async-errors");
const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./config/logger");
const config = require("./config/env");

// Connect to database
connectDB().catch((error) => {
  logger.error("Failed to connect to database:", error);
  process.exit(1);
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
