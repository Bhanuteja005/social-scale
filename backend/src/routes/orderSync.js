const express = require("express");
const router = express.Router();
const orderSyncController = require("../controllers/orderSync");
const { protect, restrictTo } = require("../middlewares/auth");
const roles = require("../config/roles");

// All routes require authentication
router.use(protect);

// Sync single order
router.post("/sync/:id", orderSyncController.syncOrder);

// Admin-only routes for bulk sync
router.use(restrictTo(roles.SUPER_ADMIN));

// Sync multiple orders
router.post("/sync/multiple", orderSyncController.syncMultipleOrders);

// Sync all pending orders
router.post("/sync/pending", orderSyncController.syncPendingOrders);

module.exports = router;
