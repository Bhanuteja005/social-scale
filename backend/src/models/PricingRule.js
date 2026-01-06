const mongoose = require("mongoose");

const pricingRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Pricing can be global, per company, or per user
    scope: {
      type: String,
      enum: ["global", "company", "user"],
      default: "global",
      index: true,
    },
    companyId: {
      type: String,
      index: true,
      sparse: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      sparse: true,
    },
    // Service pricing rules
    servicePricing: [
      {
        platform: {
          type: String,
          enum: ["instagram", "facebook", "twitter", "linkedin", "youtube", "tiktok", "threads"],
          required: true,
        },
        serviceType: {
          type: String,
          enum: ["follower", "like", "comment", "view", "subscribe", "share", "retweet"],
          required: true,
        },
        creditsPerUnit: {
          type: Number,
          required: true,
          min: 0.01,
        },
        minQuantity: {
          type: Number,
          default: 1,
        },
        maxQuantity: {
          type: Number,
          default: 100000,
        },
      },
    ],
    // Subscription plan pricing
    subscriptionPlans: [
      {
        plan: {
          type: String,
          enum: ["growth", "enterprise"],
          required: true,
        },
        credits: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        currency: {
          type: String,
          default: "USD",
        },
        billingCycle: {
          type: String,
          enum: ["monthly", "yearly"],
          default: "monthly",
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    priority: {
      type: Number,
      default: 0,
      // Higher priority rules override lower priority ones
      // user > company > global
    },
  },
  {
    timestamps: true,
  }
);

pricingRuleSchema.index({ scope: 1, isActive: 1 });
pricingRuleSchema.index({ companyId: 1, isActive: 1 });
pricingRuleSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model("PricingRule", pricingRuleSchema);
