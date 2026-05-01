// routes/subscription.routes.js
const express = require("express");
const router  = express.Router();
const { getPlans, createPlan, getSubscriptions, createSubscription, cancelSubscription } = require("../controllers/misc.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);
router.route("/plans").get(getPlans).post(createPlan);
router.route("/").get(getSubscriptions).post(createSubscription);
router.put("/:id/cancel", cancelSubscription);

module.exports = router;
