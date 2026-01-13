const Joi = require("joi");

const createSocialAccountSchema = Joi.object({
  companyId: Joi.string().required(),
  platform: Joi.string().required(),
  accountName: Joi.string().required().allow(''),
  accountUrl: Joi.string().uri().required(),
  username: Joi.string().required().allow(""),
  accountType: Joi.string().valid("profile", "page", "channel", "group", "other").optional(),
  notes: Joi.string().optional().allow(""),
  metadata: Joi.object().optional(),
});

const updateSocialAccountSchema = Joi.object({
  accountName: Joi.string().optional(),
  accountUrl: Joi.string().uri().optional(),
  username: Joi.string().optional().allow(""),
  accountType: Joi.string()
    .valid("profile", "page", "channel", "group", "other")
    .optional(),
  notes: Joi.string().optional().allow(""),
  isActive: Joi.boolean().optional(),
  metadata: Joi.object({
    followers: Joi.number().optional(),
    followersLastUpdated: Joi.date().optional(),
    verificationStatus: Joi.string()
      .valid("verified", "unverified", "unknown")
      .optional(),
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
  validateCreate: validate(createSocialAccountSchema),
  validateUpdate: validate(updateSocialAccountSchema),
};
