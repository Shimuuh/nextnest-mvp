const express = require("express");
const router = express.Router();
const { createScheme, getSchemes, createApplication, getApplications } = require("../controllers/schemeController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Schemes
router.route("/")
    .get(getSchemes)
    .post(protect, authorize("admin"), createScheme);

// Scheme Applications
router.route("/applications")
    .get(protect, authorize("admin", "orphanage"), getApplications)
    .post(protect, authorize("admin", "orphanage"), createApplication);

module.exports = router;
