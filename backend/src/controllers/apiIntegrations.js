const apiIntegrationService = require("../services/apiIntegrations");
const { getPaginationParams } = require("../utils/pagination");

// Provider CRUD operations removed - Fampage is auto-managed from config (FAMPAGE_API_KEY env var)

const getIntegrationLogs = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const result = await apiIntegrationService.getIntegrationLogs(
      { ...pagination, ...req.query },
      req.user?.companyId,
      req.user?.role,
      req.user?.companyId
    );

    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Fampage-specific endpoints (no providerId needed - uses Fampage from config)
const getServices = async (req, res, next) => {
  try {
    const { network, minRate, maxRate, minQuantity, maxQuantity } = req.query;
    const companyId = req.query.companyId || null;

    // Build price filters object
    const priceFilters = {};
    if (minRate !== undefined) priceFilters.minRate = minRate;
    if (maxRate !== undefined) priceFilters.maxRate = maxRate;
    if (minQuantity !== undefined) priceFilters.minQuantity = minQuantity;
    if (maxQuantity !== undefined) priceFilters.maxQuantity = maxQuantity;

    const result = await apiIntegrationService.getServices(
      companyId,
      network, // Pass network filter if provided
      priceFilters // Pass price/quantity filters
    );

    res.status(200).json({
      success: result.success,
      message: result.success
        ? "Services retrieved successfully"
        : "Failed to retrieve services",
      data: result.data,
      statusCode: result.statusCode,
      error: result.error,
    });
  } catch (error) {
    next(error);
  }
};

const addOrder = async (req, res, next) => {
  try {
    const {
      companyId,
      service,
      link,
      quantity,
      serviceName,
      serviceType,
      cost,
      invoiceMultiplier = 8, // Default multiplier is 8, customizable
    } = req.body;
    const result = await apiIntegrationService.addOrder(
      companyId,
      service,
      link,
      quantity,
      serviceName,
      serviceType,
      cost,
      invoiceMultiplier
    );

    // Determine HTTP status code (200 for success, 400 for client errors like insufficient_funds, 500 for server errors)
    const httpStatus = result.success
      ? 200
      : result.statusCode >= 400 && result.statusCode < 500
      ? result.statusCode
      : 500;

    res.status(httpStatus).json({
      success: result.success,
      message: result.success
        ? "Order created successfully and invoice generated"
        : result.error || "Failed to create order", // Show the actual error message (e.g., "insufficient_funds")
      data: result.data, // Fampage API response: { order: <integer_id> } or { error: "insufficient_funds" }
      apiOrderId: result.apiOrderId || result.data?.order || null, // Fampage order ID (if available, even on error)
      orderId: result.orderId || null, // Our internal order ID (only if order was created)
      order: result.order || null, // Full order record with invoice (only if order was created)
      invoice: result.invoice || null, // Invoice details if created
      statusCode: result.statusCode,
      error: result.error, // Fampage error message (e.g., "insufficient_funds")
    });
  } catch (error) {
    next(error);
  }
};

const getOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    // orderId here is the Fampage API order ID (integer returned from add endpoint)
    const companyId = req.body.companyId || req.query.companyId || null;
    const result = await apiIntegrationService.getOrderStatus(
      companyId,
      orderId
    );

    res.status(200).json({
      success: result.success,
      message: result.success
        ? "Order status retrieved successfully"
        : "Failed to retrieve order status",
      data: result.data, // Fampage API response: { charge, start_count, status, remains, currency }
      order: result.order || null, // Our order record with updated status and stats
      statusCode: result.statusCode,
      error: result.error,
    });
  } catch (error) {
    next(error);
  }
};

const getOrdersStatus = async (req, res, next) => {
  try {
    const { orderIds } = req.query; // Get from query params (validated)

    // Convert comma-separated string to array
    const orderIdsArray = orderIds.split(",").map((id) => id.trim());
    const companyId = req.query.companyId || null;

    const result = await apiIntegrationService.getOrdersStatus(
      companyId,
      orderIdsArray
    );

    res.status(200).json({
      success: result.success,
      message: result.success
        ? "Orders status retrieved successfully"
        : "Failed to retrieve orders status",
      data: result.data, // Fampage API response: { "1": {...}, "2": "Incorrect order ID", ... }
      orders: result.orders || {}, // Our updated order records (keyed by apiOrderId)
      statusCode: result.statusCode,
      error: result.error,
    });
  } catch (error) {
    next(error);
  }
};

const refillOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    // orderId here is the Fampage API order ID (apiOrderId) to refill
    const companyId = req.body.companyId || req.query.companyId || null;
    const result = await apiIntegrationService.refillOrder(companyId, orderId);

    res.status(200).json({
      success: result.success,
      message: result.success
        ? "Order refilled successfully"
        : "Failed to refill order",
      data: result.data, // Fampage API response: { refill: <integer_refill_id> }
      refillId: result.data?.refill || null, // Refill ID returned by Fampage
      statusCode: result.statusCode,
      error: result.error,
    });
  } catch (error) {
    next(error);
  }
};

const getBalance = async (req, res, next) => {
  try {
    const companyId = req.query.companyId || null;
    const result = await apiIntegrationService.getBalance(companyId);

    res.status(200).json({
      success: result.success,
      message: result.success
        ? "Balance retrieved successfully"
        : "Failed to retrieve balance",
      data: result.data, // Fampage API response: { balance: "99.80", currency: "USD" }
      balance: result.data?.balance || null, // Current balance
      currency: result.data?.currency || null, // Currency
      statusCode: result.statusCode,
      error: result.error,
    });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    // orderId here is the Fampage API order ID (apiOrderId) to cancel
    const companyId = req.body.companyId || req.query.companyId || null;
    const result = await apiIntegrationService.cancelOrder(companyId, orderId);

    // Check if cancellation was successful based on "ok" field
    const isCancelled = result.data?.ok === "true" || result.data?.ok === true;

    res.status(200).json({
      success: result.success && isCancelled,
      message: isCancelled
        ? "Order cancelled successfully"
        : "Failed to cancel order",
      data: result.data, // Fampage API response: { ok: "true" } or { ok: "false" }
      cancelled: isCancelled, // Cancellation status
      statusCode: result.statusCode,
      error: result.error,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIntegrationLogs,
  getServices,
  addOrder,
  getOrderStatus,
  getOrdersStatus,
  refillOrder,
  getBalance,
  cancelOrder,
};
