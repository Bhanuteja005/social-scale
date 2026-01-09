const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
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
    plan: {
      type: String,
      enum: ["free", "growth", "enterprise", "test"],
      required: true,
      default: "free",
    },
    credits: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly", "one-time"],
      default: "monthly",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "canceled", "expired", "pending"],
      default: "pending",
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ["mercury", "stripe", "razorpay", "manual"],
      default: "razorpay",
    },
    paymentId: {
      type: String,
      index: true,
      sparse: true,
    },
    razorpayOrderId: {
      type: String,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ companyId: 1, status: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
