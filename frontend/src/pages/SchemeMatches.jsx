import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Users, BookOpen, HeartPulse, Building, ChevronRight, CheckCircle2 } from 'lucide-react';
import Layout from '../components/Layout';

const SchemeMatches = () => {
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Education', 'Financial', 'Housing', 'Health'];

    const schemes = [
        {
            id: 1,
            name: "National Merit Scholarship",
            category: "Education",
            icon: BookOpen,
            targetGroup: "Students aged 14-18",
            benefits: "₹12,000 / year for higher secondary education",
            eligibility: ["Above 80% attendance", "Passed 10th grade"],
            matchCount: 42,
            color: "blue"
        },
        {
            id: 2,
            name: "Care Leavers Housing Grant",
            category: "Housing",
            icon: Building,
            targetGroup: "Care leavers aged 18-21",
            benefits: "One-time deposit of ₹25,000 for rent",
            eligibility: ["Leaving institutional care", "Employed or in training"],
            matchCount: 15,
            color: "teal"
        },
        {
            id: 3,
            name: "Orphan Health Insurance Package",
            category: "Health",
            icon: HeartPulse,
            targetGroup: "All orphans under 18",
            benefits: "Free basic medical coverage up to ₹5 Lakhs",
            eligibility: ["Registered in orphanage system"],
            matchCount: 142,
            color: "red"
        }
    ];

    const filteredSchemes = activeCategory === 'All'
        ? schemes
        : schemes.filter(s => s.category === activeCategory);

    const getColorClasses = (color) => {
        switch (color) {
            case 'blue': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'teal': return 'bg-teal-50 text-teal-600 border-teal-100';
            case 'red': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 border-l-4 border-indigo-600 pl-4 py-1">
                            Government Scheme Database
                        </h1>
                        <p className="text-gray-500 mt-2 pl-5">
                            AI-matched welfare programs, scholarships, and grants for our children.
                        </p>
                    </div>

                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search schemes..."
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 w-full md:w-72 shadow-sm"
                        />
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap ${activeCategory === cat
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Schemes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSchemes.map((scheme, index) => {
                        const Icon = scheme.icon;
                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={scheme.id}
                                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl border ${getColorClasses(scheme.color)}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg mb-1">
                                            {scheme.matchCount} Matched
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                    {scheme.name}
                                </h3>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-start gap-2 text-sm text-gray-600">
                                        <Users className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                                        <span><strong className="text-gray-900">Target:</strong> {scheme.targetGroup}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm text-gray-600">
                                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                                        <span><strong className="text-gray-900">Benefits:</strong> {scheme.benefits}</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Eligibility Criteria</h4>
                                    <ul className="space-y-2">
                                        {scheme.eligibility.map((req, i) => (
                                            <li key={i} className="flex items-center text-sm text-gray-700">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 shrink-0" />
                                                {req}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button className="w-full py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-indigo-600 hover:text-white hover:border-transparent transition-colors flex items-center justify-center gap-2">
                                    View Matched Children
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </Layout>
    );
};

export default SchemeMatches;
