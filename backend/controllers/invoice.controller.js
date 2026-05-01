const asyncHandler = require("express-async-handler");
const PDFDocument  = require("pdfkit");
const Invoice      = require("../models/Invoice.model");
const Customer     = require("../models/Customer.model");
const User         = require("../models/User.model");

// ── GST calculation helper ────────────────────────────────────────────────────
const calculateTotals = (items, gstType) => {
  let subtotal = 0, discountTotal = 0, taxableAmount = 0, totalTax = 0;
  const processed = items.map(item => {
    const gross   = item.quantity * item.rate;
    const disc    = gross * (item.discount || 0) / 100;
    const taxable = gross - disc;
    const tax     = taxable * (item.taxRate || 18) / 100;
    subtotal      += gross;
    discountTotal += disc;
    taxableAmount += taxable;
    totalTax      += tax;
    return { ...item, amount: taxable };
  });

  const isIntra = gstType === "intra";
  return {
    items: processed,
    subtotal:     +subtotal.toFixed(2),
    discountTotal:+discountTotal.toFixed(2),
    taxableAmount:+taxableAmount.toFixed(2),
    cgst:         isIntra ? +(totalTax / 2).toFixed(2) : 0,
    sgst:         isIntra ? +(totalTax / 2).toFixed(2) : 0,
    igst:         isIntra ? 0 : +totalTax.toFixed(2),
    totalTax:     +totalTax.toFixed(2),
    total:        +(taxableAmount + totalTax).toFixed(2),
    roundOff:     0,
  };
};

// ── Auto-generate invoice number ──────────────────────────────────────────────
const getNextInvoiceNumber = async (userId) => {
  const user = await User.findById(userId);
  const prefix = user.invoiceSettings?.prefix || "INV";
  const last = await Invoice.findOne({ user: userId }).sort({ createdAt: -1 });
  let num = user.invoiceSettings?.startNumber || 1;
  if (last) {
    const match = last.invoiceNumber.match(/(\d+)$/);
    if (match) num = parseInt(match[1]) + 1;
  }
  return `${prefix}-${new Date().getFullYear()}-${String(num).padStart(4, "0")}`;
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
  const { status, customer, startDate, endDate, page = 1, limit = 20, search } = req.query;
  const query = { user: req.user._id };

  if (status)    query.status = status;
  if (customer)  query.customer = customer;
  if (startDate || endDate) query.issueDate = {};
  if (startDate) query.issueDate.$gte = new Date(startDate);
  if (endDate)   query.issueDate.$lte = new Date(endDate);
  if (search)    query.invoiceNumber = { $regex: search, $options: "i" };

  // Auto-mark overdue invoices
  await Invoice.updateMany(
    { user: req.user._id, status: "sent", dueDate: { $lt: new Date() } },
    { status: "overdue" }
  );

  const skip = (page - 1) * limit;
  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .populate("customer", "name email gstin phone")
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Invoice.countDocuments(query),
  ]);

  res.json({ success: true, data: invoices, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id })
    .populate("customer")
    .populate("subscription");
  if (!invoice) { res.status(404); throw new Error("Invoice not found"); }

  // Mark as viewed
  if (invoice.status === "sent") {
    invoice.status  = "viewed";
    invoice.viewedAt = new Date();
    await invoice.save();
  }

  res.json({ success: true, data: invoice });
});

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = asyncHandler(async (req, res) => {
  const { customer, items, gstType = "intra", issueDate, dueDate, notes, terms, paymentTerms } = req.body;

  const cust = await Customer.findOne({ _id: customer, user: req.user._id });
  if (!cust) { res.status(404); throw new Error("Customer not found"); }

  const invoiceNumber = await getNextInvoiceNumber(req.user._id);
  const totals = calculateTotals(items, gstType);

  const invoice = await Invoice.create({
    user: req.user._id,
    customer,
    invoiceNumber,
    issueDate: issueDate || new Date(),
    dueDate:   dueDate   || new Date(Date.now() + 30 * 86400000),
    gstType,
    notes,
    terms,
    paymentTerms,
    ...totals,
    balanceDue: totals.total,
  });

  await invoice.populate("customer", "name email gstin");
  res.status(201).json({ success: true, data: invoice });
});

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
  if (!invoice) { res.status(404); throw new Error("Invoice not found"); }
  if (["paid", "cancelled"].includes(invoice.status)) {
    res.status(400);
    throw new Error(`Cannot edit a ${invoice.status} invoice`);
  }

  const { items, gstType, ...rest } = req.body;
  const totals = items ? calculateTotals(items, gstType || invoice.gstType) : {};

  Object.assign(invoice, rest, totals);
  if (items) invoice.balanceDue = (totals.total || invoice.total) - invoice.paidAmount;
  await invoice.save();

  await invoice.populate("customer", "name email gstin");
  res.json({ success: true, data: invoice });
});

// @desc    Send invoice (update status)
// @route   POST /api/invoices/:id/send
// @access  Private
const sendInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
  if (!invoice) { res.status(404); throw new Error("Invoice not found"); }
  invoice.status = "sent";
  invoice.sentAt = new Date();
  await invoice.save();
  // In production: trigger email via nodemailer here
  res.json({ success: true, message: "Invoice marked as sent", data: invoice });
});

// @desc    Record a payment against invoice
// @route   POST /api/invoices/:id/payment
// @access  Private
const recordPayment = asyncHandler(async (req, res) => {
  const { amount, method, notes } = req.body;
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
  if (!invoice) { res.status(404); throw new Error("Invoice not found"); }

  invoice.paidAmount += Number(amount);
  if (invoice.paidAmount >= invoice.total) {
    invoice.paidAmount = invoice.total;
    invoice.status = "paid";
    invoice.paidAt = new Date();
  } else {
    invoice.status = "partial";
  }
  invoice.balanceDue = invoice.total - invoice.paidAmount;
  await invoice.save();

  // Create payment record
  const Payment = require("../models/Payment.model");
  await Payment.create({
    user: req.user._id,
    invoice: invoice._id,
    customer: invoice.customer,
    amount: Number(amount),
    method,
    status: "success",
    paidAt: new Date(),
    notes,
    receiptNumber: `RCP-${Date.now()}`,
  });

  res.json({ success: true, data: invoice });
});

// @desc    Cancel invoice
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
  if (!invoice) { res.status(404); throw new Error("Invoice not found"); }
  if (invoice.status === "paid") { res.status(400); throw new Error("Cannot delete a paid invoice"); }
  invoice.status = "cancelled";
  await invoice.save();
  res.json({ success: true, message: "Invoice cancelled" });
});

// @desc    Generate PDF
// @route   GET /api/invoices/:id/pdf
// @access  Private
const generatePDF = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id })
    .populate("customer")
    .populate("user");
  if (!invoice) { res.status(404); throw new Error("Invoice not found"); }

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  doc.pipe(res);

  const biz  = invoice.user.business;
  const cust = invoice.customer;
  const fmt  = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  // Header
  doc.fillColor("#1a1a2e").fontSize(28).font("Helvetica-Bold").text("INVOICE", 50, 50);
  doc.fontSize(11).font("Helvetica").fillColor("#4f8ef7").text(invoice.invoiceNumber, 50, 88);

  // Business info (right)
  doc.fillColor("#1a1a2e").fontSize(14).font("Helvetica-Bold").text(biz.name || "Your Business", 300, 50, { align: "right", width: 245 });
  doc.fontSize(9).font("Helvetica").fillColor("#64748b")
    .text(`GSTIN: ${biz.gstin || ""}`, 300, 70, { align: "right", width: 245 })
    .text(biz.address || "", 300, 82, { align: "right", width: 245 });

  // Line
  doc.moveTo(50, 110).lineTo(545, 110).stroke("#e2e8f0");

  // Dates
  doc.fillColor("#1a1a2e").fontSize(9).font("Helvetica-Bold");
  doc.text("Issue Date:", 50, 125).text("Due Date:", 200, 125).text("Status:", 350, 125);
  doc.font("Helvetica").fillColor("#333");
  doc.text(new Date(invoice.issueDate).toLocaleDateString("en-IN"), 50, 138);
  doc.text(new Date(invoice.dueDate).toLocaleDateString("en-IN"), 200, 138);
  doc.text(invoice.status.toUpperCase(), 350, 138);

  // Bill To
  doc.moveTo(50, 160).lineTo(545, 160).stroke("#e2e8f0");
  doc.fillColor("#64748b").fontSize(9).font("Helvetica-Bold").text("BILL TO", 50, 170);
  doc.fillColor("#1a1a2e").fontSize(11).font("Helvetica-Bold").text(cust.name, 50, 183);
  doc.fontSize(9).font("Helvetica").fillColor("#64748b")
    .text(`GSTIN: ${cust.gstin || "N/A"}`, 50, 197)
    .text(cust.address || "", 50, 209)
    .text(cust.email, 50, 221);

  // Table header
  const tableTop = 250;
  doc.rect(50, tableTop, 495, 24).fill("#1a1a2e");
  doc.fillColor("#fff").fontSize(9).font("Helvetica-Bold");
  doc.text("DESCRIPTION", 60, tableTop + 8);
  doc.text("HSN/SAC", 270, tableTop + 8);
  doc.text("QTY", 340, tableTop + 8, { width: 40, align: "right" });
  doc.text("RATE", 390, tableTop + 8, { width: 60, align: "right" });
  doc.text("AMOUNT", 460, tableTop + 8, { width: 80, align: "right" });

  // Table rows
  let y = tableTop + 30;
  invoice.items.forEach((item, i) => {
    if (i % 2 === 0) doc.rect(50, y - 5, 495, 22).fill("#f8fafc");
    doc.fillColor("#1a1a2e").font("Helvetica").fontSize(9);
    doc.text(item.description, 60, y, { width: 200 });
    doc.text(item.hsn || "", 270, y);
    doc.text(item.quantity, 340, y, { width: 40, align: "right" });
    doc.text(fmt(item.rate), 390, y, { width: 60, align: "right" });
    doc.text(fmt(item.amount), 460, y, { width: 80, align: "right" });
    y += 22;
  });

  // Totals
  y += 10;
  doc.moveTo(50, y).lineTo(545, y).stroke("#e2e8f0");
  y += 10;
  const totals = [
    ["Subtotal", fmt(invoice.subtotal)],
    ...(invoice.discountTotal ? [["Discount", `-${fmt(invoice.discountTotal)}`]] : []),
    ...(invoice.cgst ? [["CGST (9%)", fmt(invoice.cgst)], ["SGST (9%)", fmt(invoice.sgst)]] : []),
    ...(invoice.igst ? [["IGST (18%)", fmt(invoice.igst)]] : []),
  ];
  totals.forEach(([label, val]) => {
    doc.fillColor("#64748b").fontSize(9).font("Helvetica").text(label, 380, y);
    doc.fillColor("#1a1a2e").text(val, 460, y, { width: 80, align: "right" });
    y += 16;
  });
  y += 4;
  doc.rect(380, y - 4, 165, 26).fill("#1a1a2e");
  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(11);
  doc.text("TOTAL", 390, y + 4);
  doc.fillColor("#4f8ef7").text(fmt(invoice.total), 460, y + 4, { width: 80, align: "right" });

  // Notes
  if (invoice.notes) {
    y += 50;
    doc.fillColor("#64748b").fontSize(9).font("Helvetica-Bold").text("NOTES", 50, y);
    doc.font("Helvetica").fillColor("#333").text(invoice.notes, 50, y + 14, { width: 495 });
  }

  // Footer
  doc.fillColor("#94a3b8").fontSize(8).font("Helvetica")
    .text("This is a computer-generated invoice.", 50, 770, { align: "center", width: 495 });

  doc.end();
});

module.exports = { getInvoices, getInvoice, createInvoice, updateInvoice, sendInvoice, recordPayment, deleteInvoice, generatePDF };
