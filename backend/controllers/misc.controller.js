const asyncHandler = require("express-async-handler");
const Invoice  = require("../models/Invoice.model");
const Customer = require("../models/Customer.model");
const Payment  = require("../models/Payment.model");
const { Subscription, SubscriptionPlan } = require("../models/Subscription.model");
const mongoose = require("mongoose");

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

const getDashboard = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear  = new Date(now.getFullYear(), 0, 1);

  await Invoice.updateMany(
    { user: uid, status: "sent", dueDate: { $lt: now } },
    { status: "overdue" }
  );

  const [
    invoiceStats, monthlyRevenue, recentInvoices,
    customerCount, paymentStats, overdueInvoices
  ] = await Promise.all([
    Invoice.aggregate([
      { $match: { user: uid } },
      { $group: {
          _id: "$status",
          count: { $sum: 1 },
          total: { $sum: "$total" },
          outstanding: { $sum: "$balanceDue" },
      }},
    ]),
    Invoice.aggregate([
      { $match: { user: uid, issueDate: { $gte: startOfYear }, status: { $in: ["paid", "partial"] } } },
      { $group: {
          _id: { month: { $month: "$issueDate" }, year: { $year: "$issueDate" } },
          revenue: { $sum: "$paidAmount" },
          count:   { $sum: 1 },
      }},
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Invoice.find({ user: uid }).populate("customer", "name").sort({ createdAt: -1 }).limit(5),
    Customer.countDocuments({ user: uid, isActive: true }),
    Payment.aggregate([
      { $match: { user: uid, status: "success", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Invoice.find({ user: uid, status: "overdue" })
      .populate("customer", "name email")
      .sort({ dueDate: 1 })
      .limit(5),
  ]);

  const statsMap = Object.fromEntries(invoiceStats.map(s => [s._id, s]));
  const totalRevenue   = (statsMap.paid?.total || 0) + (statsMap.partial?.total || 0);
  const totalOutstanding = invoiceStats.reduce((a, s) => a + (s.outstanding || 0), 0);

  res.json({
    success: true,
    data: {
      metrics: {
        totalRevenue,
        totalOutstanding,
        thisMonthPayments: paymentStats[0]?.total || 0,
        customerCount,
        overdueCount: statsMap.overdue?.count || 0,
        paidCount: statsMap.paid?.count || 0,
      },
      invoiceStatusBreakdown: invoiceStats,
      monthlyRevenue,
      recentInvoices,
      overdueInvoices,
    },
  });
});

// ── REPORTS ───────────────────────────────────────────────────────────────────

const getReports = asyncHandler(async (req, res) => {
  const { type = "revenue", startDate, endDate, year = new Date().getFullYear() } = req.query;
  const uid = req.user._id;

  const dateMatch = {};
  if (startDate) dateMatch.$gte = new Date(startDate);
  if (endDate)   dateMatch.$lte = new Date(endDate);

  if (type === "gst") {
    const invoices = await Invoice.find({
      user: uid,
      status: { $ne: "cancelled" },
      ...(Object.keys(dateMatch).length && { issueDate: dateMatch }),
    }).populate("customer", "name gstin state");

    const totals = invoices.reduce((acc, inv) => ({
      subtotal:     acc.subtotal     + inv.subtotal,
      taxableAmount:acc.taxableAmount+ inv.taxableAmount,
      cgst:         acc.cgst         + inv.cgst,
      sgst:         acc.sgst         + inv.sgst,
      igst:         acc.igst         + inv.igst,
      totalTax:     acc.totalTax     + inv.totalTax,
      total:        acc.total        + inv.total,
    }), { subtotal:0, taxableAmount:0, cgst:0, sgst:0, igst:0, totalTax:0, total:0 });

    return res.json({ success: true, data: { invoices, totals } });
  }

  if (type === "aging") {
    const unpaid = await Invoice.find({
      user: uid,
      status: { $in: ["sent", "viewed", "partial", "overdue"] },
    }).populate("customer", "name email phone");

    const now = Date.now();
    const buckets = { "0-30": [], "31-60": [], "61-90": [], "90+": [] };
    unpaid.forEach(inv => {
      const days = Math.floor((now - new Date(inv.dueDate)) / 86400000);
      if (days <= 30)      buckets["0-30"].push(inv);
      else if (days <= 60) buckets["31-60"].push(inv);
      else if (days <= 90) buckets["61-90"].push(inv);
      else                 buckets["90+"].push(inv);
    });
    return res.json({ success: true, data: buckets });
  }

  // Default: revenue
  const invoices = await Invoice.aggregate([
    { $match: { user: uid, status: { $in: ["paid", "partial"] }, ...(Object.keys(dateMatch).length && { issueDate: dateMatch }) } },
    { $group: {
        _id: { month: { $month: "$issueDate" }, year: { $year: "$issueDate" } },
        revenue: { $sum: "$paidAmount" },
        invoiceCount: { $sum: 1 },
        totalTax: { $sum: "$totalTax" },
    }},
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  res.json({ success: true, data: invoices });
});

// ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────────

const getPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find({ user: req.user._id, isActive: true });
  res.json({ success: true, data: plans });
});

const createPlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, data: plan });
});

const getSubscriptions = asyncHandler(async (req, res) => {
  const subs = await Subscription.find({ user: req.user._id })
    .populate("customer", "name email")
    .populate("plan", "name price interval color")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: subs });
});

const createSubscription = asyncHandler(async (req, res) => {
  const { customer, plan, startDate, autoRenew } = req.body;
  const planDoc = await SubscriptionPlan.findById(plan);
  if (!planDoc) { res.status(404); throw new Error("Plan not found"); }

  const start = startDate ? new Date(startDate) : new Date();
  const nextBillingDate = new Date(start);
  if (planDoc.interval === "monthly")   nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  if (planDoc.interval === "yearly")    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  if (planDoc.interval === "quarterly") nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);

  const sub = await Subscription.create({
    user: req.user._id, customer, plan, startDate: start, nextBillingDate, autoRenew: autoRenew !== false,
  });
  await sub.populate(["customer", "plan"]);
  res.status(201).json({ success: true, data: sub });
});

const cancelSubscription = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { status: "cancelled", autoRenew: false },
    { new: true }
  );
  if (!sub) { res.status(404); throw new Error("Subscription not found"); }
  res.json({ success: true, data: sub });
});

module.exports = {
  getDashboard, getReports,
  getPlans, createPlan, getSubscriptions, createSubscription, cancelSubscription,
};
