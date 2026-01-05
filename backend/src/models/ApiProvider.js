const mongoose = require("mongoose");

const apiProviderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Provider name is required"],
      unique: true,
      index: true,
    },
    baseUrl: {
      type: String,
      required: [true, "Base URL is required"],
    },
    apiKey: {
      type: String,
      required: [true, "API key is required"],
      select: false,
    },
    apiSecret: {
      type: String,
      select: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
      index: true,
    },
    config: {
      timeout: {
        type: Number,
        default: 30000,
      },
      retryAttempts: {
        type: Number,
        default: 3,
      },
      retryDelay: {
        type: Number,
        default: 1000,
      },
      sandboxMode: {
        type: Boolean,
        default: false,
      },
    },
    rateLimits: {
      requestsPerMinute: {
        type: Number,
        default: 60,
      },
      requestsPerHour: {
        type: Number,
        default: 1000,
      },
    },
    creditPricing: {
      follower: {
        type: Number,
        default: 0.01,
      },
      like: {
        type: Number,
        default: 0.001,
      },
      comment: {
        type: Number,
        default: 0.005,
      },
      share: {
        type: Number,
        default: 0.01,
      },
    },
    endpoints: {
      followers: String,
      likes: String,
      comments: String,
      shares: String,
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

apiProviderSchema.index({ name: 1, status: 1 });

const ApiProvider = mongoose.model("ApiProvider", apiProviderSchema);

const apiIntegrationLogSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: false, // Optional - some API calls (like getServices, getBalance) may not be company-specific
      index: true,
      sparse: true, // Sparse index - only index documents that have companyId
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiProvider",
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE"],
      required: true,
    },
    requestData: {
      type: mongoose.Schema.Types.Mixed,
    },
    responseData: {
      type: mongoose.Schema.Types.Mixed,
    },
    statusCode: {
      type: Number,
    },
    creditsUsed: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
    },
    success: {
      type: Boolean,
      default: false,
      index: true,
    },
    error: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

apiIntegrationLogSchema.index(
  { companyId: 1, createdAt: -1 },
  { sparse: true }
); // Sparse index for optional companyId
apiIntegrationLogSchema.index({ providerId: 1, success: 1, createdAt: -1 });

const ApiIntegrationLog = mongoose.model(
  "ApiIntegrationLog",
  apiIntegrationLogSchema
);

module.exports = {
  ApiProvider,
  ApiIntegrationLog,
};
