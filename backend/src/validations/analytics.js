const Joi = require("joi");

const getAnalyticsSchema = Joi.object({
  companyId: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  platform: Joi.string()
    .valid("instagram", "facebook", "twitter", "youtube", "tiktok")
    .optional(),
  actionType: Joi.string()
    .valid("followers", "likes", "comments", "shares")
    .optional(),
});

const getTimeBasedAggregationSchema = Joi.object({
  period: Joi.string().valid("hour", "day", "week", "month").default("day"),
  companyId: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors,
      });
    }

    next();
  };
};

module.exports = {
  validateGetAnalytics: validate(getAnalyticsSchema),
  validateGetTimeBasedAggregation: validate(getTimeBasedAggregationSchema),
};
