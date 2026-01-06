const express = require("express");
const router = express.Router();
const orderSyncController = require("../controllers/orderSync");
const { authenticate, authorize } = require("../middlewares/auth");
const roles = require("../config/roles");

// All routes require authentication
router.use(authenticate);

// Sync single order
router.post("/sync/:id", orderSyncController.syncOrder);

// Admin-only routes for bulk sync
router.use(authorize(roles.SUPER_ADMIN));

// Sync multiple orders
router.post("/sync/multiple", orderSyncController.syncMultipleOrders);

// Sync all pending orders
router.post("/sync/pending", orderSyncController.syncPendingOrders);

module.exports = router;
