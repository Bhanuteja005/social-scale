const express = require("express");
const router = express.Router();
const pricingController = require("../controllers/pricing");
const { authenticate, authorize } = require("../middlewares/auth");
const roles = require("../config/roles");

// All routes require authentication
router.use(authenticate);

// Calculate credits for order (any authenticated user)
router.post("/calculate", pricingController.calculateCredits);

// Get user-specific pricing
router.get("/user/:userId?", pricingController.getUserPricing);

// Admin-only routes
router.use(authorize(roles.SUPER_ADMIN));

// Get pricing rules
router.get("/rules", pricingController.getPricingRules);

// Create pricing rule
router.post("/rules", pricingController.createPricingRule);

// Update pricing rule
router.put("/rules/:id", pricingController.updatePricingRule);

// Delete pricing rule
router.delete("/rules/:id", pricingController.deletePricingRule);

module.exports = router;
