const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name:        { type: String, required: [true, "Customer name is required"], trim: true },
    email:       { type: String, required: [true, "Email is required"], lowercase: true, trim: true },
    phone:       { type: String, trim: true },
    gstin:       { type: String, trim: true, uppercase: true },
    pan:         { type: String, trim: true, uppercase: true },
    state:       { type: String },
    stateCode:   { type: String },
    address:     { type: String },
    city:        { type: String },
    pincode:     { type: String },
    country:     { type: String, default: "India" },
    billingAddress: { type: String },
    contactPerson: { type: String },
    website:     { type: String },
    notes:       { type: String },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// Virtual: total billed (computed from Invoice collection)
customerSchema.virtual("totalBilled", {
  ref: "Invoice",
  localField: "_id",
  foreignField: "customer",
  // Aggregated in controller for performance
});

module.exports = mongoose.model("Customer", customerSchema);
