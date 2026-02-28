import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Search, ShieldAlert, GraduationCap, TrendingUp, ChevronRight, Activity, Home, Package, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

export default function OrphanageDashboard() {
    const [childrenList, setChildrenList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [registerForm, setRegisterForm] = useState({
        name: '', age: '', education: '', skills: ''
    });

    const filteredChildren = childrenList.filter(child => {
        const query = searchQuery.toLowerCase();
        return (
            child.name.toLowerCase().includes(query) ||
            child._id.toLowerCase().includes(query) ||
            (child.skills && child.skills.some(skill => skill.toLowerCase().includes(query)))
        );
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

    const careStats = [
        { label: "Total Children", value: childrenList.length, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Room Capacity", value: "85%", icon: Home, color: "text-teal-600", bg: "bg-teal-50" },
        { label: "Supply Level", value: "Normal", icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Avg Attendance", value: "92%", icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
    ];

    return (
        <Layout>
            <div className="space-y-8">
                {/* Hero Header */}
                <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 p-8 shadow-sm">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                                Welcome back, <span className="text-emerald-700">Care Center</span>
                            </h1>
                            <p className="text-slate-600 font-medium text-lg max-w-xl">
                                Dedicated to nurturing the next generation. Monitor child growth, manage profiles, and review AI-driven insights.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowRegisterModal(true)}
                            className="group flex items-center gap-3 px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95"
                        >
                            <UserPlus className="h-5 w-5 transition-transform group-hover:scale-110" />
                            <span>Quick Register Child</span>
                        </button>
                    </div>
                </div>

                {/* Core Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {careStats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 mb-1">{stat.label}</p>
                                    <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                                </div>
                                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Children List Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                                <GraduationCap className="h-7 w-7 mr-3 text-emerald-600" />
                                Nurture Profiles
                            </h2>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    placeholder="Search by name, ID, or skill..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-44 bg-slate-100 rounded-3xl animate-pulse"></div>
                                ))
                            ) : filteredChildren.length === 0 ? (
                                <div className="col-span-full py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                                    <Activity className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium text-lg">No matching profiles found.</p>
                                    <button onClick={() => { setSearchQuery(''); setShowRegisterModal(true) }} className="text-emerald-600 font-bold hover:underline mt-2">Clear search or register</button>
                                </div>
                            ) : (
                                filteredChildren.slice(0, 50).map((child, idx) => (
                                    <motion.div
                                        key={child._id}
                                        onClick={() => navigate(`/children/${child._id}`)}
                                        className="relative group bg-white border border-slate-100 p-6 rounded-3xl cursor-pointer hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all"
                                    >
                                        <div className="flex gap-4 items-center mb-6">
                                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 font-black text-xl border border-emerald-200/50">
                                                {child.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{child.name}</h3>
                                                <p className="text-sm font-semibold text-slate-500">
                                                    Age {child.age} • {child.education || 'Grade N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 flex-wrap mb-4">
                                            {child.skills?.slice(0, 2).map(skill => (
                                                <span key={skill} className="px-3 py-1 bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-600 rounded-lg uppercase tracking-widest">
                                                    {skill}
                                                </span>
                                            ))}
                                            <span className="ml-auto flex items-center text-xs font-bold text-emerald-600">
                                                {child.attendanceStats?.percentage || 0}%
                                                <Activity className="h-3 w-3 ml-1" />
                                            </span>
                                        </div>

                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/children/${child._id}`);
                                            }}
                                            className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-500 transition-colors">EXPLORE GROWTH DATA</span>
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-all translate-x-0 group-hover:translate-x-1" />
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Operational Sidebar */}
                    <div className="space-y-8">
                        <div className="bg-white p-8 rounded-3xl shadow-sm relative overflow-hidden border border-slate-200">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-50"></div>
                            <h3 className="text-xl font-black text-slate-900 flex items-center mb-6 tracking-tight">
                                <ShieldAlert className="h-6 w-6 mr-3 text-emerald-600" />
                                Care Alerts
                            </h3>
                            <div className="space-y-4 relative z-10">
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></div>
                                        <p className="text-xs font-bold text-rose-700 uppercase tracking-widest">Critical Alert</p>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed font-bold">Rahul M. has dropped below 60% attendance this week. Review notes immediately.</p>
                                </div>
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                        <p className="text-xs font-bold text-orange-700 uppercase tracking-widest">Growth Note</p>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed font-bold">3 children are eligible for the new Skill-Building Scholarship.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/alerts')}
                                className="relative z-10 w-full mt-8 py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-black rounded-2xl transition-all active:scale-95 text-sm uppercase tracking-wider">
                                View Full Risk Log
                            </button>
                        </div>

                        <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-900 text-lg">Transition Readiness</h3>
                                <TrendingUp className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div className="space-y-6">
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    Analysis shows <strong>4 children</strong> are hitting key maturity milestones. AI has calibrated their independence pathways.
                                </p>
                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-bold text-indigo-700">PATHWAY OPTIMIZATION</span>
                                        <span className="text-xs font-black text-indigo-900">88%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-600 rounded-full w-[88%]"></div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/transition')}
                                    className="w-full py-3 text-slate-600 text-sm font-bold border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all"
                                >
                                    Review AI Pathways
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                title="Register New Nurture Profile"
            >
                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                            <input
                                required
                                type="text"
                                value={registerForm.name}
                                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                placeholder="Enter full name"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Age</label>
                                <input
                                    required
                                    type="number"
                                    value={registerForm.age}
                                    onChange={(e) => setRegisterForm({ ...registerForm, age: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    placeholder="Age"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Grade</label>
                                <input
                                    type="text"
                                    value={registerForm.education}
                                    onChange={(e) => setRegisterForm({ ...registerForm, education: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    placeholder="e.g. 8th Grade"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Primary Skills</label>
                            <input
                                type="text"
                                value={registerForm.skills}
                                onChange={(e) => setRegisterForm({ ...registerForm, skills: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                placeholder="e.g. Art, Math, Chess"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95 uppercase tracking-widest text-sm">
                        Create Profile
                    </button>
                </form>
            </Modal>
        </Layout>
    );
}
