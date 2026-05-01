const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    invoice:    { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true },
    customer:   { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },

    amount:     { type: Number, required: true },
    currency:   { type: String, default: "INR" },

    method: {
      type: String,
      enum: ["razorpay", "stripe", "upi", "neft", "neft_rtgs", "cheque", "cash", "paypal", "bank_transfer"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },

    // Gateway details
    gatewayPaymentId:  { type: String },   // e.g., Razorpay pay_xxx
    gatewayOrderId:    { type: String },   // e.g., Razorpay order_xxx
    gatewaySignature:  { type: String },
    receiptNumber:     { type: String },

    paidAt:    { type: Date },
    notes:     { type: String },
    refundedAt: { type: Date },
    refundAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, invoice: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
