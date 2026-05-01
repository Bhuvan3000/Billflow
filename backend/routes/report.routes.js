const express = require("express");
const router  = express.Router();
const { getReports } = require("../controllers/misc.controller");
const { protect }    = require("../middleware/auth.middleware");

router.use(protect);
router.get("/", getReports);

module.exports = router;
