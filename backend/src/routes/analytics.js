const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics");
const { authenticate, authorize, scopedByCompany } = require("../middlewares/auth");
const roles = require("../config/roles");

router.use(authenticate);

// SUPER_ADMIN can access all analytics
router.get("/dashboard", authorize(roles.SUPER_ADMIN), analyticsController.getStatisticsSummary);
router.get("/stats", authorize(roles.SUPER_ADMIN), analyticsController.getStatisticsSummary);
router.get("/user-growth", authorize(roles.SUPER_ADMIN), analyticsController.getUserGrowthAnalytics);

// Company users can access their own analytics
router.get("/", scopedByCompany, analyticsController.getCompanyAnalytics);
router.get("/target/:targetUrl", scopedByCompany, analyticsController.getOrderDetailsByTarget);

// SUPER_ADMIN can access any company's history, company users only their own
router.get(
  "/company/:companyId/history",
  analyticsController.getCompanyOrderHistory
);

module.exports = router;
