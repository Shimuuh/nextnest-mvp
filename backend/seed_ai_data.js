const mongoose = require('mongoose');
require('dotenv').config();

const Scheme = require('./models/Scheme');
const Opportunity = require('./models/Opportunity');

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/nextnest";

const schemes = [
    {
        name: "PM CARES for Children",
        department: "Ministry of Women and Child Development",
        description: "Supports children who have lost both parents, surviving parent, legal guardian/adoptive parents to COVID-19 pandemic.",
        eligibilityRules: {
            minAge: 0,
            maxAge: 18,
            requiredDocuments: ["Death Certificate", "Aadhaar Card"],
            targetGroup: ["orphan"]
        },
        estimatedBenefit: {
            amount: 1000000,
            type: "monetary"
        },
        applicationLink: "https://pmcaresforchildren.in"
    },
    {
        name: "Sponsorship and Foster Care Scheme",
        department: "State Child Protection Society",
        description: "Financial support to families/orphanages to meet medical, educational and developmental needs of children.",
        eligibilityRules: {
            minAge: 0,
            maxAge: 18,
            requiredDocuments: ["Birth Certificate", "Child Welfare Committee Order"],
            targetGroup: ["orphan", "vulnerable"]
        },
        estimatedBenefit: {
            amount: 4000,
            type: "monetary"
        },
        applicationLink: "https://childlineindia.org"
    },
    {
        name: "National Scholarship Portal (Pre-Matric)",
        department: "Ministry of Minority Affairs",
        description: "Scholarship for students from minority communities to encourage parents to send their children to school.",
        eligibilityRules: {
            minAge: 6,
            maxAge: 16,
            requiredDocuments: ["Aadhaar", "School ID"],
            targetGroup: ["student"]
        },
        estimatedBenefit: {
            amount: 1500,
            type: "monetary"
        },
        applicationLink: "https://scholarships.gov.in/"
    }
];

const opportunities = [
    {
        title: "Vocational Training in Web Development",
        type: "vocational",
        provider: {
            name: "Tech for Good NGO",
            contact: "tech@goodngo.org"
        },
        description: "A 6-month intensive bootcamp for careleavers to learn full-stack web development and secure entry-level jobs.",
        requirements: ["10th Grade Pass", "Basic Computer Skills"],
        location: "Bangalore",
        status: "active"
    },
    {
        title: "TCS Youth Employment Program",
        type: "job",
        provider: {
            name: "Tata Consultancy Services",
            contact: "yep@tcs.com"
        },
        description: "Corporate training and placement program aimed at marginalized youth and careleavers.",
        requirements: ["12th Grade Pass", "Communication Skills"],
        location: "Pan-India",
        status: "active"
    },
    {
        title: "Careleaver Transition Housing",
        type: "housing",
        provider: {
            name: "Make A Difference (MAD)",
            contact: "housing@makeadiff.in"
        },
        description: "Transitional housing facility for young adults (18-21) aging out of orphanages, including mentorship.",
        requirements: ["Age 18-21", "Currently employed or studying"],
        location: "Mumbai",
        status: "active"
    }
];

async function seedAI() {
    try {
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB");

        await Scheme.deleteMany();
        await Opportunity.deleteMany();

        await Scheme.insertMany(schemes);
        await Opportunity.insertMany(opportunities);

        console.log("Successfully seeded Schemes and Opportunities for AI Agents.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding data:", error);
        process.exit(1);
    }
}

seedAI();
