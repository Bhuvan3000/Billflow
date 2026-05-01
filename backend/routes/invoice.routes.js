const express = require("express");
const router  = express.Router();
const { getInvoices, getInvoice, createInvoice, updateInvoice, sendInvoice, recordPayment, deleteInvoice, generatePDF } = require("../controllers/invoice.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);
router.route("/").get(getInvoices).post(createInvoice);
router.route("/:id").get(getInvoice).put(updateInvoice).delete(deleteInvoice);
router.post("/:id/send",    sendInvoice);
router.post("/:id/payment", recordPayment);
router.get( "/:id/pdf",     generatePDF);

module.exports = router;
