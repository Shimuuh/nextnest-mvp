const Scheme = require("../models/Scheme");
const SchemeApplication = require("../models/SchemeApplication");

exports.createScheme = async (req, res) => {
    try {
        const scheme = await Scheme.create(req.body);
        res.status(201).json({ success: true, data: scheme });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSchemes = async (req, res) => {
    try {
        const schemes = await Scheme.find();
        res.status(200).json({ success: true, count: schemes.length, data: schemes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Scheme Applications
exports.createApplication = async (req, res) => {
    try {
        const application = await SchemeApplication.create(req.body);
        res.status(201).json({ success: true, data: application });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getApplications = async (req, res) => {
    try {
        const applications = await SchemeApplication.find().populate('child').populate('scheme');
        res.status(200).json({ success: true, count: applications.length, data: applications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
