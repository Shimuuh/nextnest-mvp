const Child = require("../models/Child");

// CREATE
exports.createChild = async (req, res) => {
    try {
        const child = await Child.create(req.body);
        res.status(201).json({ success: true, data: child });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// READ ALL
exports.getChildren = async (req, res) => {
    try {
        const children = await Child.find().populate("orphanage", "name email");
        res.status(200).json({ success: true, data: children });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// READ ONE
exports.getChild = async (req, res) => {
    try {
        const child = await Child.findById(req.params.id)
            .populate("orphanage", "name email")
            .populate("achievements");
        if (!child) return res.status(404).json({ success: false, message: "Child not found" });
        res.status(200).json({ success: true, data: child });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE
exports.updateChild = async (req, res) => {
    try {
        const child = await Child.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!child) return res.status(404).json({ success: false, message: "Child not found" });
        res.status(200).json({ success: true, data: child });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE
exports.deleteChild = async (req, res) => {
    try {
        const child = await Child.findByIdAndDelete(req.params.id);
        if (!child) return res.status(404).json({ success: false, message: "Child not found" });
        res.status(200).json({ success: true, message: "Child deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
