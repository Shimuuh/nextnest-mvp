const express = require("express");
const router = express.Router();
const { createMedicalCase, getMedicalCases, getMedicalCase, updateMedicalCase } = require("../controllers/medicalController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Publicly viewable routes
router.route("/").get(getMedicalCases);
router.route("/:id").get(getMedicalCase);

// Protected routes
router.use(protect);
router.route("/")
    .post(authorize("orphanage", "admin"), createMedicalCase);

router.route("/:id")
    .put(authorize("orphanage", "admin"), updateMedicalCase);

module.exports = router;
