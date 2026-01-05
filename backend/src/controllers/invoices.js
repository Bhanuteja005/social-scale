const invoiceService = require("../services/invoices");
const { getPaginationParams } = require("../utils/pagination");

const createInvoice = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const invoice = await invoiceService.createInvoice(orderId, req.body);

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await invoiceService.getInvoiceById(id);

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

const getAllInvoices = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const result = await invoiceService.getAllInvoices({
      ...pagination,
      ...req.query,
      companyId: req.companyId, // Add company scoping
    });

    res.status(200).json({
      success: true,
      data: result.invoices,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, ...paymentData } = req.body;
    const invoice = await invoiceService.updateInvoiceStatus(
      id,
      status,
      paymentData
    );

    res.status(200).json({
      success: true,
      message: "Invoice status updated successfully",
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyInvoices = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const pagination = getPaginationParams(req.query);
    const result = await invoiceService.getCompanyInvoices(companyId, {
      ...pagination,
      ...req.query,
    });

    res.status(200).json({
      success: true,
      data: result.invoices,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const downloadInvoicePDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(id);
    const invoice = await invoiceService.getInvoiceById(id);

    // Set headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvoice,
  getInvoiceById,
  getAllInvoices,
  updateInvoiceStatus,
  getCompanyInvoices,
  downloadInvoicePDF,
};
