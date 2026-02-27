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
    const [selectedChild, setSelectedChild] = useState(null);
    const [donateAmount, setDonateAmount] = useState('');

    const stats = [
        { label: "Total Impact", value: "2,450", icon: Heart, trend: "+15% this month" },
        { label: "Children Supported", value: children.length + 100, icon: Award, trend: "+8 new children" },
        { label: "Total Contributions", value: "$45,200", icon: TrendingUp, trend: "+$4,200 this month" },
    ];

    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const res = await api.get('/children');
                setChildren(res.data.data || []);
            } catch (error) {
                console.error("Failed to fetch children for donor", error);
            } finally {
                setLoading(false);
            }
        };
        fetchChildren();
    }, []);

    const handleDonate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/donations', {
                amount: donateAmount,
                child: selectedChild?._id,
                message: `Donation for ${selectedChild?.name || 'general support'}`
            });
            setShowDonateModal(false);
            setDonateAmount('');
            alert("Thank you for your generous donation!");
        } catch (error) {
            alert("Donation failed. Please try again.");
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
                            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center">
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
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white text-center shadow-xl relative overflow-hidden">
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-30"></div>
                            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-teal-400 rounded-full blur-3xl opacity-20"></div>

                            <div className="w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-md mx-auto flex items-center justify-center mb-6 border border-white/20">
                                <MessageSquare className="w-8 h-8 text-teal-300" />
                            </div>

                            <h3 className="text-xl font-bold mb-2">Philanthropy AI Advisor</h3>
                            <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
                                Not sure where your donation will make the most impact? Chat with our AI to find the perfect child match based on your interests.
                            </p>

                            <button className="w-full bg-white text-indigo-900 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-50 transition-colors">
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
                </Modal>
            </div>
        </Layout>
    );
};

export default DonorDashboard;
