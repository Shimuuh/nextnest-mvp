import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Search, ShieldAlert, GraduationCap, TrendingUp, ChevronRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

export default function OrphanageDashboard() {
    const [childrenList, setChildrenList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [registerForm, setRegisterForm] = useState({
        name: '', age: '', education: '', skills: ''
    });

    const navigate = useNavigate();

    const fetchChildren = async () => {
        setLoading(true);
        try {
            const res = await api.get('/children');
            setChildrenList(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch children", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChildren();
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...registerForm,
                age: parseInt(registerForm.age),
                skills: registerForm.skills.split(',').map(s => s.trim()).filter(s => s)
            };
            await api.post('/children', payload);
            setShowRegisterModal(false);
            setRegisterForm({ name: '', age: '', education: '', skills: '' });
            fetchChildren();
        } catch (error) {
            alert("Failed to register child");
        }
    };

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            NextNest Orphanage Management
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Manage children profiles, track progress, and monitor AI alerts.</p>
                    </div>
                    <button
                        onClick={() => setShowRegisterModal(true)}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/25 border border-blue-400/20"
                    >
                        <UserPlus className="h-4 w-4" />
                        <span>Register Child</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Area - Children List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-100 flex items-center">
                                <GraduationCap className="h-5 w-5 mr-2 text-blue-400" />
                                Children Profiles ({childrenList.length})
                            </h2>
                            <div className="relative w-64">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-500" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-9 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-900 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Search name or ID..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {loading ? (
                                <div className="col-span-2 text-center py-8 text-slate-500">
                                    <Activity className="h-5 w-5 animate-spin mx-auto mb-2" />
                                    Loading profiles...
                                </div>
                            ) : childrenList.length === 0 ? (
                                <div className="col-span-2 text-center py-8 text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
                                    No children found. Add some to get started!
                                </div>
                            ) : (
                                childrenList.map((child, idx) => (
                                    <motion.div
                                        key={child._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => navigate(`/children/${child._id}`)}
                                        className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 cursor-pointer group transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-slate-100 text-lg group-hover:text-blue-400 transition-colors">{child.name}</h3>
                                                <p className="text-slate-500 text-sm">Age: {child.age} • {child.education}</p>
                                            </div>
                                            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold border border-slate-700">
                                                {child.name.charAt(0)}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 text-sm text-slate-400 mb-4">
                                            <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 truncate max-w-[120px]">
                                                {child.skills?.[0] || 'No skills listed'}
                                            </span>
                                            <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-500/20 font-medium">
                                                {child.attendanceStats?.percentage || 0}% Att.
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-800/50">
                                            <span className="text-blue-400 font-medium group-hover:underline">View Profile & AI Insights</span>
                                            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sidebar Area - Insights & Alerts */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-slate-100 flex items-center mb-4">
                                <ShieldAlert className="h-5 w-5 mr-2 text-rose-400" />
                                AI Risk Alerts
                            </h2>
                            <div className="space-y-3">
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                    <p className="text-sm font-medium text-rose-400 mb-1">High Risk Detected</p>
                                    <p className="text-xs text-slate-300 line-clamp-2">Rahul M. has shown a drop in attendance and negative behavioral notes this week.</p>
                                    <button className="text-rose-400 text-xs mt-2 underline hover:text-rose-300">Take Action</button>
                                </div>
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                                    <p className="text-sm font-medium text-orange-400 mb-1">Medium Risk Detected</p>
                                    <p className="text-xs text-slate-300">Priya K. needs academic support in Mathematics.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all duration-500"></div>
                            <h2 className="text-lg font-bold text-slate-100 flex items-center mb-4">
                                <TrendingUp className="h-5 w-5 mr-2 text-purple-400" />
                                Transition Readiness
                            </h2>
                            <p className="text-sm text-slate-400 mb-4">You have 3 children turning 18 in the next 6 months. AI has prepared matched pathways for them.</p>
                            <button
                                onClick={() => navigate('/transition')}
                                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors border border-slate-700 flex justify-center items-center"
                            >
                                Review Pathways
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Register Child Modal */}
            <Modal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                title="Register New Child Profile"
            >
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                        <input
                            required
                            type="text"
                            value={registerForm.name}
                            onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Child's Full Name"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Age</label>
                            <input
                                required
                                type="number"
                                value={registerForm.age}
                                onChange={(e) => setRegisterForm({ ...registerForm, age: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Age"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Education</label>
                            <input
                                type="text"
                                value={registerForm.education}
                                onChange={(e) => setRegisterForm({ ...registerForm, education: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="e.g. 10th Grade"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Skills (comma separated)</label>
                        <input
                            type="text"
                            value={registerForm.skills}
                            onChange={(e) => setRegisterForm({ ...registerForm, skills: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g. Painting, Math, Singing"
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">
                        Register Child
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}
