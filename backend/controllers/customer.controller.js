const asyncHandler = require("express-async-handler");
const Customer = require("../models/Customer.model");
const Invoice  = require("../models/Invoice.model");

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
  const { search, isActive, page = 1, limit = 20 } = req.query;
  const query = { user: req.user._id };
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (search) query.$or = [
    { name: { $regex: search, $options: "i" } },
    { email: { $regex: search, $options: "i" } },
    { gstin: { $regex: search, $options: "i" } },
  ];

  const skip = (page - 1) * limit;
  const [customers, total] = await Promise.all([
    Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Customer.countDocuments(query),
  ]);

  // Attach billing stats
  const stats = await Invoice.aggregate([
    { $match: { user: req.user._id } },
    { $group: {
        _id: "$customer",
        totalBilled: { $sum: "$total" },
        outstanding: { $sum: "$balanceDue" },
        invoiceCount: { $sum: 1 },
    }},
  ]);
  const statsMap = Object.fromEntries(stats.map(s => [s._id.toString(), s]));

  const enriched = customers.map(c => ({
    ...c.toObject(),
    totalBilled:  statsMap[c._id.toString()]?.totalBilled  || 0,
    outstanding:  statsMap[c._id.toString()]?.outstanding  || 0,
    invoiceCount: statsMap[c._id.toString()]?.invoiceCount || 0,
  }));

  res.json({ success: true, data: enriched, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, user: req.user._id });
  if (!customer) { res.status(404); throw new Error("Customer not found"); }

  const invoices = await Invoice.find({ customer: customer._id, user: req.user._id })
    .sort({ issueDate: -1 }).limit(20);
  const stats = await Invoice.aggregate([
    { $match: { customer: customer._id, user: req.user._id } },
    { $group: { _id: null, totalBilled: { $sum: "$total" }, outstanding: { $sum: "$balanceDue" }, invoiceCount: { $sum: 1 }, paidCount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } } } },
  ]);

  res.json({ success: true, data: { ...customer.toObject(), ...stats[0] }, invoices });
});

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
const createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, data: customer });
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!customer) { res.status(404); throw new Error("Customer not found"); }
  res.json({ success: true, data: customer });
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = asyncHandler(async (req, res) => {
  const hasInvoices = await Invoice.exists({ customer: req.params.id, user: req.user._id });
  if (hasInvoices) {
    // Soft delete
    await Customer.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isActive: false });
    return res.json({ success: true, message: "Customer deactivated (has linked invoices)" });
  }
  await Customer.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true, message: "Customer deleted" });
});

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer };
