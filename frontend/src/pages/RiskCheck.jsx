import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Filter, Search, ArrowUpRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const RiskCheck = () => {
    const navigate = useNavigate();

    // Simulated AI Risk Data for the MVP presentation
    const riskData = [
        {
            id: "69a1942b6befdf2400ea4e21", // Using Rahul M.'s ID from testFlow
            name: "Rahul M.",
            age: 16,
            orphanage: "Hope Foundation",
            riskScore: 67,
            riskLevel: "High",
            indicators: ["Dropping attendance", "Withdrawal"],
            lastUpdated: "2 hours ago"
        },
        {
            id: "2",
            name: "Anjali S.",
            age: 14,
            orphanage: "Sunshine Care",
            riskScore: 85,
            riskLevel: "Critical",
            indicators: ["Severe academic drop", "Aggressive behavior", "Malnutrition signs"],
            lastUpdated: "5 mins ago"
        },
        {
            id: "3",
            name: "Vikram R.",
            age: 17,
            orphanage: "Hope Foundation",
            riskScore: 42,
            riskLevel: "Medium",
            indicators: ["Mild anxiety about transition"],
            lastUpdated: "1 day ago"
        },
        {
            id: "4",
            name: "Sneha P.",
            age: 12,
            orphanage: "New Beginnings",
            riskScore: 15,
            riskLevel: "Low",
            indicators: ["None"],
            lastUpdated: "3 days ago"
        }
    ];

    const getRiskColor = (level) => {
        switch (level) {
            case 'Critical': return 'bg-red-50 text-red-700 border-red-200';
            case 'High': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'Medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'Low': return 'bg-green-50 text-green-700 border-green-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-3">
                            <Activity className="w-8 h-8 text-red-500" />
                            Global Risk Alerts
                        </h1>
                        <p className="text-gray-500 mt-1">AI-powered predictive alerts for children needing immediate intervention.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search child or orphanage..."
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 w-64 shadow-sm"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>
                </div>

                {/* Critical Alert Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm"
                >
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-900">1 Critical Case Requires Immediate Attention</h3>
                        <p className="text-red-700 mt-1">Anjali S. (Sunshine Care) has shown severe distress indicators over the past 48 hours. A counselor dispatch is recommended.</p>
                        <button className="mt-3 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-200 text-sm">
                            Dispatch Counselor
                        </button>
                    </div>
                </motion.div>

                {/* AI Risk Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                <th className="p-4 pl-6">Child Name</th>
                                <th className="p-4">Orphanage</th>
                                <th className="p-4">Risk Level</th>
                                <th className="p-4">AI Indicators</th>
                                <th className="p-4">Last Updated</th>
                                <th className="p-4 pr-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {riskData.map((child, index) => (
                                <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    key={child.id}
                                    className="hover:bg-gray-50 transition-colors group"
                                >
                                    <td className="p-4 pl-6 font-bold text-gray-900">
                                        {child.name}
                                        <div className="text-xs font-normal text-gray-500 mt-0.5">Age: {child.age}</div>
                                    </td>
                                    <td className="p-4 text-gray-600">{child.orphanage}</td>
                                    <td className="p-4">
                                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getRiskColor(child.riskLevel)}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse"></div>
                                            {child.riskLevel} ({child.riskScore})
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {child.indicators.map((ind, i) => (
                                            <span key={i} className="block truncate max-w-xs">• {ind}</span>
                                        ))}
                                    </td>
                                    <td className="p-4 text-sm text-gray-400">{child.lastUpdated}</td>
                                    <td className="p-4 pr-6 text-right">
                                        <button
                                            onClick={() => navigate(`/children/${child.id}`)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-block"
                                        >
                                            <ArrowUpRight className="w-5 h-5" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default RiskCheck;
