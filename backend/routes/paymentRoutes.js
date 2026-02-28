const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment } = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Route to create a new Razorpay order
router.post("/createOrder", protect, authorize("donor"), createOrder);

// Route to verify the payment
router.post("/verifyPayment", protect, authorize("donor"), verifyPayment);

module.exports = router;
