const express = require("express");
const router = express.Router();
const apiIntegrationController = require("../controllers/apiIntegrations");
const apiIntegrationValidation = require("../validations/apiIntegrations");
const {
  authenticate,
  authorize,
  scopedByCompany,
} = require("../middlewares/auth");
const roles = require("../config/roles");

router.use(authenticate);

// Integration logs (SUPER_ADMIN only)
router.get(
  "/logs",
  authorize(roles.SUPER_ADMIN),
  apiIntegrationController.getIntegrationLogs
);

// Fampage-specific endpoints
// Note: No providerId needed - Fampage is auto-managed from FAMPAGE_API_KEY env var
router.get(
  "/services",
  authorize(roles.SUPER_ADMIN, roles.COMPANY_USER),
  apiIntegrationController.getServices
);

router.post(
  "/orders",
  authorize(roles.SUPER_ADMIN),
  apiIntegrationValidation.validateAddOrder,
  apiIntegrationController.addOrder
);

router.get(
  "/orders/:orderId/status",
  authorize(roles.SUPER_ADMIN),
  apiIntegrationController.getOrderStatus
);

router.get(
  "/orders/status",
  authorize(roles.SUPER_ADMIN),
  apiIntegrationValidation.validateGetOrdersStatus,
  apiIntegrationController.getOrdersStatus
);

router.post(
  "/orders/:orderId/refill",
  authorize(roles.SUPER_ADMIN),
  apiIntegrationController.refillOrder
);

router.get(
  "/balance",
  authorize(roles.SUPER_ADMIN),
  apiIntegrationController.getBalance
);

router.post(
  "/orders/:orderId/cancel",
  authorize(roles.SUPER_ADMIN),
  apiIntegrationController.cancelOrder
);

module.exports = router;
