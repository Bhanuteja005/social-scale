const mongoose = require("mongoose");
const logger = require("./logger");
const config = require("./env");

// Set global mongoose options
mongoose.set('bufferTimeoutMS', 120000);
mongoose.set('bufferCommands', true);

const connectDB = async (retries = 3) => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 120000, // Increase timeout to 120 seconds
      socketTimeoutMS: 120000, // Socket timeout
      connectTimeoutMS: 120000, // Connection timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    return conn;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    if (retries > 0) {
      logger.info(`Retrying connection... ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      return connectDB(retries - 1);
    }
    throw error; // Throw instead of exit for serverless
  }
};

module.exports = connectDB;
