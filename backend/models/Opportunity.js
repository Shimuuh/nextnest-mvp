const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ["education", "vocational", "job", "housing", "mentor"],
            required: true
        },
        provider: {
            name: String,
            contact: String
        },
        description: String,
        requirements: [String],
        location: String,
        status: {
            type: String,
            enum: ["active", "filled", "closed"],
            default: "active"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Opportunity", opportunitySchema);
