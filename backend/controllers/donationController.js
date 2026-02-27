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