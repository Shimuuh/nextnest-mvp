const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Protected AI recommendation route
router.post("/recommend", protect, (req, res) => {
  const { profile } = req.body;

  // Fake AI logic
  let recommendation = "General Support Program";

  if (profile?.education === "12th") {
    recommendation = "Scholarship Program A";
  } else if (profile?.skill === "coding") {
    recommendation = "Tech Internship Opportunity";
  }

  res.json({
    message: "AI recommendation generated",
    recommendation
  });
});

module.exports = router;