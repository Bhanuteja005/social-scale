const Invoice = require("../models/Invoice");
const Order = require("../models/Order");
const Company = require("../models/Company");
const { NotFoundError, AppError } = require("../utils/errors");
const pdfGenerator = require("./pdfGenerator");

const createInvoice = async (orderId, invoiceData = {}) => {
  // Get order details
  const order = await Order.findById(orderId).populate("providerId", "name");
  if (!order) {
    throw new NotFoundError("Order");
  }

  // Check if invoice already exists for this order
  if (order.invoiceId) {
    const existingInvoice = await Invoice.findById(order.invoiceId);
    if (existingInvoice) {
      throw new AppError("Invoice already exists for this order", 409);
    }
  }

  // Get company details
  const company = await Company.findOne({ companyId: order.companyId });
  if (!company) {
    throw new NotFoundError("Company");
  }

  // Calculate invoice amounts from order cost
  const orderCost = order.cost || 0;
  const unitPrice = order.quantity > 0 ? orderCost / order.quantity : 0;

  // Create invoice items with actual INR amounts
  const items = [
    {
      description: `${order.serviceName} - ${order.targetUrl || 'N/A'}`,
      quantity: order.quantity,
      unitPrice: unitPrice,
      total: orderCost,
    },
  ];

  // Set monetary values from order cost
  const subtotal = orderCost;
  const tax = 0;
  const discount = 0;
  const total = orderCost;

  // Prepare metadata with payment and subscription details if available
  const metadata = {
    serviceType: order.serviceType,
    targetUrl: order.targetUrl,
    amount: orderCost,
    orderType: 'service_order',
    ...invoiceData.metadata,
  };

  // Add payment details if order has payment information
  if (order.paymentId || order.status === 'completed') {
    metadata.paymentDetails = {
      paymentId: order.paymentId,
      paymentMethod: order.paymentMethod || 'credits',
      paymentStatus: order.status,
      paidAt: order.updatedAt,
    };
  }

  // Add subscription details if this is related to a subscription
  if (order.subscriptionId) {
    const Subscription = require("../models/Subscription");
    const subscription = await Subscription.findById(order.subscriptionId);
    if (subscription) {
      metadata.subscriptionDetails = {
        subscriptionId: subscription._id,
        plan: subscription.plan,
        credits: subscription.credits,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      };
    }
  }

  // Create invoice
  const invoice = await Invoice.create({
    companyId: order.companyId,
    orderId: order._id,
    items,
    subtotal,
    tax,
    discount,
    total,
    multiplier: 1,
    currency: "INR",
    status: invoiceData.status || "paid",
    dueDate: null,
    notes: `Amount: ₹${orderCost.toFixed(2)} | ${invoiceData.notes || ""}`,
    metadata,
  });

  // Link invoice to order
  order.invoiceId = invoice._id;
  await order.save();

  return invoice.toJSON();
};

const getInvoiceById = async (invoiceId) => {
  const invoice = await Invoice.findById(invoiceId)
    .populate("orderId")
    .populate({
      path: "orderId",
      populate: {
        path: "providerId",
        select: "name",
      },
    });

  if (!invoice) {
    throw new NotFoundError("Invoice");
  }

  return invoice.toJSON();
};

const getAllInvoices = async (query) => {
  const { page = 1, limit = 20, skip = (page - 1) * limit } = query;
  const filter = {};

  if (query.companyId) {
    filter.companyId = query.companyId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.startDate || query.endDate) {
    filter.issuedAt = {};
    if (query.startDate) {
      filter.issuedAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.issuedAt.$lte = new Date(query.endDate);
    }
  }

  // Price filtering (total invoice amount)
  if (query.minTotal !== undefined || query.maxTotal !== undefined) {
    filter.total = {};
    if (query.minTotal !== undefined) {
      filter.total.$gte = parseFloat(query.minTotal);
    }
    if (query.maxTotal !== undefined) {
      filter.total.$lte = parseFloat(query.maxTotal);
    }
  }

  // Subtotal filtering
  if (query.minSubtotal !== undefined || query.maxSubtotal !== undefined) {
    filter.subtotal = {};
    if (query.minSubtotal !== undefined) {
      filter.subtotal.$gte = parseFloat(query.minSubtotal);
    }
    if (query.maxSubtotal !== undefined) {
      filter.subtotal.$lte = parseFloat(query.maxSubtotal);
    }
  }

  const invoices = await Invoice.find(filter)
    .populate("orderId", "serviceName targetUrl quantity cost")
    .sort({ issuedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Invoice.countDocuments(filter);

  return {
    invoices: invoices.map((i) => i.toJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateInvoiceStatus = async (invoiceId, status, paymentData = {}) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new NotFoundError("Invoice");
  }

  invoice.status = status;

  if (status === "paid") {
    invoice.paidAt = paymentData.paidAt || new Date();
    invoice.paymentMethod = paymentData.paymentMethod || null;
  }

  await invoice.save();
  return invoice.toJSON();
};

const getCompanyInvoices = async (companyId, query = {}) => {
  const { page = 1, limit = 20, skip = (page - 1) * limit } = query;
  const filter = { companyId };

  if (query.status) {
    filter.status = query.status;
  }

  // Price filtering (total invoice amount)
  if (query.minTotal !== undefined || query.maxTotal !== undefined) {
    filter.total = {};
    if (query.minTotal !== undefined) {
      filter.total.$gte = parseFloat(query.minTotal);
    }
    if (query.maxTotal !== undefined) {
      filter.total.$lte = parseFloat(query.maxTotal);
    }
  }

  // Subtotal filtering
  if (query.minSubtotal !== undefined || query.maxSubtotal !== undefined) {
    filter.subtotal = {};
    if (query.minSubtotal !== undefined) {
      filter.subtotal.$gte = parseFloat(query.minSubtotal);
    }
    if (query.maxSubtotal !== undefined) {
      filter.subtotal.$lte = parseFloat(query.maxSubtotal);
    }
  }

  const invoices = await Invoice.find(filter)
    .populate("orderId", "serviceName targetUrl quantity cost")
    .sort({ issuedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Invoice.countDocuments(filter);

  return {
    invoices: invoices.map((i) => i.toJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const generateInvoicePDFBuffer = async (invoiceId) => {
  const invoice = await Invoice.findById(invoiceId)
    .populate("orderId")
    .populate({
      path: "orderId",
      populate: {
        path: "providerId",
        select: "name",
      },
    });

  if (!invoice) {
    throw new NotFoundError("Invoice");
  }

  const pdfBuffer = await pdfGenerator.generateInvoicePDF(invoice.toJSON());
  return pdfBuffer;
};

module.exports = {
  createInvoice,
  getInvoiceById,
  getAllInvoices,
  updateInvoiceStatus,
  getCompanyInvoices,
  generateInvoicePDFBuffer,
};
