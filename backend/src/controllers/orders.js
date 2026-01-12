const orderService = require("../services/orders");
const notificationService = require("../services/notifications");
const { getPaginationParams } = require("../utils/pagination");
const { AppError } = require("../utils/errors");

// Get Fampage services
const getFampageServices = async (req, res, next) => {
  try {
    const services = await orderService.getFampageServices();
    
    // Filter by platform/category if specified
    let filteredServices = services;
    if (req.query.platform) {
      const platform = req.query.platform.toLowerCase();
      filteredServices = services.filter(s => 
        s.name.toLowerCase().includes(platform) || 
        s.category.toLowerCase().includes(platform)
      );
    }
    
    // Filter by type if specified
    if (req.query.type) {
      filteredServices = filteredServices.filter(s => s.type === req.query.type);
    }
    
    res.json({
      success: true,
      data: filteredServices,
      total: filteredServices.length,
    });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const orderData = req.body;
    const userId = req.user._id;
    
    // For COMPANY_USER, ensure they can only create orders for their company
    // Temporarily disabled for testing
    // if (req.user.role === 'COMPANY_USER' && req.user.companyId) {
    //   if (orderData.companyId && orderData.companyId !== req.user.companyId) {
    //     throw new AppError("You can only create orders for your own company", 403);
    //   }
    // }
    
    // Pass userId for credit deduction
    const result = await orderService.createOrder(orderData, userId);

    // Send notification
    await notificationService.notifyOrderCreated(userId, result.order);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createMassOrder = async (req, res, next) => {
  try {
    const { orders } = req.body;
    const userId = req.user._id;
    
    const result = await orderService.createMassOrder(orders, userId);

    res.status(201).json({
      success: true,
      message: `Successfully created ${result.successfulOrders.length} orders`,
      data: result,
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
      userId: req.user._id,
      companyId: req.user.companyId,
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

    // Send notification if order is completed
    if (status === 'completed' && order.userId) {
      await notificationService.notifyOrderCompleted(order.userId, order);
    } else if (status === 'cancelled' || status === 'failed') {
      await notificationService.notifyOrderFailed(order.userId, order, 'Order was cancelled or failed');
    }

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
  createMassOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updateOrderStats,
  getCompanyOrders,
  getOrderStatistics,
  getFampageServices,
};
