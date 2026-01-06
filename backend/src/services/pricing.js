const PricingRule = require("../models/PricingRule");
const User = require("../models/User");
const { AppError } = require("../utils/errors");
const logger = require("../config/logger");

class PricingService {
  // Get applicable pricing rules for a user/company
  async getApplicablePricing(userId, platform, serviceType) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Find all applicable pricing rules (user > company > global)
    const rules = await PricingRule.find({
      isActive: true,
      "servicePricing.platform": platform,
      "servicePricing.serviceType": serviceType,
      $or: [
        { scope: "user", userId: user._id },
        { scope: "company", companyId: user.companyId },
        { scope: "global" },
      ],
    }).sort({ priority: -1, updatedAt: -1 });

    if (rules.length === 0) {
      // Return default pricing if no rules found
      return this.getDefaultPricing(platform, serviceType);
    }

    // Get the highest priority rule
    const rule = rules[0];
    const pricing = rule.servicePricing.find(
      (p) => p.platform === platform && p.serviceType === serviceType
    );

    return pricing || this.getDefaultPricing(platform, serviceType);
  }

  // Default pricing fallback
  getDefaultPricing(platform, serviceType) {
    const defaults = {
      instagram: {
        follower: { creditsPerUnit: 5, minQuantity: 10, maxQuantity: 100000 },
        like: { creditsPerUnit: 0.2, minQuantity: 10, maxQuantity: 100000 },
        comment: { creditsPerUnit: 10, minQuantity: 5, maxQuantity: 10000 },
        view: { creditsPerUnit: 0.1, minQuantity: 100, maxQuantity: 1000000 },
      },
      facebook: {
        follower: { creditsPerUnit: 5, minQuantity: 10, maxQuantity: 100000 },
        like: { creditsPerUnit: 0.2, minQuantity: 10, maxQuantity: 100000 },
      },
      twitter: {
        follower: { creditsPerUnit: 5, minQuantity: 10, maxQuantity: 100000 },
        retweet: { creditsPerUnit: 2, minQuantity: 10, maxQuantity: 50000 },
        like: { creditsPerUnit: 0.2, minQuantity: 10, maxQuantity: 100000 },
      },
      linkedin: {
        follower: { creditsPerUnit: 20, minQuantity: 10, maxQuantity: 50000 },
        like: { creditsPerUnit: 10, minQuantity: 5, maxQuantity: 10000 },
      },
      youtube: {
        subscriber: { creditsPerUnit: 10, minQuantity: 10, maxQuantity: 100000 },
        view: { creditsPerUnit: 0.05, minQuantity: 100, maxQuantity: 1000000 },
        like: { creditsPerUnit: 1, minQuantity: 10, maxQuantity: 50000 },
      },
      tiktok: {
        follower: { creditsPerUnit: 5, minQuantity: 10, maxQuantity: 100000 },
        like: { creditsPerUnit: 0.2, minQuantity: 10, maxQuantity: 100000 },
        view: { creditsPerUnit: 0.1, minQuantity: 100, maxQuantity: 1000000 },
      },
    };

    return (
      defaults[platform]?.[serviceType] || {
        creditsPerUnit: 1,
        minQuantity: 1,
        maxQuantity: 100000,
      }
    );
  }

  // Calculate credits required for an order
  async calculateCredits(userId, platform, serviceType, quantity) {
    const pricing = await this.getApplicablePricing(userId, platform, serviceType);
    
    if (quantity < pricing.minQuantity || quantity > pricing.maxQuantity) {
      throw new AppError(
        `Quantity must be between ${pricing.minQuantity} and ${pricing.maxQuantity}`,
        400
      );
    }

    const creditsRequired = Math.ceil(quantity * pricing.creditsPerUnit);
    
    return {
      creditsRequired,
      creditsPerUnit: pricing.creditsPerUnit,
      quantity,
      platform,
      serviceType,
    };
  }

  // Create pricing rule (Admin only)
  async createPricingRule(ruleData) {
    const { scope, companyId, userId, servicePricing, subscriptionPlans } = ruleData;

    // Validate scope-specific data
    if (scope === "company" && !companyId) {
      throw new AppError("Company ID required for company-scoped pricing", 400);
    }
    if (scope === "user" && !userId) {
      throw new AppError("User ID required for user-scoped pricing", 400);
    }

    // Set priority based on scope
    let priority = 0;
    if (scope === "company") priority = 10;
    if (scope === "user") priority = 20;

    const rule = await PricingRule.create({
      ...ruleData,
      priority,
    });

    logger.info(`Pricing rule created: ${rule._id}, scope: ${scope}`);

    return rule;
  }

  // Update pricing rule
  async updatePricingRule(ruleId, updates) {
    const rule = await PricingRule.findByIdAndUpdate(ruleId, updates, {
      new: true,
      runValidators: true,
    });

    if (!rule) {
      throw new AppError("Pricing rule not found", 404);
    }

    logger.info(`Pricing rule updated: ${ruleId}`);

    return rule;
  }

  // Get all pricing rules
  async getPricingRules(filters = {}) {
    const { scope, companyId, userId, isActive } = filters;
    
    const query = {};
    if (scope) query.scope = scope;
    if (companyId) query.companyId = companyId;
    if (userId) query.userId = userId;
    if (isActive !== undefined) query.isActive = isActive;

    const rules = await PricingRule.find(query)
      .sort({ priority: -1, updatedAt: -1 })
      .populate("userId", "email");

    return rules;
  }

  // Delete pricing rule
  async deletePricingRule(ruleId) {
    const rule = await PricingRule.findByIdAndDelete(ruleId);
    
    if (!rule) {
      throw new AppError("Pricing rule not found", 404);
    }

    logger.info(`Pricing rule deleted: ${ruleId}`);

    return rule;
  }

  // Get user's effective pricing
  async getUserPricing(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const rules = await PricingRule.find({
      isActive: true,
      $or: [
        { scope: "user", userId: user._id },
        { scope: "company", companyId: user.companyId },
        { scope: "global" },
      ],
    }).sort({ priority: -1 });

    return rules;
  }
}

module.exports = new PricingService();
