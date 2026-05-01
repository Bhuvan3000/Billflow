const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name:      { type: String, required: [true, "Name is required"], trim: true },
    email:     { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
    password:  { type: String, required: [true, "Password is required"], minlength: 6, select: false },
    role:      { type: String, enum: ["admin", "accountant", "viewer"], default: "admin" },
    business: {
      name:    { type: String, default: "" },
      gstin:   { type: String, default: "" },
      pan:     { type: String, default: "" },
      address: { type: String, default: "" },
      state:   { type: String, default: "" },
      phone:   { type: String, default: "" },
      logo:    { type: String, default: "" },
    },
    invoiceSettings: {
      prefix:       { type: String, default: "INV" },
      startNumber:  { type: Number, default: 1 },
      dueDays:      { type: Number, default: 30 },
      defaultGst:   { type: Number, default: 18 },
      currency:     { type: String, default: "INR" },
      notes:        { type: String, default: "Thank you for your business." },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

module.exports = mongoose.model("User", userSchema);
