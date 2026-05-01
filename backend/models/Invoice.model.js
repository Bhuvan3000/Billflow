const mongoose = require("mongoose");

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsn:         { type: String, default: "" },        // HSN/SAC code for GST
  quantity:    { type: Number, required: true, min: 0 },
  rate:        { type: Number, required: true, min: 0 },
  discount:    { type: Number, default: 0 },          // Percentage
  taxRate:     { type: Number, default: 18 },         // GST %
  amount:      { type: Number },                      // qty * rate after discount
}, { _id: false });

const invoiceSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customer:    { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    invoiceNumber: { type: String, required: true },
    prefix:      { type: String, default: "INV" },

    // Dates
    issueDate:   { type: Date, required: true, default: Date.now },
    dueDate:     { type: Date, required: true },

    // Status
    status: {
      type: String,
      enum: ["draft", "sent", "viewed", "paid", "partial", "overdue", "cancelled"],
      default: "draft",
    },

    // Line items
    items: [lineItemSchema],

    // GST breakdown
    gstType:     { type: String, enum: ["intra", "inter"], default: "intra" },  // Intra = CGST+SGST, Inter = IGST
    subtotal:    { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    cgst:        { type: Number, default: 0 },
    sgst:        { type: Number, default: 0 },
    igst:        { type: Number, default: 0 },
    totalTax:    { type: Number, default: 0 },
    total:       { type: Number, default: 0 },
    roundOff:    { type: Number, default: 0 },

    // Payment tracking
    paidAmount:  { type: Number, default: 0 },
    balanceDue:  { type: Number, default: 0 },

    // Payment terms
    paymentTerms: { type: String, default: "Net 30" },
    notes:        { type: String },
    terms:        { type: String },

    // Subscription ref
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },

    // Audit
    sentAt:       { type: Date },
    viewedAt:     { type: Date },
    paidAt:       { type: Date },
  },
  { timestamps: true }
);

// Auto-calc balanceDue
invoiceSchema.pre("save", function (next) {
  this.balanceDue = this.total - this.paidAmount;
  if (this.balanceDue <= 0) this.status = "paid";
  else if (this.paidAmount > 0) this.status = "partial";
  next();
});

// Index for fast queries
invoiceSchema.index({ user: 1, status: 1 });
invoiceSchema.index({ user: 1, customer: 1 });
invoiceSchema.index({ user: 1, issueDate: -1 });
invoiceSchema.index({ user: 1, invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model("Invoice", invoiceSchema);
