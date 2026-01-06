const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptions");
const { authenticate } = require("../middlewares/auth");

// Razorpay webhook (no auth required)
router.post("/webhook/razorpay", subscriptionController.razorpayWebhook);

// All routes require authentication
router.use(authenticate);

// Get pricing plans
router.get("/plans", subscriptionController.getPricingPlans);

// Get user credits balance
router.get("/credits", subscriptionController.getCreditsBalance);

// Create subscription
router.post("/", subscriptionController.createSubscription);

// Get user subscriptions
router.get("/", subscriptionController.getUserSubscriptions);

// Activate subscription (webhook)
router.post("/activate", subscriptionController.activateSubscription);

// Cancel subscription
router.delete("/:id", subscriptionController.cancelSubscription);

module.exports = router;
