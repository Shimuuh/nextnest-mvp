const donationSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  message: String,
  fundType: {
    type: String,
    enum: ["bulk", "accessory", "individual_sponsorship", "medical"],
    required: true,
    default: "bulk"
  },
  targetRef: {
    // Could be an Orphanage (bulk), Child (sponsorship), or MedicalCase
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['User', 'Child', 'MedicalCase'],
    default: 'User'
  },
  utilizationTracker: [{
    amountUsed: Number,
    purpose: String,
    date: { type: Date, default: Date.now },
    receiptUrl: String
  }],
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