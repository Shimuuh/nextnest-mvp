import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalChildren: 124,
    activeOpportunities: 0,
    activeSchemes: 0,
    successfulTransitions: 89
  });

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showSchemeModal, setShowSchemeModal] = useState(false);
  const [showOppModal, setShowOppModal] = useState(false);

  // Form states
  const [schemeForm, setSchemeForm] = useState({
    name: '', department: '', description: '',
    eligibilityRules: { minAge: 0, maxAge: 18, targetGroup: ['orphan'] }
  });

  const [oppForm, setOppForm] = useState({
    title: '', type: 'education', provider: { name: '' }, description: '', location: ''
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [oppsRes, schemesRes] = await Promise.all([
        api.get('/opportunities'),
        api.get('/schemes')
      ]);
      setOpportunities(oppsRes.data.data || []);
      setStats(prev => ({
        ...prev,
        activeOpportunities: oppsRes.data.count || 0,
        activeSchemes: schemesRes.data.count || 0
      }));
    } catch (error) {
      console.error("Failed to load admin data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAddScheme = async (e) => {
    e.preventDefault();
    try {
      await api.post('/schemes', schemeForm);
      setShowSchemeModal(false);
      fetchDashboardData();
    } catch (error) {
      alert("Failed to add scheme");
    }
  };

  const handleAddOpp = async (e) => {
    e.preventDefault();
    try {
      await api.post('/opportunities', oppForm);
      setShowOppModal(false);
      fetchDashboardData();
    } catch (error) {
      alert("Failed to add opportunity");
    }
  };

  const statCards = [
    { title: 'Total Children Registered', value: stats.totalChildren, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Active Opportunities', value: stats.activeOpportunities, icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Govt Schemes Mapped', value: stats.activeSchemes, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Successful Transitions', value: `${stats.successfulTransitions}%`, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10' }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">System Overview</h1>
            <p className="text-slate-400 text-sm mt-1">Monitor all orphanages, children, and opportunities system-wide.</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowSchemeModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Scheme</span>
            </button>
            <button
              onClick={() => setShowOppModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add Opportunity</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={stat.title}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-start gap-4"
            >
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-100">{stat.value}</h3>
                <p className="text-slate-400 text-sm mt-1 font-medium">{stat.title}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Opportunities Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-100">Recent Opportunities</h2>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center transition-colors">
              View All <ArrowUpRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Provider</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      <Activity className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading opportunities...
                    </td>
                  </tr>
                ) : opportunities.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No active opportunities found.
                    </td>
                  </tr>
                ) : (
                  opportunities.map((opp) => (
                    <tr key={opp._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-200">{opp.title}</td>
                      <td className="px-6 py-4 capitalize">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {opp.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">{opp.provider?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${opp.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                          {opp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-blue-400 hover:text-blue-300 cursor-pointer font-medium">
                        View
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Add Scheme Modal */}
      <Modal
        isOpen={showSchemeModal}
        onClose={() => setShowSchemeModal(false)}
        title="Add New Government Scheme"
      >
        <form onSubmit={handleAddScheme} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Scheme Name</label>
            <input
              required
              type="text"
              value={schemeForm.name}
              onChange={(e) => setSchemeForm({ ...schemeForm, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Sukanya Samriddhi Yojana"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Department</label>
            <input
              type="text"
              value={schemeForm.department}
              onChange={(e) => setSchemeForm({ ...schemeForm, department: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Ministry of Women & Child Development"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
            <textarea
              value={schemeForm.description}
              onChange={(e) => setSchemeForm({ ...schemeForm, description: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 h-24"
              placeholder="Brief overview of the scheme benefits..."
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">
            Create Scheme
          </button>
        </form>
      </Modal>

      {/* Add Opportunity Modal */}
      <Modal
        isOpen={showOppModal}
        onClose={() => setShowOppModal(false)}
        title="Add New Opportunity"
      >
        <form onSubmit={handleAddOpp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Opportunity Title</label>
            <input
              required
              type="text"
              value={oppForm.title}
              onChange={(e) => setOppForm({ ...oppForm, title: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Web Development Bootcamp"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
              <select
                value={oppForm.type}
                onChange={(e) => setOppForm({ ...oppForm, type: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="education">Education</option>
                <option value="vocational">Vocational</option>
                <option value="job">Job</option>
                <option value="mentor">Mentor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Provider Name</label>
              <input
                type="text"
                value={oppForm.provider.name}
                onChange={(e) => setOppForm({ ...oppForm, provider: { ...oppForm.provider, name: e.target.value } })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. TechCorp"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Location</label>
            <input
              type="text"
              value={oppForm.location}
              onChange={(e) => setOppForm({ ...oppForm, location: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Mumbai, Maharashtra"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
            <textarea
              value={oppForm.description}
              onChange={(e) => setOppForm({ ...oppForm, description: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 h-24"
              placeholder="Requirements and eligibility..."
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">
            Create Opportunity
          </button>
        </form>
      </Modal>
    </Layout>
  );
}
