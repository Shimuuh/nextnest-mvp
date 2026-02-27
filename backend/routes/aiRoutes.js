const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { predictRisk, matchSchemes, processDocument, matchOpportunity, chat } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

// Configure Multer storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Allow unauthenticated users (Donors/Guests) to use the chatbot
router.post("/chat", chat);

// All other AI functionalities require protection
router.use(protect);

router.get("/predict-risk/:childId", predictRisk);
router.get("/match-schemes/:childId", matchSchemes);
// Use multer for the process-document route
router.post("/process-document", upload.single('documentFile'), processDocument);
router.get("/match-opportunity/:childId", matchOpportunity);

module.exports = router;