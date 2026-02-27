const mongoose = require("mongoose");

const schemeApplicationSchema = new mongoose.Schema(
    {
        child: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Child",
            required: true
        },
        scheme: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scheme",
            required: true
        },
        status: {
            type: String,
            enum: ["identified", "in_progress", "submitted", "approved", "rejected"],
            default: "identified"
        },
        applicationDate: Date,
        documentsSubmitted: [String],
        notes: String
    },
    { timestamps: true }
);

module.exports = mongoose.model("SchemeApplication", schemeApplicationSchema);
