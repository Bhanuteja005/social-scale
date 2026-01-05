const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoices");
const invoiceValidation = require("../validations/invoices");
const { authenticate, authorize, scopedByCompany } = require("../middlewares/auth");
const roles = require("../config/roles");

router.use(authenticate);

// SUPER_ADMIN can create invoices for any order
router.post(
  "/order/:orderId",
  authorize(roles.SUPER_ADMIN),
  invoiceValidation.validateCreate,
  invoiceController.createInvoice
);

// Company users can view their own invoices
router.get("/", scopedByCompany, invoiceController.getAllInvoices);
router.get("/company/:companyId", invoiceController.getCompanyInvoices);
router.get("/:id", invoiceController.getInvoiceById);
router.get("/:id/download", invoiceController.downloadInvoicePDF);

// Only SUPER_ADMIN can update invoice status
router.put(
  "/:id/status",
  authorize(roles.SUPER_ADMIN),
  invoiceValidation.validateUpdateStatus,
  invoiceController.updateInvoiceStatus
);

module.exports = router;
