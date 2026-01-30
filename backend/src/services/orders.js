const Order = require("../models/Order");
const Company = require("../models/Company");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { ApiProvider } = require("../models/ApiProvider");
const { NotFoundError, AppError } = require("../utils/errors");
const invoiceService = require("./invoices");
const pricingService = require("./pricing");
const notificationService = require("./notifications");
const logger = require("../config/logger");

// Fampage API integration
const config = require("../config/env");
const axios = require("axios");

// Cache for Fampage services (refreshed periodically)
let fampageServicesCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 3600000; // 1 hour

// Fetch Fampage services
async function getFampageServices() {
  const now = Date.now();
  if (fampageServicesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
    return fampageServicesCache;
  }

  try {
    const url = `${config.fampage.baseUrl}?action=services&key=${config.fampage.apiKey}`;
    const response = await axios.get(url);
    fampageServicesCache = response.data;
    cacheTimestamp = now;
    return fampageServicesCache;
  } catch (error) {
    logger.error('Failed to fetch services:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return fampageServicesCache || []; // Return cache if available
  }
}

// Get service info by ID
async function getServiceInfo(serviceId) {
  const services = await getFampageServices();
  return services.find(s => s.service === parseInt(serviceId));
}

// Check order status from Fampage
async function checkOrderStatus(fampageOrderId) {
  try {
    const url = `${config.fampage.baseUrl}?action=status&key=${config.fampage.apiKey}&order=${fampageOrderId}`;
    const response = await axios.get(url);

    logger.info(`API raw response for order ${fampageOrderId}:`, response.data);

    let statusData;

    // Handle the case where response.data is a string representation of JSON
    if (typeof response.data === 'string') {
      try {
        statusData = JSON.parse(response.data);
      } catch (parseError) {
        logger.error(`Failed to parse JSON string for order ${fampageOrderId}:`, parseError.message);
        return null;
      }
    } else if (typeof response.data === 'object') {
      // Handle the case where response.data is already an object but might be character-split
      if (response.data && typeof response.data[0] === 'string' && response.data[0] === '{') {
        // This is the character-split format, reconstruct the JSON string
        const jsonString = Object.values(response.data).join('');
        try {
          statusData = JSON.parse(jsonString);
        } catch (parseError) {
          logger.error(`Failed to reconstruct JSON from character-split for order ${fampageOrderId}:`, parseError.message);
          return null;
        }
      } else {
        statusData = response.data;
      }
    } else {
      logger.error(`Unexpected response type for order ${fampageOrderId}:`, typeof response.data);
      return null;
    }

    logger.info(`Parsed status data for order ${fampageOrderId}:`, statusData);

    // Handle different response formats
    if (statusData.status) {
      return {
        status: statusData.status,
        charge: statusData.charge || '0',
        startCount: statusData.start_count || 0,
        remains: statusData.remains || '0',
        currency: statusData.currency || 'INR'
      };
    }

    // If the response is wrapped in the order ID
    if (statusData[fampageOrderId]) {
      const orderData = statusData[fampageOrderId];
      return {
        status: orderData.status,
        charge: orderData.charge || '0',
        startCount: orderData.start_count || 0,
        remains: orderData.remains || '0',
        currency: orderData.currency || 'INR'
      };
    }

    logger.warn(`No valid status data found for order ${fampageOrderId}`);
    return null;
  } catch (error) {
    logger.error(`Failed to check order status for ${fampageOrderId}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return null;
  }
}

// Update order status based on Fampage response
function mapFampageStatus(fampageStatus) {
  const statusMap = {
    'Completed': 'completed',
    'In progress': 'in_progress',
    'Pending': 'pending',
    'Partial': 'partial',
    'Awaiting': 'awaiting',
    'Canceled': 'canceled',
    'Fail': 'fail',
    'cancelled': 'canceled',
    'failed': 'fail'
  };

  return statusMap[fampageStatus] || 'pending';
}

const createOrder = async (
  orderData,
  userId,
  autoCreateInvoice = true,
  invoiceMultiplier = 8
) => {
  console.log('Creating order with data:', {
    service: orderData.service,
    link: orderData.link,
    quantity: orderData.quantity
  });

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  console.log('User found:', {
    id: user._id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    wallet: user.wallet?.balance
  });

  // Check if user has companyId (only for roles that require it)
  const roles = require("../config/roles");
  const requiresCompany = roles.requiresCompany(user.role);
  
  console.log('Requires company:', requiresCompany);
  
  if (requiresCompany && !user.companyId) {
    throw new AppError("Company ID not found. Please contact your administrator to assign you to a company.", 400);
  }

  // For SUPER_ADMIN, we don't need a company
  const companyId = user.companyId || null;

  // Get Fampage service info
  const serviceInfo = await getServiceInfo(orderData.service);
  if (!serviceInfo) {
    throw new AppError("Service not found. Please select a valid service.", 400);
  }

  // Validate quantity
  if (orderData.quantity < serviceInfo.min || orderData.quantity > serviceInfo.max) {
    throw new AppError(`Quantity must be between ${serviceInfo.min} and ${serviceInfo.max}`, 400);
  }

  // Calculate cost in INR using Fampage rate
  const costInINR = (orderData.quantity / 1000) * parseFloat(serviceInfo.rate);

  // Check if user has enough balance
  if (user.wallet.balance < costInINR) {
    throw new AppError(`Insufficient balance. Required: ₹${costInINR.toFixed(2)}, Available: ₹${user.wallet.balance.toFixed(2)}`, 403);
  }

  // Try to create order FIRST without deducting balance (with retries)
  let fampageOrderId = null;
  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  while (retryCount < maxRetries && !fampageOrderId) {
    try {
      const url = `${config.fampage.baseUrl}?action=add&service=${orderData.service}&link=${encodeURIComponent(orderData.link)}&quantity=${orderData.quantity}&key=${config.fampage.apiKey}`;
      logger.info(`Calling API (attempt ${retryCount + 1}/${maxRetries}): service=${orderData.service}, quantity=${orderData.quantity}`);
      
      const response = await axios.post(url, {}, {
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      });
      
      logger.info('API response:', response.data);
      
      if (response.data && response.data.order) {
        fampageOrderId = response.data.order;
        logger.info(`External order created successfully: ${fampageOrderId}`);
        break; // Success, exit retry loop
      } else if (response.data && response.data.error) {
        // API returned an error (like invalid link, private profile, etc.)
        logger.warn('API returned error:', response.data.error);
        
        // Check if this is a user error (not worth retrying)
        const userErrors = ['invalid link', 'private', 'not found', 'incorrect', 'invalid profile'];
        const isUserError = userErrors.some(err => response.data.error.toLowerCase().includes(err));
        
        if (isUserError) {
          throw new AppError(`Unable to process order: ${response.data.error}. Please check your link and try a different service if needed.`, 400);
        }
        
        // For other errors, retry
        retryCount++;
        if (retryCount < maxRetries) {
          logger.info(`Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } else {
        // Unexpected response format
        logger.error('Unexpected  response format:', response.data);
        retryCount++;
        if (retryCount < maxRetries) {
          logger.info(`Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    } catch (error) {
      logger.error(' API error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url?.replace(/key=[^&]+/, 'key=***'),
        attempt: retryCount + 1
      });
      
      // Check if it's a network/timeout error (worth retrying)
      const isNetworkError = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || !error.response;
      
      if (isNetworkError) {
        retryCount++;
        if (retryCount < maxRetries) {
          logger.info(`Network error, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } else {
        // API error, check if user-related
        const errorMsg = error.response?.data?.error || error.message || '';
        const userErrors = ['invalid link', 'private', 'not found', 'incorrect', 'invalid profile'];
        const isUserError = userErrors.some(err => errorMsg.toLowerCase().includes(err));
        
        if (isUserError) {
          throw new AppError(`Unable to process order: ${errorMsg}. Please verify your link and try a different service if needed.`, 400);
        }
        
        // Server error, retry
        retryCount++;
        if (retryCount < maxRetries) {
          logger.info(`Server error, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  }

  // If all retries failed, show helpful message
  if (!fampageOrderId) {
    logger.error(`Failed to create order after ${maxRetries} attempts`);
    throw new AppError(
      'We\'re experiencing high demand right now. Please try again in a few moments or select a different service from the list.', 
      503
    );
  }

  // SUCCESS! Now deduct balance since order was created
  const balanceBefore = user.wallet.balance;
  user.wallet.balance -= costInINR;
  user.wallet.totalSpent += costInINR;
  await user.save();

  logger.info(`Balance deducted: ₹${costInINR} from user ${userId}. New balance: ₹${user.wallet.balance}`);

  // Check for low balance and notify
  if (user.wallet.balance < 100 && user.wallet.balance > 0) {
    // Send notification asynchronously (don't wait for it)
    notificationService.notifyLowBalance(user._id, user.wallet.balance).catch(err => 
      logger.error('Failed to send low balance notification:', {
        message: err.message,
        userId: user._id
      })
    );
  }

  // Extract platform and service type from service name
  const { platform, serviceType } = extractServiceInfo(serviceInfo.name, serviceInfo.type);

  // Get or create Fampage provider (avoid circular dependency with apiIntegrationService)
  let providerId;
  try {
    let provider = await ApiProvider.findOne({
      $or: [
        { name: { $regex: /^fampage$/i } },
        { baseUrl: { $regex: /fampage\.in/i } },
      ],
    });

    if (!provider) {
      provider = await ApiProvider.create({
        name: "Fampage",
        baseUrl: config.fampage.baseUrl,
        apiKey: config.fampage.apiKey,
        status: "active",
      });
      logger.info("Service provider created automatically");
    }
    
    providerId = provider._id;
  } catch (error) {
    logger.error('Failed to get service provider:', {
      message: error.message,
      stack: error.stack
    });
    // Refund if provider fetch fails
    user.wallet.balance = balanceBefore;
    user.wallet.totalSpent -= costInINR;
    await user.save();
    logger.info(`Refunded ₹${costInINR} to user ${userId} after provider error`);
    throw new AppError('Service temporarily unavailable. Your balance has been refunded. Please try again later.', 500);
  }

  // Create order in database
  let order;
  try {
    order = await Order.create({
      serviceId: orderData.service,
      serviceName: serviceInfo.name,
      serviceType: serviceType,
      platform: platform,
      targetUrl: orderData.link,
      quantity: orderData.quantity,
      cost: costInINR,
      status: 'pending',
      userId: user._id,
      companyId: companyId, // Use the determined companyId (null for SUPER_ADMIN)
      notes: orderData.notes,
      apiOrderId: String(fampageOrderId),
      providerId: providerId,
    });
    
    logger.info(`Order created in database: ${order._id}`);
  } catch (error) {
    logger.error('Failed to create order in database:', {
      message: error.message,
      stack: error.stack
    });
    // Refund balance since Fampage order was created but DB order failed
    user.wallet.balance = balanceBefore;
    user.wallet.totalSpent -= costInINR;
    await user.save();
    logger.info(`Refunded ₹${costInINR} to user ${userId} after DB error`);
    throw new AppError('Failed to save order. Your balance has been refunded. Please try again.', 500);
  }

  // Create transaction record
  try {
    await Transaction.create({
      userId: user._id,
      type: 'wallet_debit',
      amount: costInINR,
      currency: 'INR',
      balanceBefore,
      balanceAfter: user.wallet.balance,
      status: 'completed',
      paymentMethod: 'wallet',
      relatedOrderId: order._id,
      notes: `Order payment for ${serviceInfo.name} - Quantity: ${orderData.quantity}`,
    });
    logger.info(`Transaction created for order: ${order._id}`);
  } catch (error) {
    logger.error(`Failed to create transaction for order ${order._id}:`, error.message);
    // Continue - transaction is for record-keeping, order is already created
  }

  // Auto-create invoice for the order
  if (autoCreateInvoice) {
    try {
      await invoiceService.createInvoice(order._id, {
        multiplier: 1,
        status: 'paid',
      });
      logger.info(`Invoice auto-created for order: ${order._id}`);
    } catch (error) {
      logger.error(`Failed to auto-create invoice for order ${order._id}:`, error.message);
      // Continue even if invoice creation fails
    }
  }

  logger.info(`Order created: ${order._id}, External Order: ${fampageOrderId}, Cost: ₹${costInINR.toFixed(2)}`);

  return {
    order,
    cost: costInINR,
    fampageOrderId,
  };
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

  // Determine service type from service name if type is "Default" or unknown
  let detectedType = "follow"; // default
  
  if (nameLower.includes("follower") || nameLower.includes("follow")) detectedType = "follow";
  else if (nameLower.includes("like") && !nameLower.includes("comment")) detectedType = "like";
  else if (nameLower.includes("comment")) detectedType = "comment";
  else if (nameLower.includes("view") || nameLower.includes("traffic")) detectedType = "view";
  else if (nameLower.includes("subscriber") || nameLower.includes("subscribe")) detectedType = "subscribe";
  else if (nameLower.includes("retweet")) detectedType = "retweet";
  else if (nameLower.includes("repost") || nameLower.includes("share")) detectedType = "repost";
  else if (nameLower.includes("vote")) detectedType = "vote";
  else if (nameLower.includes("favorite")) detectedType = "favorite";
  else if (nameLower.includes("member") || nameLower.includes("channel")) detectedType = "subscribe"; // Channel members are subscriptions

  return { platform, serviceType: detectedType };
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

    // User filter
    if (query.userId && typeof query.userId === 'string') {
      filter.userId = query.userId;
    }

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
    logger.error('Error in getAllOrders:', {
      message: error.message,
      stack: error.stack,
      query: query
    });
    throw new AppError('Failed to fetch orders. Please try again.', 500);
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

// Update order status from Fampage API
const updateOrderStatusFromFampage = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order || !order.apiOrderId) {
      return null;
    }

    // Only check status for orders that are not completed or failed
    if (['completed', 'canceled', 'fail'].includes(order.status)) {
      return order;
    }

    const fampageStatus = await checkOrderStatus(order.apiOrderId);
    if (!fampageStatus) {
      return order;
    }

    const newStatus = mapFampageStatus(fampageStatus.status);

    // Update order if status changed
    if (newStatus !== order.status) {
      order.status = newStatus;

      // Update stats if available
      if (fampageStatus.startCount !== undefined) {
        order.stats.startCount = fampageStatus.startCount;
      }

      if (fampageStatus.remains !== undefined) {
        order.stats.remains = parseInt(fampageStatus.remains);
      }

      if (fampageStatus.charge !== undefined) {
        order.stats.charge = parseFloat(fampageStatus.charge);
      }

      if (fampageStatus.currency) {
        order.stats.currency = fampageStatus.currency;
      }

      // Calculate progress based on remains
      if (fampageStatus.remains !== undefined) {
        const totalOrdered = order.quantity;
        const remaining = parseInt(fampageStatus.remains);
        const completed = totalOrdered - remaining;

        if (completed > 0) {
          order.stats.after.count = completed;
          order.stats.after.capturedAt = new Date();
        }
      }

      await order.save();
      logger.info(`Order ${orderId} status updated from ${order.status} to ${newStatus}`);
    }

    return order;
  } catch (error) {
    logger.error(`Failed to update order status for ${orderId}:`, {
      message: error.message,
      stack: error.stack
    });
    return null;
  }
};

// Update all pending/in-progress orders from Fampage (called every 4 hours)
const updateAllOrderStatuses = async () => {
  try {
    logger.info('Starting periodic order status update...');

    const ordersToCheck = await Order.find({
      apiOrderId: { $exists: true, $ne: null },
      status: { $in: ['pending', 'in_progress', 'awaiting', 'partial'] }
    }).limit(100); // Limit to avoid overwhelming the API

    logger.info(`Found ${ordersToCheck.length} orders to check`);

    let updatedCount = 0;
    for (const order of ordersToCheck) {
      const updatedOrder = await updateOrderStatusFromFampage(order._id);
      if (updatedOrder && updatedOrder.status !== order.status) {
        updatedCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.info(`Order status update completed. Updated ${updatedCount} orders.`);
    return updatedCount;
  } catch (error) {
    logger.error('Failed to update order statuses:', {
      message: error.message,
      stack: error.stack
    });
    return 0;
  }
};

const createMassOrder = async (ordersText, userId) => {
  const results = {
    successfulOrders: [],
    failedOrders: [],
    totalCreditsDeducted: 0,
  };

  // Parse the orders text
  const lines = ordersText.trim().split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    try {
      // Parse line: "service_id | link | quantity"
      const parts = line.split('|').map(part => part.trim());
      
      if (parts.length !== 3) {
        results.failedOrders.push({
          line,
          error: 'Invalid format. Expected: service_id | link | quantity'
        });
        continue;
      }

      const [serviceId, link, quantityStr] = parts;
      const quantity = parseInt(quantityStr);

      if (!serviceId || !link || isNaN(quantity)) {
        results.failedOrders.push({
          line,
          error: 'Invalid data. Service ID, link, and quantity are required.'
        });
        continue;
      }

      // Create individual order
      const orderData = {
        service: serviceId,
        link: link,
        quantity: quantity,
      };

      const result = await createOrder(orderData, userId, false); // Don't auto-create invoice for mass orders
      
      results.successfulOrders.push({
        order: result.order,
        creditsDeducted: result.creditsDeducted,
        fampageOrderId: result.fampageOrderId,
      });
      
      results.totalCreditsDeducted += result.creditsDeducted;
      
    } catch (error) {
      results.failedOrders.push({
        line,
        error: error.message
      });
    }
  }

  return results;
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
  getServiceInfo,
  checkOrderStatus,
  updateOrderStatusFromFampage,
  updateAllOrderStatuses,
};
