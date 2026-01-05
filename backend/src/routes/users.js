const express = require("express");
const router = express.Router();
const userController = require("../controllers/users");
const userValidation = require("../validations/users");
const { authenticate, authorize } = require("../middlewares/auth");
const roles = require("../config/roles");

// All routes require authentication
router.use(authenticate);

// SUPER_ADMIN can manage users
router.post(
  "/",
  authorize(roles.SUPER_ADMIN),
  userValidation.validateCreate,
  userController.createUser
);

router.get(
  "/",
  authorize(roles.SUPER_ADMIN),
  userController.getAllUsers
);

router.get(
  "/company/:companyId",
  authorize(roles.SUPER_ADMIN),
  userController.getCompanyUsers
);

router.get(
  "/:userId",
  userController.getUserById
);

router.put(
  "/:userId",
  authorize(roles.SUPER_ADMIN),
  userValidation.validateUpdate,
  userController.updateUser
);

router.delete(
  "/:userId",
  authorize(roles.SUPER_ADMIN),
  userController.deleteUser
);

module.exports = router;