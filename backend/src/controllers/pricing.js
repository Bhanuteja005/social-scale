const pricingService = require("../services/pricing");

// Create pricing rule (Admin only)
exports.createPricingRule = async (req, res) => {
  const rule = await pricingService.createPricingRule(req.body);

  res.status(201).json({
    success: true,
    data: rule,
    message: "Pricing rule created successfully",
  });
};

// Update pricing rule (Admin only)
exports.updatePricingRule = async (req, res) => {
  const { id } = req.params;
  const rule = await pricingService.updatePricingRule(id, req.body);

  res.json({
    success: true,
    data: rule,
    message: "Pricing rule updated successfully",
  });
};

// Get pricing rules
exports.getPricingRules = async (req, res) => {
  const { scope, companyId, userId, isActive } = req.query;
  
  const rules = await pricingService.getPricingRules({
    scope,
    companyId,
    userId,
    isActive: isActive !== undefined ? isActive === "true" : undefined,
  });

  res.json({
    success: true,
    data: rules,
  });
};

// Delete pricing rule (Admin only)
exports.deletePricingRule = async (req, res) => {
  const { id } = req.params;
  await pricingService.deletePricingRule(id);

  res.json({
    success: true,
    message: "Pricing rule deleted successfully",
  });
};

// Get user-specific pricing
exports.getUserPricing = async (req, res) => {
  const userId = req.params.userId || req.user._id;
  
  const rules = await pricingService.getUserPricing(userId);

  res.json({
    success: true,
    data: rules,
  });
};

// Calculate credits for order
exports.calculateCredits = async (req, res) => {
  const { platform, serviceType, quantity } = req.body;
  const userId = req.user._id;

  const calculation = await pricingService.calculateCredits(
    userId,
    platform,
    serviceType,
    parseInt(quantity)
  );

  res.json({
    success: true,
    data: calculation,
  });
};
