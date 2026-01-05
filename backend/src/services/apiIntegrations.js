const { ApiProvider, ApiIntegrationLog } = require("../models/ApiProvider");
const Order = require("../models/Order");
const BaseProvider = require("./BaseProvider");
const FampageProvider = require("./FampageProvider");
const { NotFoundError, AppError } = require("../utils/errors");
const logger = require("../config/logger");
const orderService = require("./orders");
const config = require("../config/env");

// Helper function to get or create Fampage provider (auto-created from config)
// Since we only use Fampage, this is auto-managed - no CRUD operations needed
const getOrCreateFampageProvider = async () => {
  let provider = await ApiProvider.findOne({
    $or: [
      { name: { $regex: /^fampage$/i } },
      { baseUrl: { $regex: /fampage\.in/i } },
    ],
  });

  if (!provider) {
    // Create Fampage provider from config if it doesn't exist
    if (!config.fampage.apiKey) {
      throw new AppError(
        "Fampage API key is not configured. Please set FAMPAGE_API_KEY environment variable.",
        500
      );
    }

    provider = await ApiProvider.create({
      name: "Fampage",
      baseUrl: config.fampage.baseUrl,
      apiKey: config.fampage.apiKey,
      status: "active",
    });
    logger.info("Fampage provider created automatically from config");
  } else if (
    provider.apiKey !== config.fampage.apiKey &&
    config.fampage.apiKey
  ) {
    // Update API key if it has changed in config
    provider.apiKey = config.fampage.apiKey;
    provider.baseUrl = config.fampage.baseUrl;
    await provider.save();
    logger.info("Fampage provider API key updated from config");
  }

  return provider;
};

// Provider CRUD operations removed - only Fampage is used and it's auto-managed from config

const getIntegrationLogs = async (
  query,
  companyId,
  userRole,
  userCompanyId
) => {
  const { page, limit, skip } = query;
  const filter = {};

  if (
    !userRole ||
    userRole === "COMPANY_USER" ||
    userRole === "COMPANY_ADMIN"
  ) {
    filter.companyId = userCompanyId;
  } else if (query.companyId) {
    filter.companyId = query.companyId;
  }

  if (query.providerId) {
    filter.providerId = query.providerId;
  }

  if (query.endpoint) {
    filter.endpoint = query.endpoint; // Filter by endpoint (e.g., "add" for order creation)
  }

  if (query.method) {
    filter.method = query.method; // Filter by HTTP method (GET, POST, etc.)
  }

  if (query.success !== undefined) {
    filter.success = query.success === "true";
  }

  const logs = await ApiIntegrationLog.find(filter)
    .populate("providerId", "name")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await ApiIntegrationLog.countDocuments(filter);

  return {
    logs: logs.map((l) => l.toJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Fampage-specific methods - auto-get Fampage provider
const getFampageProviderInstance = async () => {
  const provider = await getOrCreateFampageProvider();

  if (provider.status !== "active") {
    throw new AppError("Fampage provider is not active", 400);
  }

  return {
    provider,
    instance: new FampageProvider(provider.toJSON()),
  };
};

const getServices = async (companyId, network = null, priceFilters = {}) => {
  const { provider, instance } = await getFampageProviderInstance();
  const result = await instance.getServices();

  // Log the request
  await logApiCall(provider._id, companyId, "services", "GET", null, result);

  // If the request was successful and we have data, categorize by network
  if (result.success && Array.isArray(result.data)) {
    let servicesToProcess = result.data;

    // Filter by network if provided
    if (network) {
      servicesToProcess = servicesToProcess.filter(
        (service) => (service.network || "Other") === network
      );
    }

    // Filter by price (rate) if provided
    if (
      priceFilters.minRate !== undefined ||
      priceFilters.maxRate !== undefined
    ) {
      servicesToProcess = servicesToProcess.filter((service) => {
        const rate = parseFloat(service.rate || 0);
        if (
          priceFilters.minRate !== undefined &&
          rate < parseFloat(priceFilters.minRate)
        ) {
          return false;
        }
        if (
          priceFilters.maxRate !== undefined &&
          rate > parseFloat(priceFilters.maxRate)
        ) {
          return false;
        }
        return true;
      });
    }

    // Filter by min/max quantity if provided
    if (
      priceFilters.minQuantity !== undefined ||
      priceFilters.maxQuantity !== undefined
    ) {
      servicesToProcess = servicesToProcess.filter((service) => {
        const min = service.min ? parseInt(service.min) : 0;
        const max = service.max ? parseInt(service.max) : Infinity;

        if (priceFilters.minQuantity !== undefined) {
          const filterMin = parseInt(priceFilters.minQuantity);
          if (max < filterMin) return false; // Service max is less than filter min
        }
        if (priceFilters.maxQuantity !== undefined) {
          const filterMax = parseInt(priceFilters.maxQuantity);
          if (min > filterMax) return false; // Service min is greater than filter max
        }
        return true;
      });
    }

    const categorizedServices = {};
    const networkOrder = []; // To maintain order of networks as they appear

    servicesToProcess.forEach((service) => {
      // Get network from service, default to "Other" if not present
      const networkName = service.network || "Other";

      // Initialize network array if it doesn't exist
      if (!categorizedServices[networkName]) {
        categorizedServices[networkName] = [];
        networkOrder.push(networkName);
      }

      // Add service to the network category
      categorizedServices[networkName].push(service);
    });

    // Transform to array format for better structure
    const categorizedArray = networkOrder.map((networkName) => ({
      network: networkName,
      services: categorizedServices[networkName],
      count: categorizedServices[networkName].length,
    }));

    return {
      ...result,
      data: {
        categorized: categorizedArray,
        byNetwork: categorizedServices, // Also provide object format for easy lookup
        total: servicesToProcess.length,
        networks: networkOrder, // List of unique networks
        filteredBy: {
          network: network || null,
          minRate: priceFilters.minRate || null,
          maxRate: priceFilters.maxRate || null,
          minQuantity: priceFilters.minQuantity || null,
          maxQuantity: priceFilters.maxQuantity || null,
        },
      },
      raw: servicesToProcess, // Keep raw data accessible if needed
      allRaw: result.data, // Keep all raw data for reference
    };
  }

  return result;
};

const addOrder = async (
  companyId,
  service,
  link,
  quantity,
  serviceName = null,
  serviceType = null,
  cost = 0,
  invoiceMultiplier = 8
) => {
  const { provider, instance } = await getFampageProviderInstance();

  // If service details not provided, try to fetch from services list
  if (!serviceName || !serviceType || !cost) {
    try {
      const servicesResult = await instance.getServices();
      if (servicesResult.success && Array.isArray(servicesResult.data)) {
        const serviceDetails = servicesResult.data.find(
          (s) => s.service === service
        );
        if (serviceDetails) {
          serviceName = serviceName || serviceDetails.name;
          serviceType = serviceType || serviceDetails.type;
          // Calculate cost if rate is available (rate is typically per 1000 units)
          if (!cost && serviceDetails.rate) {
            cost = parseFloat(serviceDetails.rate) * (quantity / 1000);
          }
        }
      }
    } catch (error) {
      logger.warn(
        "Could not fetch service details, proceeding with provided values",
        error
      );
    }
  }

  // Call Fampage API to create order
  const result = await instance.addOrder(service, link, quantity);
  console.log('Fampage API result:', JSON.stringify(result, null, 2));

  // Check if we got an order ID (even if there was an error, Fampage might return order ID)
  const fampageOrderId = result.data?.order || result.data?.id || result.data?.orderId || null;
  console.log('Fampage order ID:', fampageOrderId);

  // If API call successful, create Order record and auto-create invoice
  if (result.success) {
    try {
      const orderData = {
        companyId,
        providerId: provider._id, // Use Fampage provider ID
        apiOrderId: fampageOrderId ? fampageOrderId.toString() : null, // Store as string or null
        serviceId: service,
        serviceName: serviceName || `Service ${service}`,
        serviceType: serviceType || "follow",
        targetUrl: link,
        quantity,
        cost,
        status: "pending",
        submittedAt: new Date(),
      };

      // Create order with auto-invoice generation (default multiplier is 8, can be customized)
      const createdOrder = await orderService.createOrder(
        orderData,
        true, // autoCreateInvoice
        invoiceMultiplier // customizable multiplier
      );

      // Include order and invoice info in result
      result.apiOrderId = fampageOrderId; // Fampage API order ID (use this for status checks)
      result.orderId = createdOrder._id || createdOrder.id; // Our internal order ID
      result.order = createdOrder; // Full order record

      if (createdOrder.invoice) {
        result.invoice = createdOrder.invoice;
      }
    } catch (error) {
      logger.error("Failed to create Order record or invoice", error);
      // Re-throw the error so the request fails if internal order creation fails
      throw error;
    }
  } else if (fampageOrderId && !result.success) {
    // Edge case: Fampage returned an order ID even though there was an error
    // Include it in the result so user can see it
    result.apiOrderId = fampageOrderId;
    logger.warn(
      `Fampage returned order ID ${fampageOrderId} but with error: ${result.error}`
    );
  } else if (fampageOrderId && result.success) {
    // Success but order ID not yet set (shouldn't happen, but just in case)
    result.apiOrderId = fampageOrderId;
  }

  // Log the request (always log, even if failed)
  await logApiCall(
    provider._id,
    companyId,
    "add",
    "POST",
    { service, link, quantity, invoiceMultiplier },
    result
  );

  return result;
};

const getOrderStatus = async (companyId = null, orderId) => {
  const { provider, instance } = await getFampageProviderInstance();
  const providerId = provider._id;
  const result = await instance.getOrderStatus(orderId);

  let updatedOrder = null;

  // Update Order record if exists
  if (result.success && result.data) {
    try {
      const order = await Order.findOne({ apiOrderId: orderId.toString() })
        .populate("providerId", "name")
        .populate("invoiceId", "invoiceNumber status total");

      if (order) {
        const statusData = result.data;

        // Map Fampage status to our status enum
        const statusMap = {
          "In progress": "in_progress",
          "In Progress": "in_progress", // Handle both cases
          Completed: "completed",
          Awaiting: "awaiting",
          Canceled: "canceled",
          Cancelled: "canceled", // Handle both spellings
          Fail: "fail",
          Partial: "partial",
        };

        const mappedStatus =
          statusMap[statusData.status] ||
          (statusData.status ? statusData.status.toLowerCase() : "pending") ||
          "pending";

        // Update order status and stats
        const updated = await orderService.updateOrderStatus(
          order._id,
          mappedStatus,
          {
            startCount: statusData.start_count
              ? parseInt(statusData.start_count)
              : null,
            remains: statusData.remains ? parseInt(statusData.remains) : null,
            charge: statusData.charge ? parseFloat(statusData.charge) : null,
            currency: statusData.currency || "USD",
          }
        );

        // Get the updated order with populated fields
        updatedOrder = await orderService.getOrderById(order._id);
      }
    } catch (error) {
      logger.error("Failed to update Order record", error);
    }
  }

  // Log the request (companyId can be null)
  if (companyId) {
    await logApiCall(
      providerId,
      companyId,
      "status",
      "GET",
      { order: orderId },
      result
    );
  }

  // Return Fampage API response along with our order record
  return {
    ...result,
    order: updatedOrder, // Include our order record if found and updated
  };
};

const getOrdersStatus = async (companyId, orderIds) => {
  const { provider, instance } = await getFampageProviderInstance();
  const providerId = provider._id;
  const result = await instance.getOrdersStatus(orderIds);

  const updatedOrders = {}; // Store updated order records

  // Update Order records if API call was successful and we have data
  if (result.success && result.data && typeof result.data === "object") {
    const statusData = result.data;

    // Process each order ID in the response
    for (const [orderIdStr, statusInfo] of Object.entries(statusData)) {
      // Skip if it's an error message (string)
      if (typeof statusInfo === "string") {
        continue; // This is an error like "Incorrect order ID"
      }

      // statusInfo is an object with charge, start_count, status, remains, currency
      try {
        const order = await Order.findOne({ apiOrderId: orderIdStr.toString() })
          .populate("providerId", "name")
          .populate("invoiceId", "invoiceNumber status total");

        if (order) {
          // Map Fampage status to our status enum
          const statusMap = {
            "In progress": "in_progress",
            "In Progress": "in_progress", // Handle both cases
            Completed: "completed",
            Awaiting: "awaiting",
            Canceled: "canceled",
            Cancelled: "canceled", // Handle both spellings
            Fail: "fail",
            Partial: "partial",
          };

          const mappedStatus =
            statusMap[statusInfo.status] ||
            (statusInfo.status ? statusInfo.status.toLowerCase() : "pending") ||
            "pending";

          // Update order status and stats
          await orderService.updateOrderStatus(order._id, mappedStatus, {
            startCount: statusInfo.start_count
              ? parseInt(statusInfo.start_count)
              : null,
            remains: statusInfo.remains ? parseInt(statusInfo.remains) : null,
            charge: statusInfo.charge ? parseFloat(statusInfo.charge) : null,
            currency: statusInfo.currency || "USD",
          });

          // Get the updated order with populated fields
          const updatedOrder = await orderService.getOrderById(order._id);
          updatedOrders[orderIdStr] = updatedOrder;
        }
      } catch (error) {
        logger.error(
          `Failed to update Order record for order ID ${orderIdStr}`,
          error
        );
        // Continue processing other orders even if one fails
      }
    }
  }

  // Log the request
  if (companyId) {
    await logApiCall(
      providerId,
      companyId,
      "status",
      "GET",
      { orders: orderIds },
      result
    );
  }

  // Return Fampage API response along with our updated order records
  return {
    ...result,
    orders: updatedOrders, // Our updated order records (keyed by apiOrderId)
  };
};

const refillOrder = async (companyId = null, orderId) => {
  const { provider, instance } = await getFampageProviderInstance();
  const providerId = provider._id;
  const result = await instance.refillOrder(orderId);

  // Log the request (companyId can be null)
  if (companyId) {
    await logApiCall(
      providerId,
      companyId,
      "refill",
      "POST",
      { order: orderId },
      result
    );
  }

  return result;
};

const getBalance = async (companyId = null) => {
  const { provider, instance } = await getFampageProviderInstance();
  const providerId = provider._id;
  const result = await instance.getBalance();

  // Log the request (companyId can be null)
  if (companyId) {
    await logApiCall(providerId, companyId, "balance", "GET", null, result);
  }

  return result;
};

const cancelOrder = async (companyId = null, orderId) => {
  const { provider, instance } = await getFampageProviderInstance();
  const providerId = provider._id;
  const result = await instance.cancelOrder(orderId);

  // Update Order record if cancellation was successful
  // Check both result.success (HTTP success) and result.data.ok (API success)
  const isCancelled =
    result.success && (result.data?.ok === "true" || result.data?.ok === true);

  if (isCancelled) {
    try {
      const order = await Order.findOne({ apiOrderId: orderId.toString() });
      if (order) {
        await orderService.updateOrderStatus(order._id, "canceled");
      }
    } catch (error) {
      logger.error("Failed to update Order record", error);
      // Don't fail the request if order update fails
    }
  }

  // Log the request (companyId can be null)
  if (companyId) {
    await logApiCall(
      providerId,
      companyId,
      "cancel",
      "POST",
      { order: orderId },
      result
    );
  }

  return result;
};

const logApiCall = async (
  providerId,
  companyId,
  endpoint,
  method,
  requestData,
  result
) => {
  try {
    // Only create log entry if companyId is provided (for company-specific calls)
    // Some calls like getServices or getBalance may not have a companyId
    const logData = {
      providerId,
      endpoint,
      method,
      requestData,
      responseData: result.data,
      statusCode: result.statusCode,
      creditsUsed: 0,
      duration: result.duration || 0,
      success: result.success,
      error: result.error || null,
    };

    // Only include companyId if it's provided
    if (companyId) {
      logData.companyId = companyId;
    }

    await ApiIntegrationLog.create(logData);
  } catch (error) {
    logger.error("Failed to log API call", error);
  }
};

module.exports = {
  getOrCreateFampageProvider, // Expose for use in orders service
  getIntegrationLogs,
  getServices,
  addOrder,
  getOrderStatus,
  getOrdersStatus,
  refillOrder,
  getBalance,
  cancelOrder,
};
