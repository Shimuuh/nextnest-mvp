const Opportunity = require("../models/Opportunity");

exports.createOpportunity = async (req, res) => {
    try {
        const opportunity = await Opportunity.create(req.body);
        res.status(201).json({ success: true, data: opportunity });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getOpportunities = async (req, res) => {
    try {
        const opportunities = await Opportunity.find();
        res.status(200).json({ success: true, count: opportunities.length, data: opportunities });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getOpportunity = async (req, res) => {
    try {
        const opportunity = await Opportunity.findById(req.params.id);
        if (!opportunity) return res.status(404).json({ success: false, message: "Not found" });
        res.status(200).json({ success: true, data: opportunity });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateOpportunity = async (req, res) => {
    try {
        const opportunity = await Opportunity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!opportunity) return res.status(404).json({ success: false, message: "Not found" });
        res.status(200).json({ success: true, data: opportunity });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
