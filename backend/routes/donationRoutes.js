const express = require("express");
const router = express.Router();

const {
  createDonation,
  getMyDonations,
  getOrphanageDonations
} = require("../controllers/donationController");

const { protect, authorize } = require("../middleware/authMiddleware");
// Create donation (only donor)
router.post("/", protect, authorize("donor"), async (req, res) => {
  try {
    const donation = await Donation.create({
      donor: req.user.id,
      amount: req.body.amount,
      message: req.body.message
    });

    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ message: "Donation failed" });
  }
});

// Get all donations (admin only)
router.get("/", protect, authorize("admin"), async (req, res) => {
  const donations = await Donation.find().populate("donor", "name email");
  res.json(donations);
});

module.exports = router;