const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    amount: {
      type: Number,
      required: true
    },
    message: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);