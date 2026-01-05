const Joi = require("joi");

const createProviderSchema = Joi.object({
  name: Joi.string().required().min(2).max(50).messages({
    "any.required": "Provider name is required",
    "string.min": "Provider name must be at least 2 characters",
    "string.max": "Provider name must not exceed 50 characters",
  }),
  baseUrl: Joi.string().uri().required().messages({
    "any.required": "Base URL is required",
    "string.uri": "Base URL must be a valid URI",
  }),
  apiKey: Joi.string().required().messages({
    "any.required": "API key is required",
  }),
  apiSecret: Joi.string().allow(null, "").optional(),
  status: Joi.string().valid("active", "inactive", "maintenance").optional(),
  config: Joi.object({
    timeout: Joi.number().min(1000).optional(),
    retryAttempts: Joi.number().min(1).max(10).optional(),
    retryDelay: Joi.number().min(100).optional(),
    sandboxMode: Joi.boolean().optional(),
  }).optional(),
  rateLimits: Joi.object({
    requestsPerMinute: Joi.number().min(1).optional(),
    requestsPerHour: Joi.number().min(1).optional(),
  }).optional(),
  creditPricing: Joi.object({
    follower: Joi.number().min(0).optional(),
    like: Joi.number().min(0).optional(),
    comment: Joi.number().min(0).optional(),
    share: Joi.number().min(0).optional(),
  }).optional(),
  endpoints: Joi.object({
    followers: Joi.string().allow(null, "").optional(),
    likes: Joi.string().allow(null, "").optional(),
    comments: Joi.string().allow(null, "").optional(),
    shares: Joi.string().allow(null, "").optional(),
  }).optional(),
});

const updateProviderSchema = Joi.object({
  baseUrl: Joi.string().uri().optional(),
  apiKey: Joi.string().optional(),
  apiSecret: Joi.string().allow(null, "").optional(),
  status: Joi.string().valid("active", "inactive", "maintenance").optional(),
  config: Joi.object({
    timeout: Joi.number().min(1000).optional(),
    retryAttempts: Joi.number().min(1).max(10).optional(),
    retryDelay: Joi.number().min(100).optional(),
    sandboxMode: Joi.boolean().optional(),
  }).optional(),
  rateLimits: Joi.object({
    requestsPerMinute: Joi.number().min(1).optional(),
    requestsPerHour: Joi.number().min(1).optional(),
  }).optional(),
  creditPricing: Joi.object({
    follower: Joi.number().min(0).optional(),
    like: Joi.number().min(0).optional(),
    comment: Joi.number().min(0).optional(),
    share: Joi.number().min(0).optional(),
  }).optional(),
  endpoints: Joi.object({
    followers: Joi.string().allow(null, "").optional(),
    likes: Joi.string().allow(null, "").optional(),
    comments: Joi.string().allow(null, "").optional(),
    shares: Joi.string().allow(null, "").optional(),
  }).optional(),
});

const executeApiCallSchema = Joi.object({
  endpoint: Joi.string().required().messages({
    "any.required": "Endpoint is required",
  }),
  method: Joi.string().valid("GET", "POST", "PUT", "DELETE").default("GET"),
  data: Joi.object().optional(),
});

const addOrderSchema = Joi.object({
  companyId: Joi.string().required().messages({
    "any.required": "Company ID is required",
  }),
  service: Joi.number().integer().required().messages({
    "any.required": "Service ID is required",
    "number.base": "Service ID must be a number",
  }),
  link: Joi.string().required().messages({
    "any.required": "Link is required",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "any.required": "Quantity is required",
    "number.min": "Quantity must be at least 1",
    "number.integer": "Quantity must be an integer",
  }),
  serviceName: Joi.string().optional(),
  serviceType: Joi.string().optional(),
  cost: Joi.number().min(0).optional(),
  invoiceMultiplier: Joi.number().min(0.01).optional().messages({
    "number.min": "Invoice multiplier must be greater than 0",
  }),
});

const getOrderStatusSchema = Joi.object({
  orderId: Joi.alternatives()
    .try(Joi.string(), Joi.number())
    .required()
    .messages({
      "any.required": "Order ID is required",
    }),
});

const getOrdersStatusQuerySchema = Joi.object({
  orderIds: Joi.string().required().messages({
    "any.required":
      "Order IDs are required (comma-separated string, e.g., 1,2,3)",
  }),
});

const validateQuery = (schema) => {
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

const refillOrderSchema = Joi.object({
  orderId: Joi.alternatives()
    .try(Joi.string(), Joi.number())
    .required()
    .messages({
      "any.required": "Order ID is required",
    }),
});

const cancelOrderSchema = Joi.object({
  orderId: Joi.alternatives()
    .try(Joi.string(), Joi.number())
    .required()
    .messages({
      "any.required": "Order ID is required",
    }),
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
  validateCreate: validate(createProviderSchema),
  validateUpdate: validate(updateProviderSchema),
  validateExecuteApiCall: validate(executeApiCallSchema),
  validateAddOrder: validate(addOrderSchema),
  validateGetOrderStatus: validate(getOrderStatusSchema),
  validateGetOrdersStatus: validateQuery(getOrdersStatusQuerySchema),
  validateRefillOrder: validate(refillOrderSchema),
  validateCancelOrder: validate(cancelOrderSchema),
};
