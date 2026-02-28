const Razorpay = require('razorpay');
const crypto = require('crypto');
const Donation = require('../models/Donation');
const Child = require('../models/Child');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZOR_KEY_ID,
    key_secret: process.env.RAZOR_KEY_SECRET
});

exports.createOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        const options = {
            amount: amount * 100, // Amount in paise
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`,
        };

        const order = await razorpayInstance.orders.create(options);
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error("Razorpay order error", error);
        res.status(500).json({ success: false, message: "Error creating Razorpay order" });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount,
            message,
            childId
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZOR_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Save Donation
            let orphanageId = req.body.orphanageId;
            let fundType = "general";
            let targetModel = undefined;
            let targetRef = undefined;

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

            res.status(200).json({ success: true, donation });
        } else {
            res.status(400).json({ success: false, message: "Verification Failed" });
        }
    } catch (error) {
        console.error("Payment verification error", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
