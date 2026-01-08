const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orders");
const orderValidation = require("../validations/orders");
const { authenticate, authorize, scopedByCompany } = require("../middlewares/auth");
const roles = require("../config/roles");

router.use(authenticate);

// Get Fampage services
router.get("/services", orderController.getFampageServices);

// SUPER_ADMIN can create orders for any company, COMPANY_USER can create for their company
router.post("/", 
  authorize([roles.SUPER_ADMIN, roles.COMPANY_USER]), 
  orderValidation.validateCreate, 
  orderController.createOrder
);

// Company users can view their own orders
router.get("/", scopedByCompany, orderController.getAllOrders);
router.get("/stats", scopedByCompany, orderController.getOrderStatistics);
router.get("/company/:companyId", orderController.getCompanyOrders);
router.get("/:id", orderController.getOrderById);

// Only SUPER_ADMIN can update orders
router.put(
  "/:id/status",
  authorize(roles.SUPER_ADMIN),
  orderValidation.validateUpdateStatus,
  orderController.updateOrderStatus
);
router.put(
  "/:id/stats",
  authorize(roles.SUPER_ADMIN),
  orderValidation.validateUpdateStats,
  orderController.updateOrderStats
);

module.exports = router;
