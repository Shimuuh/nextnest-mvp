import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, TrendingUp, Award, ChevronRight, DollarSign, Calendar, MessageSquare, Activity } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import Layout from '../components/Layout';

const DonorDashboard = () => {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDonateModal, setShowDonateModal] = useState(false);
    const [showAllChildren, setShowAllChildren] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);
    const [donateAmount, setDonateAmount] = useState('');

    const [myDonations, setMyDonations] = useState([]);
    const [totalDonated, setTotalDonated] = useState(0);
    const [paymentState, setPaymentState] = useState('idle');
    const [processingStep, setProcessingStep] = useState(0);

    const processingMessages = [
        "AI Agent initializing secure payment gateway...",
        "Verifying donor credentials and securing connection...",
        "Allocating funds and optimizing transaction route...",
        "Finalizing transaction..."
    ];

    const stats = [
        { label: "Total Impact", value: "2,450", icon: Heart, trend: "+15% this month" },
        { label: "Children Supported", value: children.length + 100, icon: Award, trend: "+8 new children" },
        { label: "My Total Contributions", value: `$${totalDonated.toLocaleString()}`, icon: TrendingUp, trend: "Thank you for your generosity!" },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [childrenRes, donationsRes] = await Promise.all([
                    api.get('/children'),
                    api.get('/donations/my')
                ]);
                setChildren(childrenRes.data.data || []);

                const myDons = donationsRes.data.donations || [];
                setMyDonations(myDons);
                const total = myDons.reduce((sum, d) => sum + Number(d.amount), 0);
                setTotalDonated(total);
            } catch (error) {
                console.error("Failed to fetch data for donor", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Listeners for chatbot-initiated external updates
        const handleDonationUpdate = async () => {
            try {
                const res = await api.get('/donations/my');
                const myDons = res.data.donations || [];
                setMyDonations(myDons);
                setTotalDonated(myDons.reduce((sum, d) => sum + Number(d.amount), 0));
            } catch (error) {
                console.error("Failed to fetch updated donations from event", error);
            }
        };
        window.addEventListener('donation_updated', handleDonationUpdate);
        return () => window.removeEventListener('donation_updated', handleDonationUpdate);
    }, []);

    const handleDonate = async (e) => {
        e.preventDefault();
        setPaymentState('processing');
        setShowDonateModal(false); // Close the internal modal to let Razorpay take over

        try {
            const orderRes = await api.post('/payment/createOrder', { amount: donateAmount });
            const options = {
                key: "rzp_test_X5OfG2jiWrAzSj", // Provided key
                amount: orderRes.data.order.amount,
                currency: "INR",
                name: "NextNest",
                description: `Donation for ${selectedChild?.name || 'general support'}`,
                order_id: orderRes.data.order.id,
                handler: async function (response) {
                    try {
                        await api.post('/payment/verifyPayment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount: donateAmount,
                            childId: selectedChild?._id,
                            message: `Donation for ${selectedChild?.name || 'general support'}`
                        });
                        setTotalDonated(prev => prev + Number(donateAmount));
                        setDonateAmount('');
                        setPaymentState('idle');
                        alert("Thank you! Your secure Razorpay donation was successful.");
                        window.dispatchEvent(new Event('donation_updated'));
                    } catch (verifyErr) {
                        alert("Payment verification failed. Please contact support.");
                        setPaymentState('idle');
                    }
                },
                modal: {
                    ondismiss: function () {
                        setPaymentState('idle');
                    }
                },
                prefill: {
                    name: "Kind Donor",
                    email: "donor@test.com",
                },
                theme: {
                    color: "#4f46e5"
                }
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert(`Payment failed: ${response.error.description}`);
                setPaymentState('idle');
            });
            rzp.open();
        } catch (error) {
            setPaymentState('idle');
            alert("Failed to initialize Razorpay. Please try again.");
        }
    };

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">
                            Donor Impact Dashboard
                        </h1>
                        <p className="text-gray-500 mt-1">Track your contributions and discover new opportunities to help.</p>
                    </div>
                    <button
                        onClick={() => { setSelectedChild(null); setShowDonateModal(true); }}
                        className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:-translate-y-0.5"
                    >
                        <DollarSign className="w-5 h-5" />
                        General Donation
                    </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={index}
                                className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                        <h3 className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</h3>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm text-teal-600 font-medium">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    {stat.trend}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Children Needing Support */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Support a Future</h2>
                            <button
                                onClick={() => setShowAllChildren(true)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center cursor-pointer">
                                View all <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 italic">
                                    <Activity className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                                    Discovering children in need...
                                </div>
                            ) : children.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 italic">
                                    No specific child profiles found. Your general donation will support our mission.
                                </div>
                            ) : (
                                children.map((child, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + (i * 0.1) }}
                                        key={child._id}
                                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-indigo-100 transition-all group cursor-pointer"
                                        onClick={() => { setSelectedChild(child); setShowDonateModal(true); }}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-4 items-center">
                                                <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-100">
                                                    {child.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                        Support {child.name}'s Journey
                                                    </h3>
                                                    <p className="text-sm text-gray-500">Age {child.age} • {child.education || 'Primary'}</p>
                                                </div>
                                            </div>
                                            <button className="bg-teal-50 text-teal-600 px-4 py-2 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                Support
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {child.skills?.map((skill, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-slate-50 text-slate-600 text-xs rounded-full border border-slate-100">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* AI Assistant Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white border border-indigo-100 rounded-3xl p-6 text-center shadow-sm relative overflow-hidden">
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
                            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-teal-50 rounded-full blur-3xl opacity-50"></div>

                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-indigo-100 relative z-10">
                                <MessageSquare className="w-8 h-8 text-indigo-600" />
                            </div>

                            <h3 className="text-xl font-black text-slate-900 mb-2 relative z-10">Philanthropy AI Advisor</h3>
                            <p className="text-slate-600 text-sm font-medium mb-6 leading-relaxed relative z-10">
                                Not sure where your donation will make the most impact? Chat with our AI to find the perfect child match based on your interests.
                            </p>

                            <button
                                onClick={() => window.openChatbot?.()}
                                className="relative z-10 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-md transition-colors uppercase tracking-wider text-sm"
                            >
                                Chat with Advisor
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4">Latest Success Stories</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                                    <p className="text-xs text-teal-600 font-bold uppercase tracking-wider mb-1">Impact Made</p>
                                    <p className="text-sm text-slate-800 italic">"Thanks to donors, Aryan successfully joined a vocational training course in Robotics..."</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Donation Modal */}
                <Modal
                    isOpen={showDonateModal}
                    onClose={() => setShowDonateModal(false)}
                    title={selectedChild ? `Support ${selectedChild.name}` : "General Donation"}
                >
                    {paymentState === 'idle' ? (
                        <form onSubmit={handleDonate} className="space-y-6">
                            <div className="text-center p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-4">
                                <p className="text-indigo-900 font-medium">
                                    {selectedChild
                                        ? `Your donation will directly support ${selectedChild.name}'s education and growth.`
                                        : "Your heart-felt contribution will be used for the most urgent needs across all our partner orphanages."}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Donation Amount ($)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        required
                                        type="number"
                                        value={donateAmount}
                                        onChange={(e) => setDonateAmount(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="Enter amount"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {['10', '50', '100'].map(amt => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => setDonateAmount(amt)}
                                        className={`py-2 px-4 rounded-xl border font-bold transition-all ${donateAmount === amt
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                                            }`}
                                    >
                                        ${amt}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:shadow-indigo-200 transition-all active:scale-[0.98]"
                            >
                                Confirm Donation
                            </button>
                        </form>
                    ) : paymentState === 'processing' ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
                            <Activity className="h-12 w-12 text-indigo-500 animate-spin" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">AI Agent Processing</h3>
                                <p className="text-indigo-600 font-medium h-6">
                                    {processingMessages[processingStep]}
                                </p>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                                <div
                                    className="bg-indigo-600 h-2 transition-all duration-1000 ease-out"
                                    style={{ width: `${((processingStep + 1) / processingMessages.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-2">
                                <Heart className="w-8 h-8 text-teal-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Payment Successful!</h3>
                            <p className="text-gray-500">
                                Thank you. Your generous contribution of ${donateAmount} has been processed by the AI Agent and added to your total.
                            </p>
                        </div>
                    )}
                </Modal>

                {/* All Children Modal */}
                <Modal
                    isOpen={showAllChildren}
                    onClose={() => setShowAllChildren(false)}
                    title="Full Children Registry"
                >
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading children...</div>
                        ) : children.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No children records available.</div>
                        ) : (
                            children.map(child => (
                                <div key={child._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                            {child.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{child.name}</h4>
                                            <p className="text-xs text-gray-500">Age {child.age} • {child.education || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowAllChildren(false);
                                            setSelectedChild(child);
                                            setShowDonateModal(true);
                                        }}
                                        className="text-sm px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium transition-colors"
                                    >
                                        Support
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </Modal>
            </div>
        </Layout>
    );
};

export default DonorDashboard;
