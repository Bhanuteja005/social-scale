const Subscription = require("../models/Subscription");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const PricingRule = require("../models/PricingRule");
const { AppError } = require("../utils/errors");
const logger = require("../config/logger");
const config = require("../config/env");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

class SubscriptionService {
  // Get pricing for a plan
  async getPlanPricing(userId, plan) {
    // Return default pricing for now
    const defaultPricing = {
      growth: { credits: 2500, price: 29, currency: "USD" },
      enterprise: { credits: 10000, price: 79, currency: "USD" }, // Fixed: was 99, should be 79
      test: { credits: 2500, price: 1, currency: "INR" }, // Test plan for development
    };
    // Case insensitive lookup
    const normalizedPlan = plan ? plan.toLowerCase() : '';
    return defaultPricing[normalizedPlan] || null;
  }

  // Create Razorpay order
  async createRazorpayOrder(orderData) {
    try {
      const options = {
        amount: orderData.amount, // amount in the smallest currency unit
        currency: orderData.currency || "INR",
        // receipt: orderData.receipt, // Remove receipt for now
        payment_capture: 1, // auto capture
      };

      console.log('Creating Razorpay order with options:', options);
      const order = await razorpay.orders.create(options);
      logger.info(`Razorpay order created: ${order.id}`);
      return order;
    } catch (error) {
      logger.error("Error creating Razorpay order:", error);
      console.error("Razorpay error details:", error.message, error.code, error.metadata);
      throw new AppError("Failed to create payment order", 500);
    }
  }

  // Verify Razorpay payment
  async verifyRazorpayPayment(paymentId, orderId, signature) {
    try {
      console.log('Verifying Razorpay payment:', { paymentId, orderId, signature: signature?.substring(0, 10) + '...' });
      const sign = orderId + "|" + paymentId;
      const expectedSign = crypto
        .createHmac("sha256", config.razorpay.keySecret)
        .update(sign.toString())
        .digest("hex");

      console.log('Expected signature:', expectedSign.substring(0, 10) + '...');
      console.log('Received signature:', signature?.substring(0, 10) + '...');

      if (signature === expectedSign) {
        logger.info('Payment verification successful');
        return true;
      } else {
        logger.error('Payment verification failed - signature mismatch');
        throw new AppError("Payment verification failed", 400);
      }
    } catch (error) {
      logger.error("Error creating Razorpay order:", {
        message: error.message,
        description: error.error?.description,
        code: error.error?.code
      });
      throw error;
    }
  }

  // Create subscription
  async createSubscription(userId, planData) {
    console.log('Creating subscription for userId:', userId, 'planData:', planData);
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const { plan, billingCycle = "monthly", paymentMethod = "razorpay" } = planData;
    console.log('Plan:', plan, 'Billing cycle:', billingCycle, 'Payment method:', paymentMethod);

    // Get pricing for the plan
    const pricing = await this.getPlanPricing(userId, plan);
    console.log('Pricing for plan', plan, ':', pricing);
    if (!pricing || typeof pricing.price !== 'number' || pricing.price <= 0) {
      console.error('Invalid pricing:', pricing);
      throw new AppError("Invalid subscription plan pricing", 400);
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (billingCycle === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create Razorpay order if payment method is razorpay
    let razorpayOrder = null;
    if (paymentMethod === "razorpay") {
      razorpayOrder = await this.createRazorpayOrder({
        amount: Math.round(pricing.price * 100), // Convert to paise (₹1 = 100 paise)
        currency: "INR", // Always INR for Razorpay
      });
    }

    // Create subscription
    const subscription = await Subscription.create({
      userId: user._id,
      companyId: user.companyId,
      plan,
      credits: pricing.credits,
      price: pricing.price,
      currency: pricing.currency || "INR",
      billingCycle,
      status: razorpayOrder ? "pending" : "active", // Active if no payment required
      startDate,
      endDate,
      autoRenew: false,
      paymentMethod,
      razorpayOrderId: razorpayOrder ? razorpayOrder.id : null,
    });

    // Add credits immediately if no payment required
    if (!razorpayOrder) {
      user.credits.balance += pricing.credits;
      user.credits.totalPurchased += pricing.credits;
      await user.save();

      // Create transaction record
      await Transaction.create({
        userId: user._id,
        type: 'credit',
        amount: pricing.credits,
        reason: `Subscription: ${plan}`,
        balanceAfter: user.credits.balance,
      });
    }

    logger.info(`Subscription created for user ${userId}: ${subscription._id}`);

    return { subscription, razorpayOrder };
  }

  // Activate subscription after successful payment
  async activateSubscription(subscriptionId, paymentData) {
    console.log('Activating subscription:', subscriptionId);
    console.log('Payment data:', paymentData);
    
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new AppError("Subscription not found", 404);
    }

    const user = await User.findById(subscription.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = paymentData;

    // Verify Razorpay payment if signature provided (skip for test payments or test plan)
    const isTestPayment = paymentId && paymentId.includes('test');
    const isTestPlan = subscription.plan === 'test';
    if (razorpaySignature && razorpayOrderId && razorpayPaymentId && !isTestPayment && !isTestPlan) {
      console.log('Verifying real Razorpay payment...');
      await this.verifyRazorpayPayment(razorpayPaymentId, razorpayOrderId, razorpaySignature);
    } else if (isTestPayment || isTestPlan) {
      logger.info('Skipping verification for test payment or test plan');
    }

    // Update subscription status
    subscription.status = "active";
    subscription.paymentId = paymentId || razorpayPaymentId;
    if (razorpayOrderId) subscription.razorpayOrderId = razorpayOrderId;
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

    // Create invoice for subscription payment
    try {
      // Create a pseudo-order for invoice generation
      const Order = require("../models/Order");
      const subscriptionOrder = await Order.create({
        companyId: user.companyId,
        userId: user._id,
        serviceId: `subscription_${subscription.plan}`,
        serviceName: `Subscription: ${subscription.plan} Plan`,
        serviceType: "subscription",
        link: "N/A",
        quantity: 1,
        creditsUsed: subscription.credits,
        cost: subscription.price,
        status: "completed",
        paymentId,
        paymentMethod: subscription.paymentMethod,
        subscriptionId: subscription._id,
        metadata: {
          subscriptionDetails: {
            plan: subscription.plan,
            credits: subscription.credits,
            price: subscription.price,
            currency: subscription.currency,
            billingCycle: subscription.billingCycle,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
          },
          paymentDetails: {
            paymentId,
            paymentMethod: subscription.paymentMethod,
            paidAt: new Date(),
          }
        }
      });

      // Create invoice for the subscription order
      const invoiceService = require("./invoices");
      await invoiceService.createInvoice(subscriptionOrder._id, {
        status: 'paid',
        notes: `Subscription payment for ${subscription.plan} plan - ${subscription.credits} credits`,
      });

      logger.info(`Invoice created for subscription: ${subscription._id}`);
    } catch (error) {
      logger.error(`Failed to create invoice for subscription ${subscription._id}:`, error.message);
      // Continue even if invoice creation fails
    }

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
