const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  AppError,
  NotFoundError,
  UnauthorizedError,
} = require("../utils/errors");
const config = require("../config/env");
const roles = require("../config/roles");

const generateTokens = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    companyId: user.companyId || null,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessTokenExpiry,
  });

  const refreshToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshTokenExpiry,
  });

  return { accessToken, refreshToken };
};

const register = async (userData) => {
  const { name, email, password, role = roles.COMPANY_USER, companyId } = userData;

  // Validate role
  if (!roles.getAll().includes(role)) {
    throw new AppError("Invalid role specified", 400);
  }

  // SUPER_ADMIN restrictions
  if (role === roles.SUPER_ADMIN) {
    const existingSuperAdmin = await User.findOne({ role: roles.SUPER_ADMIN });
    if (existingSuperAdmin) {
      throw new AppError(
        "SUPER_ADMIN already exists. Cannot create another SUPER_ADMIN.",
        403
      );
    }
    // SUPER_ADMIN doesn't need companyId
  } else if (role === roles.COMPANY_USER || role === roles.COMPANY_ADMIN) {
    // For COMPANY_USER and COMPANY_ADMIN, ensure they have a companyId
    if (companyId) {
      // If companyId is provided, verify it exists
      const Company = require("../models/Company");
      const company = await Company.findOne({ companyId, deletedAt: null });
      if (!company) {
        throw new AppError("Invalid company ID or company not found", 400);
      }
    } else {
      // Auto-assign to default company if no companyId provided
      const Company = require("../models/Company");
      let defaultCompany = await Company.findOne({ name: "Default Company", deletedAt: null });
      
      if (!defaultCompany) {
        // Create default company if it doesn't exist
        defaultCompany = await Company.create({
          name: "Default Company",
          notes: "Auto-created company for new user registrations",
          address: {
            street: "N/A",
            city: "N/A",
            state: "N/A",
            zipCode: "000000",
            country: "India",
          },
          billingDetails: {
            gstin: "N/A",
            billingEmail: "billing@socialscale.com",
          },
          status: "active",
        });
      }
      
      userData.companyId = defaultCompany.companyId;
    }
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    companyId: role === roles.SUPER_ADMIN ? null : userData.companyId,
    status: "active",
  });

  const tokens = generateTokens(user);
  const userObj = user.toJSON();

  return {
    user: userObj,
    ...tokens,
  };
};

const login = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (user.status !== "active") {
    throw new UnauthorizedError("Account is not active");
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  user.lastLogin = new Date();
  await user.save();

  const tokens = generateTokens(user);
  const userObj = user.toJSON();

  return {
    user: userObj,
    ...tokens,
  };
};

const refreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await User.findById(decoded.userId);
    if (!user || user.status !== "active") {
      throw new UnauthorizedError("User not found or inactive");
    }

    const tokens = generateTokens(user);
    return tokens;
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
    throw error;
  }
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }
  return user.toJSON();
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new NotFoundError("User");
  }

  if (user.status !== "active") {
    throw new UnauthorizedError("Account is not active");
  }

  const isPasswordValid = await user.comparePassword(oldPassword);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  return { message: "Password changed successfully" };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  // Don't reveal if user exists or not for security
  if (!user) {
    return {
      message: "If the email exists, a password reset link will be sent",
    };
  }

  if (user.status !== "active") {
    return {
      message: "If the email exists, a password reset link will be sent",
    };
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // In production, send email with reset token
  // For now, return token in response (should be removed in production)
  // TODO: Integrate email service (e.g., SendGrid, AWS SES, Nodemailer)
  // Example: await emailService.sendPasswordResetEmail(user.email, resetToken);

  return {
    message: "Password reset token generated",
    resetToken, // Remove this in production, send via email instead
  };
};

const resetPassword = async (resetToken, newPassword) => {
  const crypto = require("crypto");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  if (user.status !== "active") {
    throw new UnauthorizedError("Account is not active");
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return { message: "Password reset successfully" };
};

module.exports = {
  register,
  login,
  refreshToken,
  getCurrentUser,
  changePassword,
  forgotPassword,
  resetPassword,
  generateTokens,
};
