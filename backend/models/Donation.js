const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  message: String,
  fundType: {
    type: String,
    enum: ["bulk", "accessory", "individual_sponsorship", "medical", "general"],
    required: true,
    default: "general"
  },
  targetRef: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    enum: ['User', 'Child', 'MedicalCase'],
    required: false
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  orphanage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false // Optional for general platform donations
  }
}, { timestamps: true });

module.exports = mongoose.model("Donation", donationSchema);