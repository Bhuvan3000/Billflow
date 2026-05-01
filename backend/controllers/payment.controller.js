const asyncHandler = require("express-async-handler");
const Payment = require("../models/Payment.model");
const Invoice = require("../models/Invoice.model");

// Conditionally init gateways (won't crash if keys missing)
let Razorpay, stripe;
try {
  Razorpay = require("razorpay");
} catch {}


const razorpayInstance = process.env.RAZORPAY_KEY_ID
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, method, status } = req.query;
  const query = { user: req.user._id };
  if (method) query.method = method;
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate("invoice", "invoiceNumber total")
      .populate("customer", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(query),
  ]);
  res.json({ success: true, data: payments, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @desc    Create Razorpay order
// @route   POST /api/payments/razorpay/create-order
// @access  Private
const createRazorpayOrder = asyncHandler(async (req, res) => {
  if (!razorpayInstance) { res.status(503); throw new Error("Razorpay not configured"); }
  const { invoiceId } = req.body;
  const invoice = await Invoice.findOne({ _id: invoiceId, user: req.user._id });
  if (!invoice) { res.status(404); throw new Error("Invoice not found"); }

  const order = await razorpayInstance.orders.create({
    amount: Math.round(invoice.balanceDue * 100), // paise
    currency: "INR",
    receipt: invoice.invoiceNumber,
    notes: { invoiceId: invoice._id.toString(), userId: req.user._id.toString() },
  });

  res.json({ success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID } });
});

// @desc    Verify Razorpay payment
// @route   POST /api/payments/razorpay/verify
// @access  Private
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const crypto = require("crypto");
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId, amount } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSig = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(sign).digest("hex");

  if (expectedSig !== razorpay_signature) {
    res.status(400);
    throw new Error("Payment verification failed — invalid signature");
  }

  const invoice = await Invoice.findById(invoiceId);
  const paidAmt = amount / 100;
  invoice.paidAmount += paidAmt;
  invoice.balanceDue = invoice.total - invoice.paidAmount;
  invoice.status = invoice.balanceDue <= 0 ? "paid" : "partial";
  if (invoice.status === "paid") invoice.paidAt = new Date();
  await invoice.save();

  await Payment.create({
    user: req.user._id,
    invoice: invoice._id,
    customer: invoice.customer,
    amount: paidAmt,
    method: "razorpay",
    status: "success",
    gatewayPaymentId: razorpay_payment_id,
    gatewayOrderId: razorpay_order_id,
    gatewaySignature: razorpay_signature,
    paidAt: new Date(),
    receiptNumber: `RZP-${razorpay_payment_id}`,
  });

  res.json({ success: true, message: "Payment verified successfully" });
});


module.exports = { getPayments, createRazorpayOrder, verifyRazorpayPayment};
