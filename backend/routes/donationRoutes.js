const express = require("express");
const router = express.Router();

const {
  createDonation,
  getMyDonations
} = require("../controllers/donationController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Create donation (only donor)
router.post("/", protect, authorize("donor"), createDonation);

// Get my donations
router.get("/my", protect, authorize("donor"), getMyDonations);

module.exports = router;