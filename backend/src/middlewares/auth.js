const jwt = require("jsonwebtoken");
const config = require("../config/env");
const { AppError } = require("../utils/errors");
const roles = require("../config/roles");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwt.secret);

    // Fetch the full user object
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    req.user = user;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Token expired", 401);
    }
    if (error.name === "JsonWebTokenError") {
      throw new AppError("Invalid token", 401);
    }
    throw error;
  }
};

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    // Handle both array and single role
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      throw new AppError("Insufficient permissions", 403);
    }

    next();
  };
};

const requireCompany = (req, res, next) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  if (roles.isSuperAdmin(req.user.role)) {
    return next();
  }

  if (!req.user.companyId) {
    throw new AppError("Company association required", 403);
  }

  next();
};

const scopedByCompany = (req, res, next) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  if (roles.isSuperAdmin(req.user.role)) {
    return next();
  }

  if (!req.user.companyId) {
    throw new AppError("Company association required", 403);
  }

  req.companyId = req.user.companyId;
  next();
};

module.exports = {
  authenticate,
  authorize,
  requireCompany,
  scopedByCompany,
};
