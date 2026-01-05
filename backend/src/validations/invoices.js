const Joi = require("joi");

const createInvoiceSchema = Joi.object({
  unitPrice: Joi.number().min(0).optional(),
  tax: Joi.number().min(0).optional(),
  discount: Joi.number().min(0).optional(),
  currency: Joi.string().optional(),
  status: Joi.string()
    .valid("draft", "sent", "paid", "overdue", "cancelled")
    .optional(),
  dueDate: Joi.date().optional(),
  notes: Joi.string().allow("").optional(),
  metadata: Joi.object().optional(),
});

const updateInvoiceStatusSchema = Joi.object({
  status: Joi.string()
    .valid("draft", "sent", "paid", "overdue", "cancelled")
    .required()
    .messages({
      "any.required": "Status is required",
    }),
  paidAt: Joi.date().optional(),
  paymentMethod: Joi.string().optional(),
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
  validateCreate: validate(createInvoiceSchema),
  validateUpdateStatus: validate(updateInvoiceStatusSchema),
};
