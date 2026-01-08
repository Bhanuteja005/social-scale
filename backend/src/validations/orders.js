const Joi = require("joi");

const createOrderSchema = Joi.object({
  service: Joi.string().required().messages({
    "any.required": "Service is required",
  }),
  link: Joi.string().required().messages({
    "any.required": "Link is required",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "any.required": "Quantity is required",
    "number.min": "Quantity must be at least 1",
  }),
  notes: Joi.string().optional(),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      "pending",
      "in_progress",
      "completed",
      "partial",
      "awaiting",
      "canceled",
      "fail"
    )
    .required()
    .messages({
      "any.required": "Status is required",
    }),
  stats: Joi.object({
    startCount: Joi.number().optional(),
    remains: Joi.number().optional(),
    charge: Joi.number().optional(),
    currency: Joi.string().optional(),
  }).optional(),
});

const updateOrderStatsSchema = Joi.object({
  beforeStats: Joi.object({
    count: Joi.number().required(),
    capturedAt: Joi.date().optional(),
  }).optional(),
  afterStats: Joi.object({
    count: Joi.number().required(),
    capturedAt: Joi.date().optional(),
  }).optional(),
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
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
  validateCreate: validate(createOrderSchema),
  validateUpdateStatus: validate(updateOrderStatusSchema),
  validateUpdateStats: validate(updateOrderStatsSchema),
};
