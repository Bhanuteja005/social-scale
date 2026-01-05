const Order = require("../models/Order");
const Invoice = require("../models/Invoice");
const Company = require("../models/Company");

const getCompanyAnalytics = async (companyId = null, filters = {}) => {
  const matchFilter = {};

  if (companyId) {
    matchFilter.companyId = companyId;
  }

  if (filters.startDate || filters.endDate) {
    matchFilter.submittedAt = {};
    if (filters.startDate) {
      matchFilter.submittedAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      matchFilter.submittedAt.$lte = new Date(filters.endDate);
    }
  }

  if (filters.serviceType) {
    matchFilter.serviceType = filters.serviceType;
  }

  if (filters.status) {
    matchFilter.status = filters.status;
  }

  // Get detailed order list with invoices for profit calculation
  const orders = await Order.find(matchFilter)
    .populate("providerId", "name")
    .populate("invoiceId", "total subtotal multiplier")
    .sort({ submittedAt: -1 });

  // Aggregate statistics with invoice data for profit calculation
  const pipeline = [
    { $match: matchFilter },
    {
      $lookup: {
        from: "invoices",
        localField: "_id",
        foreignField: "orderId",
        as: "invoice",
      },
    },
    {
      $unwind: { path: "$invoice", preserveNullAndEmptyArrays: true },
    },
    {
      $group: {
        _id: {
          serviceType: "$serviceType",
          date: { $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" } },
        },
        count: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        realCost: { $sum: "$cost" }, // Real cost paid to Fampage
        revenue: { $sum: "$invoice.total" }, // Revenue from invoices (what we charged)
        targetUrls: { $addToSet: "$targetUrl" },
      },
    },
    {
      $project: {
        _id: 0,
        serviceType: "$_id.serviceType",
        date: "$_id.date",
        usageCount: "$count",
        totalQuantity: "$totalQuantity",
        realCost: { $ifNull: ["$realCost", 0] },
        revenue: { $ifNull: ["$revenue", 0] },
        profit: {
          $subtract: [
            { $ifNull: ["$revenue", 0] },
            { $ifNull: ["$realCost", 0] },
          ],
        },
        uniqueTargets: { $size: "$targetUrls" },
      },
    },
    { $sort: { date: -1, serviceType: 1 } },
  ];

  const aggregatedStats = await Order.aggregate(pipeline);

  // Group by service type for summary with profit calculations
  const serviceTypeSummary = {};
  let totalRealCost = 0;
  let totalRevenue = 0;

  aggregatedStats.forEach((stat) => {
    if (!serviceTypeSummary[stat.serviceType]) {
      serviceTypeSummary[stat.serviceType] = {
        serviceType: stat.serviceType,
        totalUsageCount: 0,
        totalQuantity: 0,
        realCost: 0,
        revenue: 0,
        profit: 0,
        dates: [],
        uniqueTargets: new Set(),
      };
    }
    serviceTypeSummary[stat.serviceType].totalUsageCount += stat.usageCount;
    serviceTypeSummary[stat.serviceType].totalQuantity += stat.totalQuantity;
    serviceTypeSummary[stat.serviceType].realCost += stat.realCost || 0;
    serviceTypeSummary[stat.serviceType].revenue += stat.revenue || 0;
    serviceTypeSummary[stat.serviceType].profit += stat.profit || 0;
    serviceTypeSummary[stat.serviceType].dates.push(stat.date);

    totalRealCost += stat.realCost || 0;
    totalRevenue += stat.revenue || 0;
  });

  // Convert sets to arrays and calculate profit margins
  Object.keys(serviceTypeSummary).forEach((key) => {
    const summary = serviceTypeSummary[key];
    summary.dates = [...new Set(summary.dates)].sort().reverse();
    summary.uniqueTargets = summary.uniqueTargets.size;
    summary.profitMargin =
      summary.revenue > 0
        ? ((summary.profit / summary.revenue) * 100).toFixed(2)
        : 0;
  });

  // Calculate overall profit
  const totalProfit = totalRevenue - totalRealCost;
  const overallProfitMargin =
    totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0;

  return {
    summary: {
      overall: {
        totalOrders: orders.length,
        realCost: totalRealCost, // Total cost paid to Fampage
        revenue: totalRevenue, // Total revenue from invoices (what we charged)
        profit: totalProfit, // Total profit (revenue - realCost)
        profitMargin: parseFloat(overallProfitMargin), // Profit margin percentage
      },
      byServiceType: Object.values(serviceTypeSummary),
    },
    detailed: aggregatedStats.map((stat) => ({
      ...stat,
      profitMargin:
        stat.revenue > 0
          ? parseFloat(((stat.profit / stat.revenue) * 100).toFixed(2))
          : 0,
    })),
    orders: orders.map((o) => {
      const orderJson = o.toJSON();
      const invoice = orderJson.invoiceId || null;
      return {
        ...orderJson,
        realCost: orderJson.cost, // Cost paid to Fampage
        revenue: invoice?.total || 0, // Revenue from invoice
        profit: invoice ? invoice.total - orderJson.cost : 0, // Profit for this order
        profitMargin:
          invoice && invoice.total > 0
            ? parseFloat(
                (
                  ((invoice.total - orderJson.cost) / invoice.total) *
                  100
                ).toFixed(2)
              )
            : 0,
      };
    }),
    totalOrders: orders.length,
  };
};

const getOrderDetailsByTarget = async (
  targetUrl,
  companyId = null,
  filters = {}
) => {
  const matchFilter = { targetUrl };

  if (companyId) {
    matchFilter.companyId = companyId;
  }

  if (filters.startDate || filters.endDate) {
    matchFilter.submittedAt = {};
    if (filters.startDate) {
      matchFilter.submittedAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      matchFilter.submittedAt.$lte = new Date(filters.endDate);
    }
  }

  const orders = await Order.find(matchFilter)
    .populate("providerId", "name")
    .populate("invoiceId", "total subtotal multiplier")
    .sort({ submittedAt: -1 });

  return orders.map((o) => {
    const orderJson = o.toJSON();
    const invoice = orderJson.invoiceId || null;
    return {
      ...orderJson,
      realCost: orderJson.cost, // Cost paid to Fampage
      revenue: invoice?.total || 0, // Revenue from invoice
      profit: invoice ? invoice.total - orderJson.cost : 0, // Profit for this order
      profitMargin:
        invoice && invoice.total > 0
          ? parseFloat(
              (
                ((invoice.total - orderJson.cost) / invoice.total) *
                100
              ).toFixed(2)
            )
          : 0,
    };
  });
};

const getCompanyOrderHistory = async (companyId, filters = {}) => {
  const matchFilter = { companyId };

  if (filters.startDate || filters.endDate) {
    matchFilter.submittedAt = {};
    if (filters.startDate) {
      matchFilter.submittedAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      matchFilter.submittedAt.$lte = new Date(filters.endDate);
    }
  }

  if (filters.serviceType) {
    matchFilter.serviceType = filters.serviceType;
  }

  if (filters.targetUrl) {
    matchFilter.targetUrl = { $regex: filters.targetUrl, $options: "i" };
  }

  const orders = await Order.find(matchFilter)
    .populate("providerId", "name")
    .populate("invoiceId", "invoiceNumber status total subtotal multiplier")
    .sort({ submittedAt: -1 });

  // Calculate totals for profit analysis
  let totalRealCost = 0;
  let totalRevenue = 0;

  // Group orders by target URL with profit calculations
  const groupedByTarget = {};
  orders.forEach((order) => {
    const orderJson = order.toJSON();
    const invoice = orderJson.invoiceId || null;

    const orderWithProfit = {
      ...orderJson,
      realCost: orderJson.cost, // Cost paid to Fampage
      revenue: invoice?.total || 0, // Revenue from invoice
      profit: invoice ? invoice.total - orderJson.cost : 0, // Profit for this order
      profitMargin:
        invoice && invoice.total > 0
          ? parseFloat(
              (
                ((invoice.total - orderJson.cost) / invoice.total) *
                100
              ).toFixed(2)
            )
          : 0,
    };

    totalRealCost += orderJson.cost;
    totalRevenue += invoice?.total || 0;

    if (!groupedByTarget[order.targetUrl]) {
      groupedByTarget[order.targetUrl] = {
        targetUrl: order.targetUrl,
        orders: [],
        totalOrders: 0,
        totalRealCost: 0,
        totalRevenue: 0,
        totalProfit: 0,
      };
    }
    groupedByTarget[order.targetUrl].orders.push(orderWithProfit);
    groupedByTarget[order.targetUrl].totalOrders += 1;
    groupedByTarget[order.targetUrl].totalRealCost += orderJson.cost;
    groupedByTarget[order.targetUrl].totalRevenue += invoice?.total || 0;
    groupedByTarget[order.targetUrl].totalProfit += invoice
      ? invoice.total - orderJson.cost
      : 0;
  });

  // Calculate profit margins for each target URL
  Object.keys(groupedByTarget).forEach((targetUrl) => {
    const group = groupedByTarget[targetUrl];
    group.profitMargin =
      group.totalRevenue > 0
        ? parseFloat(
            ((group.totalProfit / group.totalRevenue) * 100).toFixed(2)
          )
        : 0;
  });

  const totalProfit = totalRevenue - totalRealCost;
  const overallProfitMargin =
    totalRevenue > 0
      ? parseFloat(((totalProfit / totalRevenue) * 100).toFixed(2))
      : 0;

  return {
    orders: orders.map((o) => {
      const orderJson = o.toJSON();
      const invoice = orderJson.invoiceId || null;
      return {
        ...orderJson,
        realCost: orderJson.cost,
        revenue: invoice?.total || 0,
        profit: invoice ? invoice.total - orderJson.cost : 0,
        profitMargin:
          invoice && invoice.total > 0
            ? parseFloat(
                (
                  ((invoice.total - orderJson.cost) / invoice.total) *
                  100
                ).toFixed(2)
              )
            : 0,
      };
    }),
    groupedByTarget,
    totalOrders: orders.length,
    summary: {
      totalRealCost,
      totalRevenue,
      totalProfit,
      profitMargin: overallProfitMargin,
    },
  };
};

const getStatisticsSummary = async (companyId = null, filters = {}) => {
  const matchFilter = {};

  if (companyId) {
    matchFilter.companyId = companyId;
  }

  if (filters.startDate || filters.endDate) {
    matchFilter.submittedAt = {};
    if (filters.startDate) {
      matchFilter.submittedAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      matchFilter.submittedAt.$lte = new Date(filters.endDate);
    }
  }

  // Pipeline to get order statistics with invoice data for cost comparison
  const pipeline = [
    { $match: matchFilter },
    {
      $lookup: {
        from: "invoices",
        localField: "_id",
        foreignField: "orderId",
        as: "invoice",
      },
    },
    {
      $unwind: { path: "$invoice", preserveNullAndEmptyArrays: true },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        realCost: { $sum: "$cost" }, // Real cost paid to Fampage
        revenue: { $sum: "$invoice.total" }, // Revenue from invoices (what we charged)
        byStatus: {
          $push: {
            status: "$status",
            quantity: "$quantity",
            cost: "$cost",
            revenue: "$invoice.total",
          },
        },
        byServiceType: {
          $push: {
            serviceType: "$serviceType",
            quantity: "$quantity",
            cost: "$cost",
            revenue: "$invoice.total",
          },
        },
      },
    },
  ];

  const result = await Order.aggregate(pipeline);
  if (result.length === 0) {
    return {
      totalOrders: 0,
      totalQuantity: 0,
      realCost: 0,
      revenue: 0,
      byStatus: {},
      byServiceType: {},
    };
  }

  const stats = result[0];
  const realCost = stats.realCost || 0;
  const revenue = stats.revenue || 0;

  // Calculate status breakdown - only realCost and revenue
  const byStatus = {};
  stats.byStatus.forEach((item) => {
    if (!byStatus[item.status]) {
      byStatus[item.status] = {
        count: 0,
        quantity: 0,
        realCost: 0,
        revenue: 0,
      };
    }
    byStatus[item.status].count += 1;
    byStatus[item.status].quantity += item.quantity || 0;
    byStatus[item.status].realCost += item.cost || 0;
    byStatus[item.status].revenue += item.revenue || 0;
  });

  // Calculate service type breakdown - only realCost and revenue
  const byServiceType = {};
  stats.byServiceType.forEach((item) => {
    if (!byServiceType[item.serviceType]) {
      byServiceType[item.serviceType] = {
        count: 0,
        quantity: 0,
        realCost: 0,
        revenue: 0,
      };
    }
    byServiceType[item.serviceType].count += 1;
    byServiceType[item.serviceType].quantity += item.quantity || 0;
    byServiceType[item.serviceType].realCost += item.cost || 0;
    byServiceType[item.serviceType].revenue += item.revenue || 0;
  });

  return {
    totalOrders: stats.totalOrders,
    totalQuantity: stats.totalQuantity,
    realCost, // Total cost paid to Fampage
    revenue, // Total revenue from invoices (what we charged)
    byStatus,
    byServiceType,
  };
};

module.exports = {
  getCompanyAnalytics,
  getOrderDetailsByTarget,
  getCompanyOrderHistory,
  getStatisticsSummary,
};
