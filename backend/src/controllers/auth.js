const authService = require("../services/auth");
const { AppError } = require("../utils/errors");

const register = async (req, res, next) => {
  try {
    const userData = req.body;
    const result = await authService.register(userData);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    // req.user is the full user object from authenticate middleware
    const userId = req.user._id || req.user.userId;
    const user = await authService.getCurrentUser(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const result = await authService.changePassword(
      userId,
      oldPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);

    res.status(200).json({
      success: true,
      message: result.message,
      // In production, remove resetToken from response
      ...(result.resetToken && { resetToken: result.resetToken }),
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    const result = await authService.resetPassword(resetToken, newPassword);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const googleAuthCallback = async (req, res, next) => {
  try {
    const user = req.user;
    const tokens = await authService.generateTokens(user);

    // Redirect to frontend with tokens
    const config = require("../config/env");
    const redirectUrl = `${config.frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;

    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getCurrentUser,
  changePassword,
  forgotPassword,
  resetPassword,
  googleAuthCallback,
};
