const Subscription = require("../models/Subscription");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const PricingRule = require("../models/PricingRule");
const { AppError } = require("../utils/errors");
const logger = require("../config/logger");

class SubscriptionService {
  // Get pricing for a plan
  async getPlanPricing(userId, plan) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check for user-specific pricing first, then company, then global
    const pricingRules = await PricingRule.find({
      isActive: true,
      "subscriptionPlans.plan": plan,
      $or: [
        { scope: "user", userId: user._id },
        { scope: "company", companyId: user.companyId },
        { scope: "global" },
      ],
    }).sort({ priority: -1 });

    if (pricingRules.length === 0) {
      // Default pricing if no rules found
      const defaultPricing = {
        growth: { credits: 2500, price: 29, currency: "USD" },
        enterprise: { credits: 10000, price: 99, currency: "USD" },
      };
      return defaultPricing[plan] || null;
    }

    // Get the highest priority rule
    const rule = pricingRules[0];
    const planPricing = rule.subscriptionPlans.find((p) => p.plan === plan);
    
    return planPricing || null;
  }

  // Create subscription
  async createSubscription(userId, planData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const { plan, billingCycle = "monthly", paymentMethod = "mercury", paymentId } = planData;

    // Get pricing for the plan
    const pricing = await this.getPlanPricing(userId, plan);
    if (!pricing) {
      throw new AppError("Invalid subscription plan", 400);
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (billingCycle === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create subscription
    const subscription = await Subscription.create({
      userId: user._id,
      companyId: user.companyId,
      plan,
      credits: pricing.credits,
      price: pricing.price,
      currency: pricing.currency || "USD",
      billingCycle,
      status: "pending",
      startDate,
      endDate,
      autoRenew: false,
      paymentMethod,
      paymentId,
    });

    logger.info(`Subscription created for user ${userId}: ${subscription._id}`);

    return subscription;
  }

  // Activate subscription after successful payment
  async activateSubscription(subscriptionId, paymentId) {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new AppError("Subscription not found", 404);
    }

    const user = await User.findById(subscription.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Update subscription status
    subscription.status = "active";
    subscription.paymentId = paymentId;
    await subscription.save();

    // Add credits to user
    const balanceBefore = user.credits.balance;
    user.credits.balance += subscription.credits;
    user.credits.totalPurchased += subscription.credits;
    user.subscription = {
      plan: subscription.plan,
      status: "active",
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      autoRenew: subscription.autoRenew,
    };
    await user.save();

    // Create transaction record
    await Transaction.create({
      userId: user._id,
      companyId: user.companyId,
      type: "subscription_payment",
      amount: subscription.price,
      currency: subscription.currency,
      credits: subscription.credits,
      balanceBefore,
      balanceAfter: user.credits.balance,
      status: "completed",
      paymentMethod: subscription.paymentMethod,
      paymentId,
      subscriptionId: subscription._id,
      metadata: {
        plan: subscription.plan,
        billingCycle: subscription.billingCycle,
      },
    });

    logger.info(`Subscription activated: ${subscriptionId}, Credits added: ${subscription.credits}`);

    return { subscription, user };
  }

  // Get user subscriptions
  async getUserSubscriptions(userId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    
    const query = { userId };
    if (status) {
      query.status = status;
    }

    const subscriptions = await Subscription.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Subscription.countDocuments(query);

    return {
      subscriptions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId, userId) {
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId,
    });

    if (!subscription) {
      throw new AppError("Subscription not found", 404);
    }

    subscription.status = "canceled";
    subscription.autoRenew = false;
    await subscription.save();

    // Update user subscription status
    const user = await User.findById(userId);
    if (user && user.subscription) {
      user.subscription.status = "canceled";
      user.subscription.autoRenew = false;
      await user.save();
    }

    logger.info(`Subscription canceled: ${subscriptionId}`);

    return subscription;
  }
}

module.exports = new SubscriptionService();
