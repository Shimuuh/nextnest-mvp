const axios = require('axios');
const Child = require("../models/Child");
const Scheme = require("../models/Scheme");
const Opportunity = require("../models/Opportunity");

// Assuming the Python AI Engine is running locally on port 8000
const PYTHON_API_URL = "http://localhost:8000";

// Agent 1: Predictive Risk & Distress Agent
exports.predictRisk = async (childId) => {
    try {
        const child = await Child.findById(childId);
        if (!child) throw new Error("Child not found");

        console.log(`Analyzing risk for child: ${child.name} via Python AI Engine`);

        // Send full child profile to Python engine
        const response = await axios.post(`${PYTHON_API_URL}/ai/risk`, {
            childData: child
        });

        return response.data;
    } catch (error) {
        console.error("Error communicating with AI Engine:", error.message);
        throw error;
    }
};

// Agent 2: Smart Government Scheme Matching Agent
exports.matchSchemes = async (childId) => {
    try {
        const child = await Child.findById(childId);
        if (!child) throw new Error("Child not found");

        const allSchemes = await Scheme.find();

        console.log(`Matching schemes for: ${child.name} against ${allSchemes.length} schemes via Python AI Engine.`);

        const response = await axios.post(`${PYTHON_API_URL}/ai/schemes`, {
            childData: child,
            availableSchemes: allSchemes
        });

        return response.data.matches || [];

    } catch (error) {
        console.error("Error communicating with AI Engine:", error.message);
        throw error;
    }
};

// Agent 3: Document Intelligence & Identity Agent
exports.processDocument = async (fileUrl, docType) => {
    try {
        console.log(`Processing document ${fileUrl} of type ${docType} via Python AI Engine...`);

        const response = await axios.post(`${PYTHON_API_URL}/ai/document`, {
            imageUrl: fileUrl,
            documentType: docType
        });

        return {
            success: true,
            extractedData: response.data.extractedData,
            confidenceScore: response.data.confidenceScore,
            anomaliesDetected: response.data.anomaliesDetected
        };
    } catch (error) {
        console.error("Error communicating with AI Engine:", error.message);
        throw error;
    }
};

// Agent 4: Transition Success Predictor & Opportunity Matcher
exports.matchOpportunity = async (childId) => {
    try {
        const child = await Child.findById(childId);
        if (!child) throw new Error("Child not found");

        const opportunities = await Opportunity.find({ status: "active" });
        console.log(`Analyzing ${opportunities.length} opportunities for ${child.name} via Python AI Engine`);

        const response = await axios.post(`${PYTHON_API_URL}/ai/opportunities`, {
            childData: child,
            availableOpportunities: opportunities
        });

        return response.data;
    } catch (error) {
        console.error("Error communicating with AI Engine:", error.message);
        throw error;
    }
};

// Agent 5: Chatbot Agent
exports.chat = async (message, userRole) => {
    try {
        console.log(`Processing chat message via Python AI Engine...`);
        const response = await axios.post(`${PYTHON_API_URL}/ai/chat`, {
            message,
            userRole
        });
        return response.data;
    } catch (error) {
        console.error("Error communicating with AI Engine:", error.message);
        throw error;
    }
};
