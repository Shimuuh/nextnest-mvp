const Donation = require("../models/Donation");
const Child = require("../models/Child");

exports.createDonation = async (req, res) => {
  try {
    const { amount, message, childId } = req.body;

    let orphanageId = req.body.orphanageId;
    let fundType = "general";
    let targetModel = undefined;
    let targetRef = undefined;

    // If a child is specified, auto-detect the orphanage and set fundType
    if (childId) {
      const child = await Child.findById(childId);
      if (child) {
        orphanageId = child.orphanage;
        fundType = "individual_sponsorship";
        targetModel = "Child";
        targetRef = childId;
      }
    }

    const donation = await Donation.create({
      donor: req.user.id,
      amount,
      message: message || `Donation for ${childId ? 'Child' : 'General Support'}`,
      fundType,
      targetRef,
      targetModel,
      orphanage: orphanageId
    });

    // Emit Socket.io event for real-time notification
    const io = req.app.get("io");
    if (io) {
      io.emit("new_donation", {
        amount: donation.amount,
        message: donation.message,
        fundType: donation.fundType
      });
    }

    res.status(201).json({ success: true, data: donation });
  } catch (error) {
    console.error("Donation creation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({
      donor: req.user.id
    }).populate("orphanage", "name email");

    res.status(200).json({
      count: donations.length,
      donations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};