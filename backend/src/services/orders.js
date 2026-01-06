const Order = require("../models/Order");
const Company = require("../models/Company");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { NotFoundError, AppError } = require("../utils/errors");
const invoiceService = require("./invoices");
const apiIntegrationService = require("./apiIntegrations");
const pricingService = require("./pricing");
const logger = require("../config/logger");

const createOrder = async (
  orderData,
  userId,
  autoCreateInvoice = true,
  invoiceMultiplier = 8
) => {
  console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

  // Validate company exists
  const company = await Company.findOne({ companyId: orderData.companyId });
  console.log('Company found:', company ? company.companyId : 'NOT FOUND');

  if (!company) {
    throw new NotFoundError("Company");
  }

  // Get user and check credits
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  // Provider ID should already be set by apiIntegrations service
  if (!orderData.providerId) {
    throw new AppError("Provider ID is required", 400);
  }

  // Calculate credits required based on pricing rules
  let creditsRequired = 0;
  try {
    // Extract platform and service type from service name or metadata
    const { platform, serviceType } = extractServiceInfo(orderData.serviceName, orderData.serviceType);
    
    const creditCalc = await pricingService.calculateCredits(
      userId,
      platform,
      serviceType,
      orderData.quantity
    );
    creditsRequired = creditCalc.creditsRequired;
  } catch (error) {
    logger.warn(`Could not calculate credits for order: ${error.message}`);
    // Fallback to basic calculation if pricing service fails
    creditsRequired = Math.ceil(orderData.quantity * 0.1); // Default fallback
  }

  // Check if user has enough credits
  if (user.credits.balance < creditsRequired) {
    throw new AppError(
      `Insufficient credits. Required: ${creditsRequired}, Available: ${user.credits.balance}`,
      400
    );
  }

  // Deduct credits from user
  const balanceBefore = user.credits.balance;
  user.credits.balance -= creditsRequired;
  user.credits.totalSpent += creditsRequired;
  await user.save();

  // Add credits and user info to order data
  orderData.creditsUsed = creditsRequired;
  orderData.userId = userId;

  console.log('Final order data:', JSON.stringify(orderData, null, 2));

  const order = await Order.create(orderData);
  const orderObj = order.toJSON();

  // Create transaction record
  await Transaction.create({
    userId,
    companyId: orderData.companyId,
    type: "credit_deduction",
    amount: orderData.cost || 0,
    currency: "USD",
    credits: creditsRequired,
    balanceBefore,
    balanceAfter: user.credits.balance,
    status: "completed",
    paymentMethod: "admin",
    orderId: order._id,
    metadata: {
      serviceName: orderData.serviceName,
      quantity: orderData.quantity,
    },
  });

  console.log('Order created successfully:', orderObj._id);

  // Automatically create invoice if requested
  if (autoCreateInvoice) {
    try {
      const invoice = await invoiceService.createInvoice(order._id, {
        multiplier: invoiceMultiplier,
        status: "draft",
      });
      orderObj.invoiceId = invoice._id;
      orderObj.invoice = invoice;
    } catch (error) {
      logger.error("Failed to auto-create invoice for order", error);
      // Don't fail order creation if invoice creation fails
    }
  }

  return orderObj;
};

// Helper function to extract platform and service type
function extractServiceInfo(serviceName, serviceType) {
  const nameLower = (serviceName || "").toLowerCase();
  
  // Detect platform
  let platform = "instagram"; // default
  if (nameLower.includes("instagram") || nameLower.includes("ig")) platform = "instagram";
  else if (nameLower.includes("facebook") || nameLower.includes("fb")) platform = "facebook";
  else if (nameLower.includes("twitter") || nameLower.includes("x ")) platform = "twitter";
  else if (nameLower.includes("linkedin")) platform = "linkedin";
  else if (nameLower.includes("youtube") || nameLower.includes("yt")) platform = "youtube";
  else if (nameLower.includes("tiktok")) platform = "tiktok";
  else if (nameLower.includes("threads")) platform = "threads";

  // Map service type
  const typeMap = {
    follow: "follower",
    like: "like",
    comment: "comment",
    view: "view",
    subscribe: "subscriber",
    retweet: "retweet",
    share: "share",
  };

  const mappedType = typeMap[serviceType] || serviceType || "follower";

  return { platform, serviceType: mappedType };
}

const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("providerId", "name baseUrl")
    .populate("invoiceId");

  if (!order) {
    throw new NotFoundError("Order");
  }

  return order.toJSON();
};

const getAllOrders = async (query) => {
  try {
    // Validate and sanitize query parameters
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    // Company filter
    if (query.companyId && typeof query.companyId === 'string') {
      filter.companyId = query.companyId;
    }

    // Status filter
    if (query.status && typeof query.status === 'string') {
      const validStatuses = ['pending', 'in_progress', 'completed', 'partial', 'awaiting', 'canceled', 'fail'];
      if (validStatuses.includes(query.status)) {
        filter.status = query.status;
      }
    }

    // Service type filter
    if (query.serviceType && typeof query.serviceType === 'string') {
      const validServiceTypes = ['like', 'subscribe', 'comment', 'like_to_comment', 'dislike', 'dislike_to_comment', 'repost', 'friend', 'vote', 'retweet', 'follow', 'favorite'];
      if (validServiceTypes.includes(query.serviceType)) {
        filter.serviceType = query.serviceType;
      }
    }

    // Target URL filter
    if (query.targetUrl && typeof query.targetUrl === 'string') {
      filter.targetUrl = { $regex: query.targetUrl, $options: "i" };
    }

    // Date filtering
    if (query.startDate || query.endDate) {
      filter.submittedAt = {};
      if (query.startDate) {
        const startDate = new Date(query.startDate);
        if (!isNaN(startDate.getTime())) {
          filter.submittedAt.$gte = startDate;
        }
      }
      if (query.endDate) {
        const endDate = new Date(query.endDate);
        if (!isNaN(endDate.getTime())) {
          filter.submittedAt.$lte = endDate;
        }
      }
    }

    // Price filtering (cost)
    if (query.minCost !== undefined || query.maxCost !== undefined) {
      filter.cost = {};
      if (query.minCost !== undefined) {
        const minCost = parseFloat(query.minCost);
        if (!isNaN(minCost)) {
          filter.cost.$gte = minCost;
        }
      }
      if (query.maxCost !== undefined) {
        const maxCost = parseFloat(query.maxCost);
        if (!isNaN(maxCost)) {
          filter.cost.$lte = maxCost;
        }
      }
    }

    // Quantity filtering
    if (query.minQuantity !== undefined || query.maxQuantity !== undefined) {
      filter.quantity = {};
      if (query.minQuantity !== undefined) {
        const minQuantity = parseInt(query.minQuantity);
        if (!isNaN(minQuantity) && minQuantity >= 0) {
          filter.quantity.$gte = minQuantity;
        }
      }
      if (query.maxQuantity !== undefined) {
        const maxQuantity = parseInt(query.maxQuantity);
        if (!isNaN(maxQuantity) && maxQuantity >= 0) {
          filter.quantity.$lte = maxQuantity;
        }
      }
    }

    console.log('Filter:', JSON.stringify(filter, null, 2));
    console.log('Query params:', JSON.stringify(query, null, 2));

    const orders = await Order.find(filter)
      .populate("providerId", "name")
      .populate("invoiceId", "invoiceNumber status")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    return {
      orders: orders.map((o) => o.toJSON()),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    logger.error('Error in getAllOrders', { error: error.message, stack: error.stack, query });
    throw error;
  }
};

const updateOrderStatus = async (orderId, status, stats = null) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError("Order");
  }

  order.status = status;

  if (stats) {
    if (stats.startCount !== undefined)
      order.stats.startCount = stats.startCount;
    if (stats.remains !== undefined) order.stats.remains = stats.remains;
    if (stats.charge !== undefined) order.stats.charge = stats.charge;
    if (stats.currency) order.stats.currency = stats.currency;
  }

  if (
    (status === "completed" || status === "canceled" || status === "fail") &&
    !order.completedAt
  ) {
    order.completedAt = new Date();
  }

  await order.save();
  return order.toJSON();
};

const updateOrderStats = async (
  orderId,
  beforeStats = null,
  afterStats = null
) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError("Order");
  }

  if (beforeStats) {
    order.stats.before = {
      count: beforeStats.count,
      capturedAt: beforeStats.capturedAt || new Date(),
    };
  }

  if (afterStats) {
    order.stats.after = {
      count: afterStats.count,
      capturedAt: afterStats.capturedAt || new Date(),
    };
  }

  await order.save();
  return order.toJSON();
};

const getCompanyOrders = async (companyId, query = {}) => {
  const { page = 1, limit = 20, skip = (page - 1) * limit } = query;
  const filter = { companyId };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.serviceType) {
    filter.serviceType = query.serviceType;
  }

  // Price filtering (cost)
  if (query.minCost !== undefined || query.maxCost !== undefined) {
    filter.cost = {};
    if (query.minCost !== undefined) {
      filter.cost.$gte = parseFloat(query.minCost);
    }
    if (query.maxCost !== undefined) {
      filter.cost.$lte = parseFloat(query.maxCost);
    }
  }

  // Quantity filtering
  if (query.minQuantity !== undefined || query.maxQuantity !== undefined) {
    filter.quantity = {};
    if (query.minQuantity !== undefined) {
      filter.quantity.$gte = parseInt(query.minQuantity);
    }
    if (query.maxQuantity !== undefined) {
      filter.quantity.$lte = parseInt(query.maxQuantity);
    }
  }

  const orders = await Order.find(filter)
    .populate("providerId", "name")
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(filter);

  return {
    orders: orders.map((o) => o.toJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getOrderStatistics = async (
  companyId = null,
  startDate = null,
  endDate = null
) => {
  const filter = {};

  if (companyId) {
    filter.companyId = companyId;
  }

  if (startDate || endDate) {
    filter.submittedAt = {};
    if (startDate) filter.submittedAt.$gte = new Date(startDate);
    if (endDate) filter.submittedAt.$lte = new Date(endDate);
  }

  const orders = await Order.find(filter);

  const stats = {
    total: orders.length,
    byStatus: {},
    byServiceType: {},
    totalCost: 0,
    totalQuantity: 0,
  };

  orders.forEach((order) => {
    // Count by status
    stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;

    // Count by service type
    stats.byServiceType[order.serviceType] =
      (stats.byServiceType[order.serviceType] || 0) + 1;

    // Sum costs and quantities
    stats.totalCost += order.cost || 0;
    stats.totalQuantity += order.quantity || 0;
  });

  return stats;
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
