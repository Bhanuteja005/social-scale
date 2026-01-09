const Order = require("../models/Order");
const Company = require("../models/Company");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { NotFoundError, AppError } = require("../utils/errors");
const invoiceService = require("./invoices");
const apiIntegrationService = require("./apiIntegrations");
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
    logger.error('Failed to fetch Fampage services:', error);
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

    logger.info(`Fampage API raw response for order ${fampageOrderId}:`, response.data);

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
    logger.error(`Failed to check order status for ${fampageOrderId}:`, error.response?.data || error.message);
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
  console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  // Check if user has companyId
  if (!user.companyId) {
    throw new AppError("Company ID not found", 400);
  }

  // Get Fampage service info
  const serviceInfo = await getServiceInfo(orderData.service);
  if (!serviceInfo) {
    throw new AppError("Service not found in Fampage", 400);
  }

  // Validate quantity
  if (orderData.quantity < serviceInfo.min || orderData.quantity > serviceInfo.max) {
    throw new AppError(`Quantity must be between ${serviceInfo.min} and ${serviceInfo.max}`, 400);
  }

  // Calculate credits required - use user-facing rates, not Fampage rates
  const userRates = {
    // Instagram Followers
    '2279': 5000,  // 5 credits per follower
    '3703': 6000,  // 6 credits per follower
    '3774': 7000,  // 7 credits per follower
    '4301': 8000,  // 8 credits per follower
    '4302': 10000, // 10 credits per follower

    // Instagram Likes
    '3246': 300,   // 0.3 credits per like
    '3724': 500,   // 0.5 credits per like

    // Instagram Comments
    '3463': 800,   // 0.8 credits per comment
    '4219': 6000,  // 6 credits per comment

    // Instagram Reposts
    '4252': 1200,  // 1.2 credits per repost
    '4279': 800,   // 0.8 credits per repost

    // Instagram Channel Members
    '3964': 150,   // 0.15 credits per member
    '3971': 120,   // 0.12 credits per member

    // Instagram Traffic/Views
    '2495': 50,    // 0.05 credits per view
    '2498': 75,    // 0.075 credits per view

    // Instagram Reel Views
    '3694': 7,     // 0.007 credits per reel view
    '4030': 7,     // 0.007 credits per reel view
    '3294': 18,    // 0.018 credits per reel view
    '3651': 25,    // 0.025 credits per reel view

    // Instagram Story Votes (new)
    '4035': 268,   // 0.268 credits per vote (Option A) - ₹26.8 for 100
    '4036': 268,   // 0.268 credits per vote (Option B) - ₹26.8 for 100
    '4037': 268,   // 0.268 credits per vote (Option C) - ₹26.8 for 100
    '4038': 268,   // 0.268 credits per vote (Option D) - ₹26.8 for 100

    // Instagram Live Views (new)
    '4039': 104,   // 0.104 credits per view (15 mins) - ₹10.4 for 100
    '4040': 209,   // 0.209 credits per view (30 mins) - ₹20.9 for 100
    '4041': 430,   // 0.43 credits per view (60 mins) - ₹43 for 100

    // TikTok Followers
    '2779': 210,   // 0.21 credits per follower
    '2781': 290,   // 0.29 credits per follower
    '2782': 250,   // 0.25 credits per follower

    // TikTok Likes
    '2130': 140,   // 0.14 credits per like

    // TikTok Views
    '2125': 5,     // 0.005 credits per view
    '2127': 15,    // 0.015 credits per view
    '2128': 10,    // 0.01 credits per view

    // LinkedIn Followers
    '4002': 20,    // 0.02 credits per follower

    // LinkedIn Likes
    '4005': 10,    // 0.01 credits per like

    // LinkedIn Shares
    '4006': 1200,  // 1.2 credits per share

    // YouTube Subscribers
    '2292': 850,   // 0.85 credits per subscriber
    '2837': 1200,  // 1.2 credits per subscriber

    // YouTube Views
    '4293': 190,   // 0.19 credits per view (100 views package)
    '3032': 770,   // 0.77 credits per view (500 views package)
    '3718': 1490,  // 1.49 credits per view (1000 views package)
    '4081': 3660,  // 1.22 credits per view (3000 views package)
    '3546': 4200,  // 4.2 credits per view (with watchtime)
    '3860': 280,   // 0.28 credits per view
    '3985': 120,   // 0.12 credits per view
    '3986': 115,   // 0.115 credits per view
    '4148': 150,   // 0.15 credits per view

    // YouTube Watch Time
    '2349': 950,   // 0.95 credits per 1000 hours

    // Twitter/X Followers
    '3562': 320,   // 0.32 credits per follower
    '3788': 480,   // 0.48 credits per follower

    // Twitter/X Likes
    '3909': 180,   // 0.18 credits per like

    // Threads Followers
    '3642': 150,   // 0.15 credits per follower

    // Threads Likes
    '3638': 240,   // 0.24 credits per like

    // Threads Reshares
    '3639': 600,   // 0.6 credits per reshare
    '3640': 1100,  // 1.1 credits per reshare

    // Threads Comments
    '3641': 6000,  // 6 credits per comment

    // Pinterest Followers
    '2950': 1100,  // 1.1 credits per follower
    '2953': 2700,  // 2.7 credits per follower

    // Pinterest Likes
    '2951': 1800,  // 1.8 credits per like

    // Pinterest Repins
    '2952': 1300,  // 1.3 credits per repin

    // Facebook Likes
    '2085': 970,   // 0.97 credits per like
    '3251': 180,   // 0.18 credits per like

    // Facebook Followers + Likes
    '2517': 90,    // 0.09 credits per follower

    // Facebook Views
    '3391': 8,     // 0.008 credits per view
    '3392': 37,    // 0.037 credits per view
    '3394': 15,    // 0.015 credits per view
    '4043': 10,    // 0.01 credits per view

    // Spotify Followers
    '3339': 42,    // 0.042 credits per follower
    '3340': 42,    // 0.042 credits per follower
    '3341': 68,    // 0.068 credits per follower
    '3342': 42,    // 0.042 credits per follower
    '3343': 40,    // 0.04 credits per follower

    // Quora Followers
    '3794': 1170,  // 1.17 credits per follower

    // Quora Views
    '3791': 221,   // 0.221 credits per view

    // Quora Likes
    '3792': 1124,  // 1.124 credits per like

    // Quora Shares
    '3793': 1124,  // 1.124 credits per share

    // Quora Upvotes
    '3795': 2654,  // 2.654 credits per upvote
  };

  const userRate = userRates[orderData.service] || parseFloat(serviceInfo.rate) * 10; // fallback
  const creditsRequired = (orderData.quantity / 1000) * userRate;

  // Check if user has enough credits
  if (user.credits.balance < creditsRequired) {
    throw new AppError(`Insufficient credits. Required: ${creditsRequired.toFixed(2)}, Available: ${user.credits.balance}`, 403);
  }

  // Deduct credits
  const balanceBefore = user.credits.balance;
  user.credits.balance -= creditsRequired;
  user.credits.totalSpent += creditsRequired;
  await user.save();

  // Check for low credits and notify
  if (user.credits.balance < 100 && user.credits.balance > 0) {
    // Send notification asynchronously (don't wait for it)
    notificationService.notifyLowCredits(user._id, user.credits.balance).catch(err => 
      logger.error('Failed to send low credits notification:', err)
    );
  }

  // Create order in Fampage
  let fampageOrderId = null;
  try {
    const url = `${config.fampage.baseUrl}?action=add&service=${orderData.service}&link=${encodeURIComponent(orderData.link)}&quantity=${orderData.quantity}&key=${config.fampage.apiKey}`;
    const response = await axios.post(url);
    
    if (response.data && response.data.order) {
      fampageOrderId = response.data.order;
      logger.info(`Fampage order created: ${fampageOrderId}`);
    } else {
      logger.error('Unexpected Fampage response:', response.data);
      // Refund credits
      user.credits.balance = balanceBefore;
      await user.save();
      throw new AppError('Failed to create order in Fampage', 500);
    }
  } catch (error) {
    logger.error('Fampage API error:', error);
    // Refund credits
    user.credits.balance = balanceBefore;
    await user.save();
    throw new AppError(error.response?.data?.error || 'Failed to create order in Fampage', 500);
  }

  // Extract platform and service type from service name
  const { platform, serviceType } = extractServiceInfo(serviceInfo.name, serviceInfo.type);

  // Create order in database
  const order = await Order.create({
    serviceId: orderData.service,
    serviceName: serviceInfo.name,
    serviceType: serviceType,
    platform: platform,
    targetUrl: orderData.link,
    quantity: orderData.quantity,
    creditsUsed: creditsRequired,
    cost: creditsRequired,
    status: 'pending',
    userId: user._id,
    companyId: user.companyId,
    notes: orderData.notes,
    apiOrderId: String(fampageOrderId),
    providerId: '507f1f77bcf86cd799439011', // Placeholder for Fampage provider
  });

  // Create transaction record
  await Transaction.create({
    userId: user._id,
    type: 'credit_deduction',
    amount: creditsRequired,
    credits: creditsRequired,
    balanceBefore,
    balanceAfter: user.credits.balance,
    status: 'completed',
    paymentMethod: 'manual',
    orderId: order._id,
  });

  // Auto-create invoice for the order
  if (autoCreateInvoice) {
    try {
      await invoiceService.createInvoice(order._id, {
        multiplier: 1, // No multiplier for credit-based invoices
        status: 'paid', // Default to paid for credit-based
        // Currency will default to USD for credit-based invoices
      });
      logger.info(`Invoice auto-created for order: ${order._id}`);
    } catch (error) {
      logger.error(`Failed to auto-create invoice for order ${order._id}:`, error.message);
      // Continue even if invoice creation fails
    }
  }

  logger.info(`Order created: ${order._id}, Fampage Order: ${fampageOrderId}, Credits: ${creditsRequired}`);

  return {
    order,
    creditsDeducted: creditsRequired,
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
    logger.error(`Failed to update order status for ${orderId}:`, error.message);
    return null;
  }
};

// Update all pending/in-progress orders from Fampage (called every 4 hours)
const updateAllOrderStatuses = async () => {
  try {
    logger.info('Starting periodic order status update from Fampage...');

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
    logger.error('Failed to update order statuses:', error.message);
    return 0;
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
  getFampageServices,
  getServiceInfo,
  checkOrderStatus,
  updateOrderStatusFromFampage,
  updateAllOrderStatuses,
};
