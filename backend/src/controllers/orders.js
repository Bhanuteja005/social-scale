const orderService = require("../services/orders");
const { getPaginationParams } = require("../utils/pagination");
const { AppError } = require("../utils/errors");

const createOrder = async (req, res, next) => {
  try {
    const orderData = req.body;
    const userId = req.user._id;
    
    // For COMPANY_USER, ensure they can only create orders for their company
    if (req.user.role === 'COMPANY_USER') {
      if (!req.user.companyId) {
        throw new AppError("You must be associated with a company to create orders", 403);
      }
      if (orderData.companyId !== req.user.companyId) {
        throw new AppError("You can only create orders for your own company", 403);
      }
    }
    
    // Pass userId for credit deduction
    const order = await orderService.createOrder(orderData, userId);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const result = await orderService.getAllOrders({
      ...pagination,
      ...req.query,
      companyId: req.companyId, // Add company scoping
    });

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, stats } = req.body;
    const order = await orderService.updateOrderStatus(id, status, stats);

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { beforeStats, afterStats } = req.body;
    const order = await orderService.updateOrderStats(
      id,
      beforeStats,
      afterStats
    );

    res.status(200).json({
      success: true,
      message: "Order stats updated successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyOrders = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const pagination = getPaginationParams(req.query);
    const result = await orderService.getCompanyOrders(companyId, {
      ...pagination,
      ...req.query,
    });

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const companyId = req.companyId || req.query.companyId;
    const stats = await orderService.getOrderStatistics(
      companyId,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updateOrderStats,
  getCompanyOrders,
  getOrderStatistics,
};
