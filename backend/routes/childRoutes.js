const express = require("express");
const router = express.Router();
const Child = require("../models/Child");
const { protect, authorize } = require("../middleware/authMiddleware");

// Create child (only orphanage)
router.post("/", protect, authorize("orphanage"), async (req, res) => {
  try {
    const child = await Child.create({
      ...req.body,
      orphanage: req.user.id
    });

    res.status(201).json(child);
  } catch (error) {
    res.status(500).json({ message: "Failed to create child" });
  }
});

// Get all children
router.get("/", protect, async (req, res) => {
  const children = await Child.find().populate("orphanage", "name email");
  res.json(children);
});

module.exports = router;