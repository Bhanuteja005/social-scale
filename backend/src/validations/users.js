const Joi = require("joi");
const roles = require("../config/roles");

const validateCreate = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        "string.email": "Please provide a valid email address",
        "any.required": "Email is required",
      }),
    password: Joi.string()
      .min(8)
      .required()
      .messages({
        "string.min": "Password must be at least 8 characters long",
        "any.required": "Password is required",
      }),
    role: Joi.string()
      .valid(...roles.getAll())
      .required()
      .messages({
        "any.only": "Invalid role specified",
        "any.required": "Role is required",
      }),
    companyId: Joi.string()
      .when("role", {
        is: roles.SUPER_ADMIN,
        then: Joi.forbidden(),
        otherwise: Joi.required(),
      })
      .messages({
        "any.required": "Company ID is required for company users",
        "any.unknown": "Company ID should not be provided for SUPER_ADMIN",
      }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

const validateUpdate = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .messages({
        "string.email": "Please provide a valid email address",
      }),
    role: Joi.string()
      .valid(...roles.getAll())
      .messages({
        "any.only": "Invalid role specified",
      }),
    companyId: Joi.string()
      .when("role", {
        is: roles.SUPER_ADMIN,
        then: Joi.valid(null),
        otherwise: Joi.string(),
      })
      .messages({
        "string.base": "Company ID must be a string",
      }),
    status: Joi.string()
      .valid("active", "inactive", "suspended")
      .messages({
        "any.only": "Invalid status specified",
      }),
    profile: Joi.object({
      userType: Joi.string()
        .valid('creator', 'business', 'agency')
        .messages({
          "any.only": "Invalid user type specified",
        }),
      stage: Joi.string()
        .valid('starter', 'scaling', 'monetizing')
        .messages({
          "any.only": "Invalid stage specified",
        }),
      industry: Joi.string()
        .valid('fashion', 'lifestyle', 'fitness', 'entertainment', 'business', 'other')
        .messages({
          "any.only": "Invalid industry specified",
        }),
      goal: Joi.string()
        .valid('growth', 'engagement', 'visibility')
        .messages({
          "any.only": "Invalid goal specified",
        }),
    }).messages({
      "object.base": "Profile must be an object",
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

module.exports = {
  validateCreate,
  validateUpdate,
};