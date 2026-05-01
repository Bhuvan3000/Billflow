const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name:        { type: String, required: true },
    description: { type: String },
    price:       { type: Number, required: true },
    interval:    { type: String, enum: ["weekly", "monthly", "quarterly", "yearly"], default: "monthly" },
    intervalCount: { type: Number, default: 1 },
    currency:    { type: String, default: "INR" },
    features:    [{ type: String }],
    taxRate:     { type: Number, default: 18 },
    isActive:    { type: Boolean, default: true },
    color:       { type: String, default: "#4f8ef7" },
  },
  { timestamps: true }
);

const subscriptionSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customer:   { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    plan:       { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },

    status: {
      type: String,
      enum: ["active", "paused", "cancelled", "expired", "trial"],
      default: "active",
    },

    startDate:   { type: Date, required: true, default: Date.now },
    endDate:     { type: Date },
    nextBillingDate: { type: Date },
    trialEndDate:    { type: Date },

    // Auto-billing
    autoRenew:   { type: Boolean, default: true },
    reminderSent: { type: Boolean, default: false },

    // Gateway subscription IDs
    razorpaySubId: { type: String },
    stripeSubId:   { type: String },

    notes: { type: String },
  },
  { timestamps: true }
);

subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
const Subscription     = mongoose.model("Subscription", subscriptionSchema);

module.exports = { SubscriptionPlan, Subscription };
