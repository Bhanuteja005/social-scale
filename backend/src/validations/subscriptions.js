const Joi = require("joi");

const createSubscriptionSchema = Joi.object({
  plan: Joi.string().valid("growth", "enterprise").required(),
  billingCycle: Joi.string().valid("monthly", "yearly").default("monthly"),
  paymentMethod: Joi.string().valid("mercury", "stripe", "manual").default("mercury"),
  paymentId: Joi.string().optional(),
});

const activateSubscriptionSchema = Joi.object({
  subscriptionId: Joi.string().required(),
  paymentId: Joi.string().required(),
});

module.exports = {
  createSubscriptionSchema,
  activateSubscriptionSchema,
};
