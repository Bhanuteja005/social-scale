const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
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
      enum: ["credit_purchase", "credit_deduction", "credit_refund", "subscription_payment"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    credits: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["mercury", "stripe", "manual", "admin"],
      required: true,
    },
    paymentId: {
      type: String,
      index: true,
      sparse: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      index: true,
      sparse: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
      sparse: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ userId: 1, type: 1, status: 1 });
transactionSchema.index({ companyId: 1, type: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
