const mongoose = require("mongoose");

const childSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    age: Number,
    education: String,
    skills: [String],
    orphanage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    // Monitoring & Predictive Risk Fields
    attendanceStats: {
      percentage: { type: Number, default: 100 },
      lastUpdated: Date
    },
    academicRecord: {
      currentGrade: String,
      performanceScore: Number, // 0-100
      notes: String
    },
    behavioralNotes: [{
      date: { type: Date, default: Date.now },
      note: String,
      severity: { type: String, enum: ["low", "medium", "high"], default: "low" }
    }],
    // Transition Planning
    transitionTimeline: {
      expectedExitDate: Date,
      readinessScore: Number, // 0-100
      recommendedPathways: [String]
    },
    // Associated records
    achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: "Achievement" }],
    documents: [{
      type: { type: String, enum: ["aadhaar", "birth_certificate", "education", "other"] },
      documentUrl: String,
      status: { type: String, enum: ["missing", "pending", "verified"], default: "missing" }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Child", childSchema);