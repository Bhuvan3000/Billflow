const express = require("express");
const router  = express.Router();
const { getPayments, createRazorpayOrder, verifyRazorpayPayment } = require("../controllers/payment.controller");
const { protect } = require("../middleware/auth.middleware");


router.use(protect);
router.get("/", getPayments);
router.post("/razorpay/create-order", createRazorpayOrder);
router.post("/razorpay/verify",       verifyRazorpayPayment);

module.exports = router;
