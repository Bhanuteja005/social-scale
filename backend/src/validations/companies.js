const Joi = require("joi");

const createCompanySchema = Joi.object({
  name: Joi.string().required().min(2).max(100).messages({
    "any.required": "Company name is required",
    "string.min": "Company name must be at least 2 characters",
    "string.max": "Company name must not exceed 100 characters",
  }),
  notes: Joi.string().allow(null, "").optional().messages({
    "string.base": "Details must be a string",
  }),
  address: Joi.object({
    street: Joi.string().allow(null, "").optional(),
    city: Joi.string().allow(null, "").optional(),
    state: Joi.string().allow(null, "").optional(),
    zipCode: Joi.string().allow(null, "").optional(),
    country: Joi.string().allow(null, "").optional(),
  }).optional(),
  logo: Joi.string().uri().allow(null, "").optional(),
  billingDetails: Joi.object({
    contactName: Joi.string().allow(null, "").optional(),
    contactEmail: Joi.string().email().allow(null, "").optional(),
    contactPhone: Joi.string().allow(null, "").optional(),
    taxId: Joi.string().allow(null, "").optional(),
    billingAddress: Joi.object({
      street: Joi.string().allow(null, "").optional(),
      city: Joi.string().allow(null, "").optional(),
      state: Joi.string().allow(null, "").optional(),
      zipCode: Joi.string().allow(null, "").optional(),
      country: Joi.string().allow(null, "").optional(),
    }).optional(),
  }).optional(),
  status: Joi.string().valid("active", "inactive", "suspended").optional().messages({
    "any.only": "Status must be active, inactive, or suspended",
  }),
  settings: Joi.object({
    timezone: Joi.string().optional(),
    currency: Joi.string().length(3).optional(),
    invoiceMultiplier: Joi.number().min(1).optional(),
  }).optional(),
  status: Joi.string().valid("active", "inactive", "suspended").optional().messages({
    "any.only": "Status must be active, inactive, or suspended",
  }),
});

const updateCompanySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  logo: Joi.string().uri().allow(null, "").optional(),
  address: Joi.object({
    street: Joi.string().allow(null, "").optional(),
    city: Joi.string().allow(null, "").optional(),
    state: Joi.string().allow(null, "").optional(),
    zipCode: Joi.string().allow(null, "").optional(),
    country: Joi.string().allow(null, "").optional(),
  }).optional(),
  billingDetails: Joi.object({
    contactName: Joi.string().allow(null, "").optional(),
    contactEmail: Joi.string().email().allow(null, "").optional(),
    contactPhone: Joi.string().allow(null, "").optional(),
    taxId: Joi.string().allow(null, "").optional(),
    billingAddress: Joi.object({
      street: Joi.string().allow(null, "").optional(),
      city: Joi.string().allow(null, "").optional(),
      state: Joi.string().allow(null, "").optional(),
      zipCode: Joi.string().allow(null, "").optional(),
      country: Joi.string().allow(null, "").optional(),
    }).optional(),
  }).optional(),
  settings: Joi.object({
    timezone: Joi.string().optional(),
    currency: Joi.string().length(3).optional(),
    invoiceMultiplier: Joi.number().min(1).optional(),
  }).optional(),
  status: Joi.string().valid("active", "inactive", "suspended").optional(),
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
  validateCreate: validate(createCompanySchema),
  validateUpdate: validate(updateCompanySchema),
};
