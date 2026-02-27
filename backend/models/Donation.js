const donationSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  message: String,
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  orphanage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Donation", donationSchema);