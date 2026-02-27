const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "donor", "orphanage", "careleaver"],
      required: true
    },
    // Specific fields for different roles
    orphanageDetails: {
      registrationNumber: String,
      capacity: Number,
      currentChildrenCount: Number,
      address: String,
      contactPerson: String
    },
    donorPreferences: {
      preferredCauses: [String], // e.g., 'education', 'medical', 'general'
      isAnonymous: { type: Boolean, default: false }
    },
    careleaverDetails: {
      dateOfExit: Date,
      currentStatus: String, // e.g., 'studying', 'working', 'unemployed'
      assignedMentor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);