const mongoose = require("mongoose");

const medicalCaseSchema = new mongoose.Schema(
    {
        child: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Child",
            required: true
        },
        diagnosis: {
            type: String,
            required: true
        },
        urgencyLevel: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium"
        },
        hospitalInfo: {
            name: String,
            address: String,
            contact: String
        },
        costBreakdown: [{
            item: String,
            estimatedCost: Number
        }],
        targetAmount: {
            type: Number,
            required: true
        },
        amountRaised: {
            type: Number,
            default: 0
        },
        verifiedDocs: [{
            docType: String,
            documentUrl: String,
            verified: { type: Boolean, default: false }
        }],
        status: {
            type: String,
            enum: ["open", "funded", "closed"],
            default: "open"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("MedicalCase", medicalCaseSchema);
