const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");

// Only logged-in users
router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Profile accessed",
    user: req.user
  });
});

// Only admin can access
router.get("/admin", protect, authorize("admin"), (req, res) => {
  res.json({
    message: "Admin access granted"
  });
});

module.exports = router;