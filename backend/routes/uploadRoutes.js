const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer storage setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique suffix
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// POST endpoint for file upload
router.post('/', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        // Return the path so frontend can use it
        const filePath = `/uploads/${req.file.filename}`;

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            filePath: filePath,
            fileName: req.file.originalname
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, message: 'Server error during file upload', error: error.message });
    }
});

module.exports = router;
