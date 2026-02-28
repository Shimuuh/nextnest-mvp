import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Users, BookOpen, HeartPulse, Building, ChevronRight, CheckCircle2, Activity, User } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import api from '../services/api';

const SchemeMatches = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [matchedChildren, setMatchedChildren] = useState([]);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [selectedScheme, setSelectedScheme] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const categories = ['All', 'Education', 'Financial', 'Housing', 'Health'];

    // Define icons and colors mapped loosely to categories
    const getIconForCategory = (dept) => {
        if (!dept) return BookOpen;
        const d = dept.toLowerCase();
        if (d.includes('health')) return HeartPulse;
        if (d.includes('house') || d.includes('home')) return Building;
        return BookOpen;
    };

    const getColorForCategory = (dept) => {
        if (!dept) return 'blue';
        const d = dept.toLowerCase();
        if (d.includes('health')) return 'red';
        if (d.includes('house') || d.includes('home')) return 'teal';
        return 'blue';
    };

    useEffect(() => {
        const fetchSchemes = async () => {
            setLoading(true);
            try {
                const response = await api.get('/schemes');
                const fetchedSchemes = response.data.data.map(scheme => ({
                    ...scheme,
                    category: scheme.department || 'Education', // Default to education if none
                    icon: getIconForCategory(scheme.department),
                    color: getColorForCategory(scheme.department),
                    targetGroup: scheme.eligibilityRules?.targetGroup?.join(', ') || 'All eligible',
                    benefits: scheme.description || 'See details for benefits',
                    eligibility: [
                        `Age: ${scheme.eligibilityRules?.minAge || 0} - ${scheme.eligibilityRules?.maxAge || 18}`,
                        ...(scheme.eligibilityRules?.requiredDocuments?.length > 0
                            ? [`Requires: ${scheme.eligibilityRules.requiredDocuments.join(', ')}`]
                            : [])
                    ],
                    matchCount: Math.floor(Math.random() * 50) + 10 // temporary random number for UI while data syncs
                }));
                setSchemes(fetchedSchemes);
            } catch (error) {
                console.error("Error fetching schemes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchemes();
    }, []);

    const fetchMatchedChildren = async (scheme) => {
        setSelectedScheme(scheme);
        setShowModal(true);
        setLoadingMatches(true);
        try {
            const response = await api.get(`/schemes/${scheme._id}/matches`);
            setMatchedChildren(response.data.data);
        } catch (error) {
            console.error("Error fetching matched children:", error);
            setMatchedChildren([]);
        } finally {
            setLoadingMatches(false);
        }
    };

    const filteredSchemes = schemes.filter(s => {
        const matchesCategory = activeCategory === 'All' || s.category.includes(activeCategory);
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.department?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

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
                            onChange={(e) => setSearchQuery(e.target.value)}
                            value={searchQuery}
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
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
                        <span className="ml-3 text-gray-500 font-medium">Loading schemes...</span>
                    </div>
                ) : filteredSchemes.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500">No schemes found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSchemes.map((scheme, index) => {
                            const Icon = scheme.icon || BookOpen;
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    key={scheme._id}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col h-full"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl border ${getColorClasses(scheme.color)}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {scheme.name}
                                    </h3>
                                    {scheme.department && (
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-4">{scheme.department}</p>
                                    )}

                                    <div className="space-y-3 mb-6 flex-grow">
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

                                    <button
                                        onClick={() => fetchMatchedChildren(scheme)}
                                        className="w-full mt-auto py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-indigo-600 hover:text-white hover:border-transparent transition-colors flex items-center justify-center gap-2">
                                        View Matched Children
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Matched Children Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={`Matched Children: ${selectedScheme?.name}`}
            >
                <div className="space-y-4">
                    {loadingMatches ? (
                        <div className="flex justify-center items-center py-10">
                            <Activity className="w-6 h-6 text-indigo-500 animate-spin mr-2" />
                            <span className="text-gray-600">Finding matches...</span>
                        </div>
                    ) : matchedChildren.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-gray-500 font-medium">No children match the eligibility criteria for this scheme.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="mb-4">
                                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                                    {matchedChildren.length} Eligible children found
                                </span>
                            </div>
                            {matchedChildren.map((child) => (
                                <div key={child._id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{child.name}</h4>
                                            <p className="text-sm text-gray-500 flex gap-2">
                                                <span>Age: <strong className="text-gray-700">{child.age}</strong></span>
                                                {child.education && (
                                                    <>
                                                        <span className="text-gray-300">•</span>
                                                        <span>{child.education}</span>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
                                        View Profile
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>
        </Layout>
    );
};

export default SchemeMatches;
