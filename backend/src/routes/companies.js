const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companies");
const companyValidation = require("../validations/companies");
const {
  authenticate,
  authorize,
  scopedByCompany,
} = require("../middlewares/auth");
const roles = require("../config/roles");

router.post(
  "/",
  authenticate,
  companyValidation.validateCreate,
  companyController.createCompany
);

router.get(
  "/",
  authenticate,
  authorize(roles.SUPER_ADMIN),
  companyController.getAllCompanies
);

router.get(
  "/:companyId",
  authenticate,
  companyController.getCompanyById
);

router.put(
  "/:companyId",
  authenticate,
  authorize(roles.SUPER_ADMIN),
  companyValidation.validateUpdate,
  companyController.updateCompany
);

router.delete(
  "/:companyId",
  authenticate,
  authorize(roles.SUPER_ADMIN),
  companyController.deleteCompany
);

router.post(
  "/:companyId/restore",
  authenticate,
  authorize(roles.SUPER_ADMIN),
  companyController.restoreCompany
);

module.exports = router;
