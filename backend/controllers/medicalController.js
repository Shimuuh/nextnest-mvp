const MedicalCase = require("../models/MedicalCase");

exports.createMedicalCase = async (req, res) => {
    try {
        const medicalCase = await MedicalCase.create(req.body);
        res.status(201).json({ success: true, data: medicalCase });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMedicalCases = async (req, res) => {
    try {
        const cases = await MedicalCase.find().populate("child");
        res.status(200).json({ success: true, data: cases });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMedicalCase = async (req, res) => {
    try {
        const medicalCase = await MedicalCase.findById(req.params.id).populate("child");
        if (!medicalCase) return res.status(404).json({ success: false, message: "Not found" });
        res.status(200).json({ success: true, data: medicalCase });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateMedicalCase = async (req, res) => {
    try {
        const medicalCase = await MedicalCase.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!medicalCase) return res.status(404).json({ success: false, message: "Not found" });
        res.status(200).json({ success: true, data: medicalCase });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
