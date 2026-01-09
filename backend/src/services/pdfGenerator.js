const PDFDocument = require("pdfkit");
const Company = require("../models/Company");

/**
 * Generate PDF buffer for an invoice
 * @param {Object} invoice - Invoice document with populated orderId and companyId
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateInvoicePDF = async (invoice) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get company details
      const company = await Company.findOne({ companyId: invoice.companyId });

      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

      // Header
      doc.fontSize(24).text("INVOICE", { align: "center" });
      doc.moveDown();

      // Invoice details
      doc.fontSize(12);
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`, { align: "left" });
      doc.text(`Date: ${new Date(invoice.issuedAt).toLocaleDateString()}`, {
        align: "left",
      });
      if (invoice.dueDate) {
        doc.text(
          `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
          { align: "left" }
        );
      }
      doc.text(`Status: ${invoice.status.toUpperCase()}`, { align: "left" });
      doc.moveDown();

      // Company details (if available)
      if (company) {
        doc.fontSize(14).text("Bill To:", { underline: true });
        doc.fontSize(12);
        doc.text(company.name);
        if (company.address) {
          if (company.address.street) doc.text(company.address.street);
          if (company.address.city) {
            let addressLine = company.address.city;
            if (company.address.state)
              addressLine += `, ${company.address.state}`;
            if (company.address.zipCode)
              addressLine += ` ${company.address.zipCode}`;
            doc.text(addressLine);
          }
          if (company.address.country) doc.text(company.address.country);
        }
        doc.moveDown();
      }

      // Order details (if available)
      if (invoice.orderId && typeof invoice.orderId === "object") {
        const order = invoice.orderId;
        doc.fontSize(14).text("Order Details:", { underline: true });
        doc.fontSize(12);
        doc.text(`Service: ${order.serviceName || "N/A"}`);
        doc.text(`Target URL: ${order.targetUrl || "N/A"}`);
        doc.text(`Quantity: ${order.quantity || 0}`);
        doc.text(`Service Type: ${order.serviceType || "N/A"}`);
        doc.moveDown();
      }

      // Items table
      doc.fontSize(14).text("Items:", { underline: true });
      doc.moveDown(0.5);

      // Check if this is a credit-based invoice
      const isCreditBased = invoice.total === 0 && invoice.items.some(item => item.credits > 0);

      if (isCreditBased) {
        // Credit-based invoice headers
        doc.fontSize(10);
        doc.text("Description", 50, doc.y);
        doc.text("Quantity", 350, doc.y, { width: 60, align: "right" });
        doc.text("Credits Used", 420, doc.y, { width: 80, align: "right" });
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y).lineTo(590, doc.y).stroke();
        doc.moveDown(0.3);

        // Credit-based table rows
        invoice.items.forEach((item) => {
          const startY = doc.y;
          doc.text(item.description || "N/A", 50, startY, {
            width: 290,
            align: "left",
          });
          doc.text(item.quantity.toString(), 350, startY, {
            width: 60,
            align: "right",
          });
          doc.text(item.credits.toString(), 420, startY, {
            width: 80,
            align: "right",
          });
          doc.moveDown(0.5);
        });
      } else {
        // Monetary invoice headers
        doc.fontSize(10);
        doc.text("Description", 50, doc.y);
        doc.text("Quantity", 350, doc.y, { width: 60, align: "right" });
        doc.text("Unit Price", 420, doc.y, { width: 80, align: "right" });
        doc.text("Total", 510, doc.y, { width: 80, align: "right" });
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y).lineTo(590, doc.y).stroke();
        doc.moveDown(0.3);

        // Monetary table rows
        invoice.items.forEach((item) => {
          const startY = doc.y;
          doc.text(item.description || "N/A", 50, startY, {
            width: 290,
            align: "left",
          });
          doc.text(item.quantity.toString(), 350, startY, {
            width: 60,
            align: "right",
          });
          doc.text(
            `${invoice.currency || "USD"} ${item.unitPrice.toFixed(2)}`,
            420,
            startY,
            { width: 80, align: "right" }
          );
          doc.text(
            `${invoice.currency || "USD"} ${item.total.toFixed(2)}`,
            510,
            startY,
            { width: 80, align: "right" }
          );
          doc.moveDown(0.5);
        });
      }

      doc.moveTo(50, doc.y).lineTo(590, doc.y).stroke();
      doc.moveDown();

      // Summary
      const summaryY = doc.y;
      doc.fontSize(12);

      if (isCreditBased) {
        // Credit-based summary
        const totalCredits = invoice.items.reduce((sum, item) => sum + (item.credits || 0), 0);
        doc.fontSize(14);
        doc.font("Helvetica-Bold");
        doc.text(`Total Credits Used: ${totalCredits}`, 400, summaryY, {
          align: "right",
        });
      } else {
        // Monetary summary
        if (invoice.multiplier) {
          doc.text(`Multiplier: ${invoice.multiplier}x`, 400, summaryY, {
            align: "right",
          });
          doc.moveDown(0.3);
        }
        if (invoice.discount > 0) {
          doc.text(
            `Discount: ${invoice.currency || "USD"} ${invoice.discount.toFixed(
              2
            )}`,
            400,
            doc.y,
            { align: "right" }
          );
          doc.moveDown(0.3);
        }
        if (invoice.tax > 0) {
          doc.text(
            `Tax: ${invoice.currency || "USD"} ${invoice.tax.toFixed(2)}`,
            400,
            doc.y,
            { align: "right" }
          );
          doc.moveDown(0.3);
        }
        doc.fontSize(14);
        doc.font("Helvetica-Bold");
        doc.text(
          `Total: ${invoice.currency || "USD"} ${invoice.total.toFixed(2)}`,
          400,
          doc.y,
          { align: "right" }
        );
      }
      doc.font("Helvetica"); // Reset font

      // Payment Details (if available)
      if (invoice.metadata?.paymentDetails) {
        doc.moveDown();
        doc.fontSize(12);
        doc.text("Payment Details:", { underline: true });
        doc.fontSize(10);
        const payment = invoice.metadata.paymentDetails;
        doc.text(`Payment ID: ${payment.paymentId || 'N/A'}`);
        doc.text(`Payment Method: ${payment.paymentMethod || 'N/A'}`);
        doc.text(`Payment Status: ${payment.paymentStatus || 'N/A'}`);
        if (payment.paidAt) {
          doc.text(`Paid At: ${new Date(payment.paidAt).toLocaleString()}`);
        }
      }

      // Subscription Details (if available)
      if (invoice.metadata?.subscriptionDetails) {
        doc.moveDown();
        doc.fontSize(12);
        doc.text("Subscription Details:", { underline: true });
        doc.fontSize(10);
        const sub = invoice.metadata.subscriptionDetails;
        doc.text(`Subscription ID: ${sub.subscriptionId}`);
        doc.text(`Plan: ${sub.plan}`);
        doc.text(`Credits: ${sub.credits}`);
        doc.text(`Status: ${sub.status}`);
        if (sub.startDate) {
          doc.text(`Start Date: ${new Date(sub.startDate).toLocaleDateString()}`);
        }
        if (sub.endDate) {
          doc.text(`End Date: ${new Date(sub.endDate).toLocaleDateString()}`);
        }
      }

      // Notes (if available)
      if (invoice.notes) {
        doc.moveDown();
        doc.fontSize(12);
        doc.text("Notes:", { underline: true });
        doc.fontSize(10);
        doc.text(invoice.notes, { align: "left" });
      }

      // Footer
      const pageHeight = doc.page.height;
      doc.fontSize(8);
      doc.text("This is a computer-generated invoice.", 50, pageHeight - 50, {
        align: "center",
        width: 500,
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF,
};
