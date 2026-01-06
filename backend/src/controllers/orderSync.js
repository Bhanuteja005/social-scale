const orderSyncService = require("../services/orderSync");

// Sync single order
exports.syncOrder = async (req, res) => {
  const { id } = req.params;
  
  const order = await orderSyncService.syncOrderStatus(id);

  res.json({
    success: true,
    data: order,
    message: "Order synced successfully",
  });
};

// Sync multiple orders
exports.syncMultipleOrders = async (req, res) => {
  const { orderIds } = req.body;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "orderIds must be a non-empty array",
    });
  }

  const results = await orderSyncService.syncMultipleOrders(orderIds);

  res.json({
    success: true,
    data: results,
  });
};

// Sync all pending orders
exports.syncPendingOrders = async (req, res) => {
  const results = await orderSyncService.syncPendingOrders();

  res.json({
    success: true,
    data: results,
    message: `Synced ${results.filter(r => r.synced).length} orders`,
  });
};
