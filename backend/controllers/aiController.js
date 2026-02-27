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
        const result = await aiAgents.processDocument(req.body.fileUrl, req.body.docType);
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
