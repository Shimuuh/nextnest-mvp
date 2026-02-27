const express = require("express");
const router = express.Router();
const { predictRisk, matchSchemes, processDocument, matchOpportunity } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

// All AI functionalities require protection
router.use(protect);

router.get("/predict-risk/:childId", predictRisk);
router.get("/match-schemes/:childId", matchSchemes);
router.post("/process-document", processDocument);
router.get("/match-opportunity/:childId", matchOpportunity);

module.exports = router;