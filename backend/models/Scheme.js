const mongoose = require("mongoose");

const schemeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        department: String,
        description: String,
        eligibilityRules: {
            minAge: Number,
            maxAge: Number,
            requiredDocuments: [String],
            targetGroup: [String] // e.g., 'orphan', 'student'
        },
        estimatedBenefit: {
            amount: Number,
            type: { type: String, enum: ["monetary", "material", "service"] }
        },
        applicationLink: String
    },
    { timestamps: true }
);

module.exports = mongoose.model("Scheme", schemeSchema);
