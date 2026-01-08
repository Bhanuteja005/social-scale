const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/auth");
const authValidation = require("../validations/auth");
const { authenticate, authorize } = require("../middlewares/auth");
const roles = require("../config/roles");

// Google OAuth routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  authController.googleAuthCallback
);

// Public registration - only for first SUPER_ADMIN
router.post(
  "/register",
  authValidation.validateRegister,
  authController.register
);

// Authenticated endpoints
router.post("/login", authValidation.validateLogin, authController.login);
router.post(
  "/refresh-token",
  authValidation.validateRefreshToken,
  authController.refreshToken
);
router.get("/me", authenticate, authController.getCurrentUser);

// Change password - requires authentication
router.post(
  "/change-password",
  authenticate,
  authValidation.validateChangePassword,
  authController.changePassword
);

// Forgot password - public endpoint
router.post(
  "/forgot-password",
  authValidation.validateForgotPassword,
  authController.forgotPassword
);

// Reset password - public endpoint
router.post(
  "/reset-password",
  authValidation.validateResetPassword,
  authController.resetPassword
);

module.exports = router;
