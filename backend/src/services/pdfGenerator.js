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

      // Header with invoice number and date on same line
      doc.fontSize(20).font('Helvetica-Bold').text("INVOICE", 50, 50);
      doc.fontSize(10).font('Helvetica');
      doc.text(`#${invoice.invoiceNumber}`, 450, 52, { width: 100, align: 'right' });
      doc.text(`Date: ${new Date(invoice.issuedAt).toLocaleDateString()}`, 450, 66, { width: 100, align: 'right' });
      
      // Status badge
      const statusColor = invoice.status === 'paid' ? '#10b981' : invoice.status === 'pending' ? '#f59e0b' : '#6b7280';
      doc.fontSize(9).fillColor(statusColor).text(`● ${invoice.status.toUpperCase()}`, 450, 80, { width: 100, align: 'right' });
      doc.fillColor('#000000');
      
      doc.moveDown(3);

      // Company details in a box
      if (company) {
        const boxY = doc.y;
        doc.fontSize(9).fillColor('#6b7280').text("BILL TO", 50, boxY);
        doc.fillColor('#000000');
        doc.fontSize(11).font('Helvetica-Bold').text(company.name, 50, boxY + 15);
        doc.fontSize(9).font('Helvetica');
        
        let currentY = boxY + 30;
        if (company.address) {
          if (company.address.street) {
            doc.text(company.address.street, 50, currentY);
            currentY += 12;
          }
          if (company.address.city || company.address.state || company.address.zipCode) {
            let addressLine = '';
            if (company.address.city) addressLine += company.address.city;
            if (company.address.state) addressLine += (addressLine ? ', ' : '') + company.address.state;
            if (company.address.zipCode) addressLine += (addressLine ? ' ' : '') + company.address.zipCode;
            if (addressLine) {
              doc.text(addressLine, 50, currentY);
              currentY += 12;
            }
          }
          if (company.address.country) {
            doc.text(company.address.country, 50, currentY);
            currentY += 12;
          }
        }
        doc.y = currentY + 10;
      }

      // Order details in a compact format
      if (invoice.orderId && typeof invoice.orderId === "object") {
        const order = invoice.orderId;
        const orderY = doc.y;
        
        doc.fontSize(9).fillColor('#6b7280').text("ORDER DETAILS", 50, orderY);
        doc.fillColor('#000000');
        
        doc.fontSize(9).font('Helvetica');
        doc.text(`Service: ${order.serviceName || "N/A"}`, 50, orderY + 15, { width: 300 });
        doc.text(`Link: ${order.targetUrl || "N/A"}`, 50, orderY + 28, { width: 300 });
        doc.text(`Quantity: ${order.quantity || 0}`, 50, orderY + 41);
        
        doc.y = orderY + 60;
      }

      // Items table with gray background header
      const tableY = doc.y;
      
      // Table header background
      doc.rect(50, tableY, 492, 20).fillAndStroke('#f3f4f6', '#e5e7eb');
      
      // Check if this is a credit-based invoice
      const isCreditBased = invoice.total === 0 && invoice.items.some(item => item.credits > 0);

      if (isCreditBased) {
        // Credit-based invoice headers
        doc.fontSize(9).fillColor('#374151').font('Helvetica-Bold');
        doc.text("DESCRIPTION", 60, tableY + 6);
        doc.text("QTY", 380, tableY + 6, { width: 50, align: "right" });
        doc.text("CREDITS", 470, tableY + 6, { width: 62, align: "right" });
        doc.fillColor('#000000').font('Helvetica');
        
        // Credit-based table rows
        let currentY = tableY + 30;
        invoice.items.forEach((item, index) => {
          if (index % 2 === 1) {
            doc.rect(50, currentY - 4, 492, 16).fill('#fafafa');
          }
          doc.fontSize(9);
          doc.fillColor('#000000');
          doc.text(item.description || "N/A", 60, currentY, { width: 310 });
          doc.text(item.quantity.toString(), 380, currentY, { width: 50, align: "right" });
          doc.text(item.credits.toString(), 470, currentY, { width: 62, align: "right" });
          currentY += 16;
        });
        doc.y = currentY + 10;
      } else {
        // Monetary invoice headers
        doc.fontSize(9).fillColor('#374151').font('Helvetica-Bold');
        doc.text("DESCRIPTION", 60, tableY + 6);
        doc.text("QTY", 330, tableY + 6, { width: 40, align: "right" });
        doc.text("PRICE", 390, tableY + 6, { width: 70, align: "right" });
        doc.text("AMOUNT", 470, tableY + 6, { width: 62, align: "right" });
        doc.fillColor('#000000').font('Helvetica');
        
        // Monetary table rows
        let currentY = tableY + 30;
        invoice.items.forEach((item, index) => {
          if (index % 2 === 1) {
            doc.rect(50, currentY - 4, 492, 16).fill('#fafafa');
          }
          doc.fontSize(9);
          doc.fillColor('#000000');
          
          // Truncate description if too long
          let description = item.description || "N/A";
          if (description.length > 45) {
            description = description.substring(0, 42) + "...";
          }
          
          doc.text(description, 60, currentY, { width: 260 });
          doc.text(item.quantity.toString(), 330, currentY, { width: 40, align: "right" });
          doc.text(`₹${item.unitPrice.toFixed(2)}`, 390, currentY, { width: 70, align: "right" });
          doc.text(`₹${item.total.toFixed(2)}`, 470, currentY, { width: 62, align: "right" });
          currentY += 16;
        });
        doc.y = currentY + 10;
      }

      // Top border for summary
      doc.moveTo(50, doc.y).lineTo(542, doc.y).stroke('#e5e7eb');
      doc.moveDown(0.5);

      // Summary section
      const summaryY = doc.y;

      if (isCreditBased) {
        // Credit-based summary
        const totalCredits = invoice.items.reduce((sum, item) => sum + (item.credits || 0), 0);
        
        // Total in a box
        doc.rect(390, summaryY, 152, 30).fillAndStroke('#f3f4f6', '#e5e7eb');
        doc.fontSize(10).fillColor('#6b7280').font('Helvetica').text("TOTAL CREDITS", 400, summaryY + 6, { width: 132, align: 'left' });
        doc.fontSize(16).fillColor('#000000').font('Helvetica-Bold').text(totalCredits.toString(), 400, summaryY + 18, { width: 132, align: 'right' });
      } else {
        // Monetary summary - cleaner layout
        let summaryStartY = summaryY;
        
        doc.fontSize(9).font('Helvetica');
        
        // Only show discount and tax if they exist
        if (invoice.discount > 0) {
          doc.fillColor('#6b7280').text("Discount:", 400, summaryStartY);
          doc.fillColor('#000000').text(`₹${invoice.discount.toFixed(2)}`, 470, summaryStartY, { width: 72, align: 'right' });
          summaryStartY += 14;
        }
        
        if (invoice.tax > 0) {
          doc.fillColor('#6b7280').text("Tax:", 400, summaryStartY);
          doc.fillColor('#000000').text(`₹${invoice.tax.toFixed(2)}`, 470, summaryStartY, { width: 72, align: 'right' });
          summaryStartY += 14;
        }
        
        // Total in a highlighted box
        summaryStartY += 4;
        doc.rect(390, summaryStartY, 152, 30).fillAndStroke('#3b82f6', '#3b82f6');
        doc.fontSize(10).fillColor('#ffffff').font('Helvetica').text("TOTAL AMOUNT", 400, summaryStartY + 6, { width: 132, align: 'left' });
        doc.fontSize(16).fillColor('#ffffff').font('Helvetica-Bold').text(`₹${invoice.total.toFixed(2)}`, 400, summaryStartY + 18, { width: 132, align: 'right' });
        doc.fillColor('#000000');
      }
      
      doc.font("Helvetica"); // Reset font
      doc.y = summaryY + 50;

      // Notes (simplified)
      if (invoice.notes) {
        doc.moveDown();
        doc.fontSize(8).fillColor('#6b7280').text("Notes:", 50, doc.y);
        doc.fontSize(8).fillColor('#374151').text(invoice.notes, 50, doc.y + 12, { width: 492 });
        doc.fillColor('#000000');
      }

      // Footer
      const pageHeight = doc.page.height;
      doc.fontSize(8).fillColor('#9ca3af');
      doc.text("Thank you for your business!", 50, pageHeight - 60, { align: "center", width: 492 });
      doc.text("This is a computer-generated invoice. No signature required.", 50, pageHeight - 48, { align: "center", width: 492 });
      doc.fillColor('#000000');

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF,
};
