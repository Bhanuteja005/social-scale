const Joi = require("joi");

const createOrderSchema = Joi.object({
  companyId: Joi.string().required().messages({
    "any.required": "Company ID is required",
  }),
  providerId: Joi.string().required().messages({
    "any.required": "Provider ID is required",
  }),
  apiOrderId: Joi.string().required().messages({
    "any.required": "API Order ID is required",
  }),
  serviceId: Joi.number().integer().required().messages({
    "any.required": "Service ID is required",
  }),
  serviceName: Joi.string().required().messages({
    "any.required": "Service name is required",
  }),
  serviceType: Joi.string()
    .valid(
      "like",
      "subscribe",
      "comment",
      "like_to_comment",
      "dislike",
      "dislike_to_comment",
      "repost",
      "friend",
      "vote",
      "retweet",
      "follow",
      "favorite"
    )
    .required()
    .messages({
      "any.required": "Service type is required",
    }),
  targetUrl: Joi.string().required().messages({
    "any.required": "Target URL is required",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "any.required": "Quantity is required",
    "number.min": "Quantity must be at least 1",
  }),
  cost: Joi.number().min(0).optional(),
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
    .optional(),
  stats: Joi.object({
    before: Joi.object({
      count: Joi.number().optional(),
      capturedAt: Joi.date().optional(),
    }).optional(),
    after: Joi.object({
      count: Joi.number().optional(),
      capturedAt: Joi.date().optional(),
    }).optional(),
  }).optional(),
  metadata: Joi.object().optional(),
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
