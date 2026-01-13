const express = require("express");
const router = express.Router();
const socialAccountController = require("../controllers/socialAccounts");
const socialAccountValidation = require("../validations/socialAccounts");
const { authenticate, authorize } = require("../middlewares/auth");
const roles = require("../config/roles");

// All routes require authentication
router.use(authenticate);

// Create social account (SUPER_ADMIN and COMPANY_ADMIN can create)
router.post(
  "/",
  authorize([roles.SUPER_ADMIN, roles.COMPANY_ADMIN]),
  socialAccountValidation.validateCreate,
  socialAccountController.createSocialAccount
);

// Get all social accounts (admin view)
router.get(
  "/",
  authorize(roles.SUPER_ADMIN),
  socialAccountController.getAllSocialAccounts
);

// Get all social accounts for a company
router.get(
  "/company/:companyId",
  authenticate,
  socialAccountController.getCompanySocialAccounts
);

// Get single social account
router.get(
  "/:accountId",
  socialAccountController.getSocialAccountById
);

// Update social account
router.put(
  "/:accountId",
  authorize([roles.SUPER_ADMIN, roles.COMPANY_ADMIN]),
  socialAccountValidation.validateUpdate,
  socialAccountController.updateSocialAccount
);

// Delete social account
router.delete(
  "/:accountId",
  authorize([roles.SUPER_ADMIN, roles.COMPANY_ADMIN]),
  socialAccountController.deleteSocialAccount
);

module.exports = router;
