import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, BrainCircuit, ShieldAlert, Award, FileText, Activity, Upload, CheckCircle2, FileImage
} from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';

export default function ChildProfile() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [child, setChild] = useState(null);
    const [aiData, setAiData] = useState({
        risk: null,
        schemes: null,
        opportunities: null
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, ai

    // Document Upload State
    const [selectedFile, setSelectedFile] = useState(null);
    const [docType, setDocType] = useState('Birth Certificate');
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [docAiResult, setDocAiResult] = useState(null);

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        setUploadingDoc(true);
        const formData = new FormData();
        formData.append('documentFile', selectedFile);
        formData.append('docType', docType);

        try {
            const res = await api.post('/ai/process-document', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setDocAiResult(res.data.result);
        } catch (error) {
            console.error("Document AI Error", error);
            alert("Failed to process document with AI.");
        } finally {
            setUploadingDoc(false);
        }
    };

    useEffect(() => {
        const fetchChildData = async () => {
            try {
                const childRes = await api.get(`/children/${id}`);
                setChild(childRes.data.data);

                // Fetch AI Agent insights concurrently
                const [riskRes, schemesRes, oppsRes] = await Promise.all([
                    api.get(`/ai/predict-risk/${id}`).catch(() => ({ data: null })),
                    api.get(`/ai/match-schemes/${id}`).catch(() => ({ data: null })),
                    api.get(`/ai/match-opportunity/${id}`).catch(() => ({ data: null }))
                ]);

                setAiData({
                    risk: riskRes.data?.analysis,
                    schemes: schemesRes.data?.matches,
                    opportunities: oppsRes.data?.recommendations
                });
            } catch (error) {
                console.error("Failed to load child profile", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchChildData();
    }, [id]);

    if (loading) {
        return (
            <Layout>
                <div className="flex h-64 items-center justify-center">
                    <div className="text-slate-400 flex items-center">
                        <Activity className="animate-spin h-5 w-5 mr-3" /> Loading Profile...
                    </div>
                </div>
            </Layout>
        );
    }

    if (!child) {
        return (
            <Layout>
                <div className="text-center py-12 text-slate-400">Child not found.</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header Navigation */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
                </button>

                {/* Profile Card Main */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

                    <div className="flex-shrink-0 flex flex-col items-center">
                        <div className="h-32 w-32 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border-4 border-slate-800 flex items-center justify-center text-4xl font-bold text-slate-300 shadow-lg z-10">
                            {child.name.charAt(0)}
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 z-10">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-100">{child.name}</h1>
                            <p className="text-slate-400 font-medium mt-1">
                                {child.age} yrs old • {child.education} • {child.orphanage?.name}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {child.skills?.map(skill => (
                                <span key={skill} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-medium text-slate-300">
                                    {skill}
                                </span>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/50">
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <p className="text-xs text-slate-500 mb-1">Attendance</p>
                                <p className={`font-bold ${child.attendanceStats?.percentage >= 90 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                    {child.attendanceStats?.percentage}%
                                </p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <p className="text-xs text-slate-500 mb-1">Grade</p>
                                <p className="font-bold text-blue-400">{child.academicRecord?.currentGrade || 'N/A'}</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <p className="text-xs text-slate-500 mb-1">Score</p>
                                <p className="font-bold text-slate-200">{child.academicRecord?.performanceScore || 0}/100</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <p className="text-xs text-slate-500 mb-1">Status</p>
                                <p className="font-bold text-emerald-400">Active</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Custom Tabs */}
                <div className="flex space-x-1 border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'}`}
                    >
                        Overview & Notes
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'ai' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'}`}
                    >
                        <BrainCircuit className="h-4 w-4" />
                        <span>AI Insights & Matching</span>
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-slate-400" /> Behavioral Notes
                            </h3>
                            <div className="space-y-4">
                                {child.behavioralNotes?.length > 0 ? child.behavioralNotes.map((note, i) => (
                                    <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 border-l-4 border-l-blue-500">
                                        <p className="text-sm text-slate-300">{note.note}</p>
                                        <p className="text-xs text-slate-500 mt-2">{new Date(note.date).toLocaleDateString()} • {note.severity} severity</p>
                                    </div>
                                )) : (
                                    <p className="text-slate-500 text-sm">No notes available.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center">
                                <Award className="h-5 w-5 mr-2 text-yellow-400" /> Academic & Documents
                            </h3>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 mb-6">
                                <p className="text-sm font-medium text-slate-300">Observation</p>
                                <p className="text-sm text-slate-400 mt-1">{child.academicRecord?.notes || 'No academic notes.'}</p>
                            </div>

                            {/* AI Document Upload Section */}
                            <div className="border border-slate-800 rounded-xl p-5 bg-slate-800/20 relative overflow-hidden">
                                <h4 className="font-bold text-slate-200 text-sm mb-3">AI Document Verification</h4>

                                <form onSubmit={handleFileUpload} className="space-y-4 relative z-10">
                                    <div className="flex gap-3">
                                        <select
                                            className="bg-slate-900 border border-slate-700 text-sm rounded-lg px-3 py-2 text-slate-300 focus:ring-blue-500 focus:border-blue-500 flex-1"
                                            value={docType}
                                            onChange={(e) => setDocType(e.target.value)}
                                        >
                                            <option value="Birth Certificate">Birth Certificate</option>
                                            <option value="Aadhaar Card">Aadhaar Card</option>
                                            <option value="School Report">School Report</option>
                                        </select>

                                        <label className="flex-1 cursor-pointer bg-slate-900 border border-slate-700 border-dashed rounded-lg px-3 py-2 text-sm text-slate-400 hover:border-slate-500 transition-colors flex items-center justify-center gap-2">
                                            <FileImage className="w-4 h-4" />
                                            <span className="truncate max-w-[100px]">{selectedFile ? selectedFile.name : 'Select File'}</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*,.pdf"
                                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                            />
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!selectedFile || uploadingDoc}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                    >
                                        {uploadingDoc ? (
                                            <><Activity className="w-4 h-4 animate-spin" /> Verifying...</>
                                        ) : (
                                            <><Upload className="w-4 h-4" /> Upload & Extract Data</>
                                        )}
                                    </button>
                                </form>

                                {/* Document AI Result */}
                                {docAiResult && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-4 bg-slate-900 border border-emerald-500/30 rounded-lg p-4"
                                    >
                                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                                            <h5 className="font-bold text-sm">Verified Document Data</h5>
                                        </div>
                                        <ul className="text-xs text-slate-300 space-y-1 mb-3 bg-slate-800/50 p-2 rounded">
                                            {Object.entries(docAiResult.extractedData || {}).map(([k, v]) => (
                                                <li key={k}><strong className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</strong> {String(v)}</li>
                                            ))}
                                        </ul>
                                        <div className="flex justify-between items-center bg-slate-800 rounded px-2 py-1 text-xs">
                                            <span className="text-slate-400">AI Confidence:</span>
                                            <span className={`font-bold ${docAiResult.confidenceScore > 80 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                                {docAiResult.confidenceScore}%
                                            </span>
                                        </div>
                                        {docAiResult.anomaliesDetected?.length > 0 && docAiResult.anomaliesDetected[0] !== "Failed to process image" && (
                                            <div className="mt-2 text-xs text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                                                <strong>Anomalies:</strong> {docAiResult.anomaliesDetected.join(", ")}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                        {/* AI Agent 1: Guardian (Risk) */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
                            <h3 className="text-lg font-bold text-rose-400 mb-2 flex items-center">
                                <ShieldAlert className="h-5 w-5 mr-2" />
                                Risk Predictor Agent
                            </h3>

                            {aiData.risk ? (
                                <div className="space-y-4 mt-4 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 text-sm">Risk Score</span>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${aiData.risk.riskScore > 50 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                                            {aiData.risk.riskScore}/100 ({aiData.risk.riskLevel})
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Indicators Detected:</h4>
                                        <ul className="space-y-2">
                                            {aiData.risk.distressIndicators.map((ind, i) => (
                                                <li key={i} className="text-sm text-slate-300 flex items-start">
                                                    <span className="text-rose-500 mr-2">•</span> {ind}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="pt-4 border-t border-slate-800/50">
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">AI Recommendation:</h4>
                                        {aiData.risk.recommendations.map((rec, i) => (
                                            <p key={i} className="text-sm font-medium text-rose-300 bg-rose-500/10 p-2.5 rounded-lg mb-2">
                                                {rec}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm mt-4">Generating risk analysis...</p>
                            )}
                        </div>

                        {/* AI Agent 2 & 4: Schemes and Opportunities */}
                        <div className="lg:col-span-2 space-y-6">

                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center">
                                    <BookOpen className="h-5 w-5 mr-2" />
                                    Eligible Govt Schemes
                                </h3>
                                {aiData.schemes?.length > 0 ? (
                                    <div className="space-y-3">
                                        {aiData.schemes.map((scheme, i) => (
                                            <div key={i} className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-4">
                                                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold shrink-0">
                                                    {scheme.matchConfidence}%
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-300">{scheme.reasoning}</p>
                                                    <button className="mt-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">Apply for Scheme →</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-slate-500 bg-slate-800/30 rounded-xl">No specific schemes matched right now.</div>
                                )}
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center">
                                    <BrainCircuit className="h-5 w-5 mr-2" />
                                    Predictive Opportunity Matching
                                </h3>
                                {aiData.opportunities?.topMatches?.length > 0 ? (
                                    <div className="space-y-3">
                                        {aiData.opportunities.topMatches.map((match, i) => (
                                            <div key={i} className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-xl">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-bold text-slate-200 text-sm">Opportunity Match</h4>
                                                    <span className="px-2 py-1 rounded-md text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                                        {match.probabilityOfSuccess}% Expected Success
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg border border-slate-800/80">
                                                    {match.reasoning}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-slate-500 bg-slate-800/30 rounded-xl">Evaluating active opportunities...</div>
                                )}
                            </div>

                        </div>
                    </motion.div>
                )}
            </div>
        </Layout>
    );
}
