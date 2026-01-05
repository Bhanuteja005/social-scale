const mongoose = require("mongoose");

const analyticsSummarySchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ["instagram", "facebook", "twitter", "youtube", "tiktok"],
      index: true,
    },
    actionType: {
      type: String,
      enum: ["followers", "likes", "comments", "shares"],
      index: true,
    },
    metrics: {
      totalRequested: {
        type: Number,
        default: 0,
      },
      totalDelivered: {
        type: Number,
        default: 0,
      },
      delta: {
        type: Number,
        default: 0,
      },
      completionRate: {
        type: Number,
        default: 0,
      },
      totalCost: {
        type: Number,
        default: 0,
      },
      totalCredits: {
        type: Number,
        default: 0,
      },
      transactionCount: {
        type: Number,
        default: 0,
      },
      completedCount: {
        type: Number,
        default: 0,
      },
      partialCount: {
        type: Number,
        default: 0,
      },
      failedCount: {
        type: Number,
        default: 0,
      },
    },
    anomalies: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

analyticsSummarySchema.index({ companyId: 1, date: -1 });
analyticsSummarySchema.index({ companyId: 1, platform: 1, date: -1 });
analyticsSummarySchema.index({ companyId: 1, actionType: 1, date: -1 });
analyticsSummarySchema.index(
  { companyId: 1, date: -1, platform: 1, actionType: 1 },
  { unique: true }
);

const AnalyticsSummary = mongoose.model(
  "AnalyticsSummary",
  analyticsSummarySchema
);

module.exports = AnalyticsSummary;
