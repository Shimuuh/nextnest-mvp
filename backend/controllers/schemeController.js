const Scheme = require("../models/Scheme");
const SchemeApplication = require("../models/SchemeApplication");
const Child = require("../models/Child");

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

exports.getSchemeMatches = async (req, res) => {
    try {
        const scheme = await Scheme.findById(req.params.id);
        if (!scheme) {
            return res.status(404).json({ success: false, message: "Scheme not found" });
        }

        const eligibility = scheme.eligibilityRules || {};
        const query = {};

        if (eligibility.minAge !== undefined || eligibility.maxAge !== undefined) {
            query.age = {};
            if (eligibility.minAge !== undefined) query.age.$gte = eligibility.minAge;
            if (eligibility.maxAge !== undefined) query.age.$lte = eligibility.maxAge;
        }

        const children = await Child.find(query).select('name age education orphanage skills');
        res.status(200).json({ success: true, count: children.length, schemeName: scheme.name, data: children });
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
