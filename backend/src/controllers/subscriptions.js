const subscriptionService = require("../services/subscriptions");
const { AppError } = require("../utils/errors");
const config = require("../config/env");
const crypto = require("crypto");

// Get pricing plans
exports.getPricingPlans = async (req, res) => {
  const { plan } = req.query;
  const userId = req.user._id;

  if (plan) {
    const pricing = await subscriptionService.getPlanPricing(userId, plan);
    if (!pricing) {
      throw new AppError("Invalid plan", 400);
    }
    return res.json({
      success: true,
      data: { plan, ...pricing },
    });
  }

  // Return all plans
  const growth = await subscriptionService.getPlanPricing(userId, "growth");
  const enterprise = await subscriptionService.getPlanPricing(userId, "enterprise");

  res.json({
    success: true,
    data: {
      plans: [
        {
          name: "free",
          credits: 0,
          price: 0,
          currency: "INR",
          features: ["Access 3 Platforms", "Up to 500 Credits"],
        },
        {
          name: "growth",
          ...growth,
          features: ["Access 7 Platforms", "Scale to 20k Credits", "Priority Support"],
        },
        {
          name: "enterprise",
          ...enterprise,
          features: ["All Platforms", "Unlimited Credits", "24/7 Support", "Custom Pricing"],
        },
      ],
    },
  });
};

// Create subscription
exports.createSubscription = async (req, res) => {
  const userId = req.user._id;
  const result = await subscriptionService.createSubscription(userId, req.body);

  res.status(201).json({
    success: true,
    data: result,
  });
};

// Activate subscription (webhook from payment gateway)
exports.activateSubscription = async (req, res) => {
  const { subscriptionId, paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const result = await subscriptionService.activateSubscription(subscriptionId, {
    paymentId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  res.json({
    success: true,
    data: result,
    message: "Subscription activated successfully",
  });
};

// Get user subscriptions
exports.getUserSubscriptions = async (req, res) => {
  const userId = req.user._id;
  const { page, limit, status } = req.query;

  const result = await subscriptionService.getUserSubscriptions(userId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    status,
  });

  res.json({
    success: true,
    data: result.subscriptions,
    pagination: result.pagination,
  });
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const subscription = await subscriptionService.cancelSubscription(id, userId);

  res.json({
    success: true,
    data: subscription,
    message: "Subscription canceled successfully",
  });
};

// Get user credits balance
exports.getCreditsBalance = async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    data: {
      balance: user.credits.balance,
      totalPurchased: user.credits.totalPurchased,
      totalSpent: user.credits.totalSpent,
      subscription: user.subscription,
    },
  });
};

// Razorpay webhook handler
exports.razorpayWebhook = async (req, res) => {
  try {
    const secret = config.razorpay.keySecret;
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;

    if (event === 'payment.captured') {
      // Find subscription by Razorpay order ID
      const subscription = await require("../models/Subscription").findOne({
        razorpayOrderId: paymentEntity.order_id,
      });

      if (subscription && subscription.status === 'pending') {
        await subscriptionService.activateSubscription(subscription._id, {
          paymentId: paymentEntity.id,
          razorpayOrderId: paymentEntity.order_id,
          razorpayPaymentId: paymentEntity.id,
        });
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
