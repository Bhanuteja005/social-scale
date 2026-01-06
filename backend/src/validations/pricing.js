const Joi = require("joi");

const servicePricingSchema = Joi.object({
  platform: Joi.string()
    .valid("instagram", "facebook", "twitter", "linkedin", "youtube", "tiktok", "threads")
    .required(),
  serviceType: Joi.string()
    .valid("follower", "like", "comment", "view", "subscribe", "share", "retweet")
    .required(),
  creditsPerUnit: Joi.number().min(0.01).required(),
  minQuantity: Joi.number().integer().min(1).default(1),
  maxQuantity: Joi.number().integer().min(1).default(100000),
});

const subscriptionPlanSchema = Joi.object({
  plan: Joi.string().valid("growth", "enterprise").required(),
  credits: Joi.number().integer().min(1).required(),
  price: Joi.number().min(0).required(),
  currency: Joi.string().default("USD"),
  billingCycle: Joi.string().valid("monthly", "yearly").default("monthly"),
});

const createPricingRuleSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  scope: Joi.string().valid("global", "company", "user").default("global"),
  companyId: Joi.string().when("scope", {
    is: "company",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  userId: Joi.string().when("scope", {
    is: "user",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  servicePricing: Joi.array().items(servicePricingSchema).optional(),
  subscriptionPlans: Joi.array().items(subscriptionPlanSchema).optional(),
  isActive: Joi.boolean().default(true),
});

const updatePricingRuleSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  servicePricing: Joi.array().items(servicePricingSchema).optional(),
  subscriptionPlans: Joi.array().items(subscriptionPlanSchema).optional(),
  isActive: Joi.boolean().optional(),
});

const calculateCreditsSchema = Joi.object({
  platform: Joi.string()
    .valid("instagram", "facebook", "twitter", "linkedin", "youtube", "tiktok", "threads")
    .required(),
  serviceType: Joi.string()
    .valid("follower", "like", "comment", "view", "subscribe", "share", "retweet")
    .required(),
  quantity: Joi.number().integer().min(1).required(),
});

module.exports = {
  createPricingRuleSchema,
  updatePricingRuleSchema,
  calculateCreditsSchema,
};
