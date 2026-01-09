const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyId: {
      type: String,
      index: true,
    },
    type: {
      type: String,
      enum: ["success", "info", "warning", "error"],
      default: "info",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      orderId: mongoose.Schema.Types.ObjectId,
      transactionId: mongoose.Schema.Types.ObjectId,
      subscriptionId: mongoose.Schema.Types.ObjectId,
      amount: Number,
      credits: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
