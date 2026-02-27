const express = require("express");
const router = express.Router();
const { createOpportunity, getOpportunities, getOpportunity, updateOpportunity } = require("../controllers/opportunityController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Both admins and system can create opportunities
router.route("/")
    .get(getOpportunities)
    .post(protect, authorize("admin"), createOpportunity);

router.route("/:id")
    .get(getOpportunity)
    .put(protect, authorize("admin"), updateOpportunity);

module.exports = router;
