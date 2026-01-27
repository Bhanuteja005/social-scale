const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: false, // Not required for SUPER_ADMIN orders
      index: true,
      default: null,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiProvider",
      required: [true, "Provider ID is required"],
      index: true,
    },
    apiOrderId: {
      type: String,
      required: false, // Make it optional for now
      unique: true,
      index: true,
      sparse: true, // Allow null values for unique index
    },
    serviceId: {
      type: Number,
      required: [true, "Service ID is required"],
    },
    serviceName: {
      type: String,
      required: [true, "Service name is required"],
    },
    platform: {
      type: String,
      required: [true, "Platform is required"],
      enum: [
        "instagram",
        "tiktok",
        "youtube",
        "facebook",
        "twitter",
        "linkedin",
        "threads",
        "other"
      ],
      default: "other",
      index: true,
    },
    serviceType: {
      type: String,
      enum: [
        "like",
        "subscribe",
        "comment",
        "like_to_comment",
        "dislike",
        "dislike_to_comment",
        "repost",
        "friend",
        "vote",
        "retweet",
        "follow",
        "favorite",
        "view",
      ],
      required: [true, "Service type is required"],
      index: true,
    },
    targetUrl: {
      type: String,
      required: [true, "Target URL is required"],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, "Cost cannot be negative"],
    },
    creditsUsed: {
      type: Number,
      default: 0,
      min: [0, "Credits cannot be negative"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "completed",
        "partial",
        "awaiting",
        "canceled",
        "fail",
      ],
      default: "pending",
      index: true,
    },
    stats: {
      before: {
        count: {
          type: Number,
          default: null,
        },
        capturedAt: {
          type: Date,
          default: null,
        },
      },
      after: {
        count: {
          type: Number,
          default: null,
        },
        capturedAt: {
          type: Date,
          default: null,
        },
      },
      startCount: {
        type: Number,
        default: null,
      },
      remains: {
        type: Number,
        default: null,
      },
      charge: {
        type: Number,
        default: null,
      },
      currency: {
        type: String,
        default: "USD",
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
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

orderSchema.index({ companyId: 1, status: 1, submittedAt: -1 });
orderSchema.index({ companyId: 1, serviceType: 1, submittedAt: -1 });
orderSchema.index({ companyId: 1, targetUrl: 1, submittedAt: -1 });
orderSchema.index({ companyId: 1, createdAt: -1 });

orderSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    (this.status === "completed" ||
      this.status === "canceled" ||
      this.status === "fail") &&
    !this.completedAt
  ) {
    this.completedAt = new Date();
  }

  this.updatedAt = new Date();
  next();
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
