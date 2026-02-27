const aiAgents = require("../services/aiAgents");

exports.predictRisk = async (req, res) => {
    try {
        const analysis = await aiAgents.predictRisk(req.params.childId);
        res.status(200).json({ success: true, analysis });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.matchSchemes = async (req, res) => {
    try {
        const matches = await aiAgents.matchSchemes(req.params.childId);
        res.status(200).json({ success: true, matches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.processDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No document file uploaded" });
        }

        // Construct a full URL to the static file so the AI Engine can reference it
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        const result = await aiAgents.processDocument(fileUrl, req.body.docType);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.matchOpportunity = async (req, res) => {
    try {
        const recommendations = await aiAgents.matchOpportunity(req.params.childId);
        res.status(200).json({ success: true, recommendations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.chat = async (req, res) => {
    try {
        // req.user corresponds to the JWT parsed user if protect middleware used
        const userRole = req.user ? req.user.role : 'Guest';
        const result = await aiAgents.chat(req.body.message, userRole);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
