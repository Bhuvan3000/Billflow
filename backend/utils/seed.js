const mongoose = require("mongoose");
const dotenv   = require("dotenv");
dotenv.config();

const User     = require("../models/User.model");
const Customer = require("../models/Customer.model");
const Invoice  = require("../models/Invoice.model");
const Payment  = require("../models/Payment.model");
const { SubscriptionPlan, Subscription } = require("../models/Subscription.model");

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // Clear existing
  await Promise.all([
    User.deleteMany({}), Customer.deleteMany({}), Invoice.deleteMany({}),
    Payment.deleteMany({}), SubscriptionPlan.deleteMany({}), Subscription.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  // Create demo user
  const user = await User.create({
    name: "Admin User",
    email: "admin@billflow.in",
    password: "Admin@123",
    role: "admin",
    business: {
      name: "BillFlow Technologies",
      gstin: "36AABCU9603R1ZM",
      pan: "AABCU9603R",
      address: "HITEC City, Hyderabad 500081",
      state: "Telangana",
      phone: "+91 40 6789 0123",
    },
    invoiceSettings: { prefix: "INV", startNumber: 1, dueDays: 30, defaultGst: 18, currency: "INR" },
  });
  console.log("✅ User created — admin@billflow.in / Admin@123");

  // Customers
  const customers = await Customer.insertMany([
    { user: user._id, name: "Arjun Sharma Consulting", email: "arjun@techsol.in", phone: "+91 98765 43210", gstin: "27AAPCS1000R1Z9", state: "Maharashtra", stateCode: "27", address: "Bandra Kurla Complex, Mumbai 400051", city: "Mumbai" },
    { user: user._id, name: "Priya Innovations Pvt Ltd", email: "billing@priyainno.com", phone: "+91 80001 22334", gstin: "29AAICP9999N1Z7", state: "Karnataka", stateCode: "29", address: "Indiranagar, Bengaluru 560038", city: "Bengaluru" },
    { user: user._id, name: "RajTech Solutions", email: "accounts@rajtech.io", phone: "+91 44001 55667", gstin: "33AADCR1234B1Z5", state: "Tamil Nadu", stateCode: "33", address: "Tidel Park, Chennai 600113", city: "Chennai" },
    { user: user._id, name: "Meera Digital Agency", email: "finance@meera.agency", phone: "+91 22001 77889", gstin: "07AAFCM5678C1Z3", state: "Delhi", stateCode: "07", address: "Connaught Place, New Delhi 110001", city: "New Delhi" },
    { user: user._id, name: "Suresh Enterprises", email: "suresh@enterprises.co.in", phone: "+91 79001 33445", gstin: "24AAPSE4321F1Z2", state: "Gujarat", stateCode: "24", address: "CG Road, Ahmedabad 380006", city: "Ahmedabad" },
  ]);
  console.log("✅ Customers created:", customers.length);

  // Helper
  const d = (daysAgo) => new Date(Date.now() - daysAgo * 86400000);
  const makeInvoice = (uid, cust, num, gstType, issueDaysAgo, dueDaysAgo, status, items, paidAmt = 0) => {
    let subtotal = 0, taxableAmount = 0, totalTax = 0;
    const processed = items.map(it => {
      const amt = it.qty * it.rate;
      subtotal += amt;
      taxableAmount += amt;
      totalTax += amt * 0.18;
      return { description: it.desc, hsn: it.hsn || "998313", quantity: it.qty, rate: it.rate, discount: 0, taxRate: 18, amount: amt };
    });
    const isIntra = gstType === "intra";
    const total = taxableAmount + totalTax;
    const paid  = paidAmt;
    return {
      user: uid, customer: cust._id, invoiceNumber: num, gstType,
      issueDate: d(issueDaysAgo), dueDate: d(dueDaysAgo), status,
      items: processed,
      subtotal, discountTotal: 0, taxableAmount,
      cgst: isIntra ? totalTax / 2 : 0,
      sgst: isIntra ? totalTax / 2 : 0,
      igst: isIntra ? 0 : totalTax,
      totalTax, total,
      paidAmount: paid, balanceDue: total - paid,
      paidAt: status === "paid" ? d(issueDaysAgo - 15) : undefined,
    };
  };

  const invoices = await Invoice.insertMany([
    makeInvoice(user._id, customers[0], "INV-2025-0001", "intra", 90, 60, "paid",
      [{desc:"UI/UX Design Services",qty:1,rate:45000},{desc:"Logo & Branding",qty:1,rate:15000}], 70800),
    makeInvoice(user._id, customers[1], "INV-2025-0002", "inter", 75, 45, "paid",
      [{desc:"Software Development – Phase 1",qty:1,rate:180000},{desc:"Server Setup",qty:3,rate:8000}], 240720),
    makeInvoice(user._id, customers[2], "INV-2025-0003", "inter", 60, 30, "overdue",
      [{desc:"Cloud Infrastructure Management",qty:1,rate:125000},{desc:"Technical Support",qty:24,rate:1000}]),
    makeInvoice(user._id, customers[3], "INV-2025-0004", "intra", 45, 15, "partial",
      [{desc:"Social Media Management",qty:3,rate:15000},{desc:"Content Creation",qty:1,rate:12000}], 18400),
    makeInvoice(user._id, customers[0], "INV-2025-0005", "intra", 20, 10, "sent",
      [{desc:"Website Redesign",qty:1,rate:85000},{desc:"SEO Optimization",qty:6,rate:5000}]),
    makeInvoice(user._id, customers[4], "INV-2025-0006", "inter", 10, 20, "draft",
      [{desc:"ERP Consulting",qty:40,rate:2500},{desc:"Training Sessions",qty:5,rate:8000}]),
    makeInvoice(user._id, customers[1], "INV-2025-0007", "inter", 5, 25, "sent",
      [{desc:"Software Development – Phase 2",qty:1,rate:220000}]),
  ]);
  console.log("✅ Invoices created:", invoices.length);

  // Payments
  const payments = await Payment.insertMany([
    { user: user._id, invoice: invoices[0]._id, customer: customers[0]._id, amount: 70800,  method: "razorpay",  status: "success", gatewayPaymentId: "pay_RZP001", receiptNumber: "RCP-001", paidAt: d(75), createdAt: d(75) },
    { user: user._id, invoice: invoices[1]._id, customer: customers[1]._id, amount: 240720, method: "neft",      status: "success", gatewayPaymentId: "NEFT20250210", receiptNumber: "RCP-002", paidAt: d(60), createdAt: d(60) },
    { user: user._id, invoice: invoices[3]._id, customer: customers[3]._id, amount: 18400,  method: "upi",       status: "success", gatewayPaymentId: "UPI_GGO_001",  receiptNumber: "RCP-003", paidAt: d(30), createdAt: d(30) },
  ]);
  console.log("✅ Payments created:", payments.length);

  // Subscription plans
  const plans = await SubscriptionPlan.insertMany([
    { user: user._id, name: "Starter",    price: 4999,  interval: "monthly", features: ["5 Users","10GB Storage","Email Support"], color: "#6366f1" },
    { user: user._id, name: "Growth",     price: 14999, interval: "monthly", features: ["25 Users","50GB Storage","Priority Support","API Access"], color: "#0ea5e9" },
    { user: user._id, name: "Enterprise", price: 49999, interval: "monthly", features: ["Unlimited Users","500GB Storage","24/7 Support","Custom Integrations"], color: "#10b981" },
  ]);

  await Subscription.insertMany([
    { user: user._id, customer: customers[0]._id, plan: plans[1]._id, status: "active", startDate: d(60), nextBillingDate: d(-30), autoRenew: true },
    { user: user._id, customer: customers[1]._id, plan: plans[2]._id, status: "active", startDate: d(90), nextBillingDate: d(-25), autoRenew: true },
    { user: user._id, customer: customers[2]._id, plan: plans[0]._id, status: "active", startDate: d(30), nextBillingDate: d(-40), autoRenew: false },
    { user: user._id, customer: customers[3]._id, plan: plans[0]._id, status: "paused", startDate: d(45), nextBillingDate: d(-15), autoRenew: false },
  ]);
  console.log("✅ Subscriptions created");

  console.log("\n🎉 Seed complete! Login: admin@billflow.in / Admin@123");
  process.exit(0);
};

seed().catch(err => { console.error("Seed error:", err); process.exit(1); });
