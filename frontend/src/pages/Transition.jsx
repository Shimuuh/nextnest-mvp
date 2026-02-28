import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Briefcase, GraduationCap, Clock, CheckCircle2, AlertCircle, Sparkles, Activity } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';

const Transition = () => {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analyzingIds, setAnalyzingIds] = useState(new Set());

    useEffect(() => {
        const fetchTransitionYouth = async () => {
            try {
                const res = await api.get('/children');
                const allChildren = res.data.data || [];
                // Filter for youth preparing for transition (Age 15+)
                const youth = allChildren.filter(c => c.age >= 15);

                const initialCards = youth.map(c => ({
                    id: c._id,
                    name: c.name,
                    age: c.age,
                    column: 'assessment',
                    match: "Pending AI Analysis",
                    readiness: "0%",
                    status: "pending",
                    aiData: null
                }));
                setCards(initialCards);
            } catch (error) {
                console.error("Failed to load transition youth", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTransitionYouth();
    }, []);

    const runAiAnalysis = async (childId) => {
        setAnalyzingIds(prev => new Set(prev).add(childId));
        try {
            const res = await api.get(`/ai/match-opportunity/${childId}`);
            const recommendations = res.data.recommendations;

            if (recommendations && recommendations.topMatches?.length > 0) {
                const topMatch = recommendations.topMatches[0];
                const readiness = recommendations.readinessScore;

                setCards(prev => prev.map(c => {
                    if (c.id === childId) {
                        return {
                            ...c,
                            column: readiness > 75 ? 'ready' : 'skill_building',
                            match: topMatch.title,
                            readiness: `${readiness}%`,
                            status: readiness > 60 ? 'on-track' : 'delay',
                            aiData: topMatch
                        };
                    }
                    return c;
                }));
            }
        } catch (error) {
            console.error("Failed AI Match", error);
            alert("Opportunity Matcher failed or returned empty data.");
        } finally {
            setAnalyzingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(childId);
                return newSet;
            });
        }
    };

    const columns = [
        { id: 'assessment', title: 'Initial Assessment', color: 'bg-slate-100', dot: 'bg-slate-400' },
        { id: 'skill_building', title: 'Skill Building', color: 'bg-blue-50', dot: 'bg-blue-500' },
        { id: 'ready', title: 'Ready for Placement', color: 'bg-indigo-50', dot: 'bg-indigo-500' },
        { id: 'placed', title: 'Successfully Placed', color: 'bg-teal-50', dot: 'bg-teal-500' }
    ];

    const getStatusIcon = (status) => {
        switch (status) {
            case 'on-track': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'delay': return <AlertCircle className="w-4 h-4 text-orange-500" />;
            default: return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <Layout>
            <div className="h-[calc(100vh-12rem)] flex flex-col space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent border-l-4 border-indigo-500 pl-4 py-1">
                        Transition Planning Board
                    </h1>
                    <p className="text-gray-500 mt-2 pl-5">
                        Run our AI Opportunity Matcher to predict readiness and find jobs, education, and housing for youth aging out of care.
                    </p>
                </div>

                {/* Kanban Board */}
                <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex w-full items-center justify-center text-gray-500">
                            <Activity className="animate-spin w-8 h-8 mr-3 text-indigo-500" />
                            Loading youth profiles...
                        </div>
                    ) : columns.map((col, index) => {
                        const colCards = cards.filter(c => c.column === col.id);
                        return (
                            <div key={col.id} className={`flex-shrink-0 w-80 rounded-2xl flex flex-col border border-gray-200 ${col.color}`}>
                                {/* Column Header */}
                                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white/50 rounded-t-2xl">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`}></div>
                                        <h3 className="font-bold text-gray-800">{col.title}</h3>
                                    </div>
                                    <span className="bg-white text-gray-600 text-xs font-bold px-2.5 py-1 rounded-lg border border-gray-200">
                                        {colCards.length}
                                    </span>
                                </div>

                                {/* Column Body / Cards */}
                                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                    {colCards.map((card, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ y: -4, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                                            key={card.id}
                                            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{card.name}</h4>
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">Age {card.age}</p>
                                                </div>
                                                {card.status === 'pending' && (
                                                    <button
                                                        onClick={() => runAiAnalysis(card.id)}
                                                        disabled={analyzingIds.has(card.id)}
                                                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Run AI Matcher"
                                                    >
                                                        {analyzingIds.has(card.id) ? <Activity className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-3 text-sm mb-4 border border-gray-100">
                                                <div className="flex items-center gap-2 text-indigo-700 font-medium mb-1">
                                                    <Briefcase className="w-4 h-4 shrink-0" />
                                                    <span className="truncate" title={card.match}>{card.match}</span>
                                                </div>
                                                {card.aiData && (
                                                    <p className="text-xs text-gray-500 mt-2 italic border-t border-gray-200 pt-2 line-clamp-2">
                                                        " {card.aiData.reasoning} "
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    {getStatusIcon(card.status)}
                                                    <span className="text-gray-600 font-medium">Readiness</span>
                                                </div>
                                                <span className={`font-bold ${parseInt(card.readiness) > 60 ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {card.readiness}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </Layout>
    );
};

export default Transition;
