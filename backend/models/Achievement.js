const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
    {
        child: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Child",
            required: true
        },
        title: {
            type: String,
            required: true
        },
        category: {
            type: String,
            enum: ["academic", "sports", "arts", "music", "other"],
            required: true
        },
        description: String,
        dateAchieved: Date,
        evidenceUrl: String // Link to image or certificate
    },
    { timestamps: true }
);

module.exports = mongoose.model("Achievement", achievementSchema);
