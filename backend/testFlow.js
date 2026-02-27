const baseUrl = 'http://localhost:5000/api';

async function fetchApi(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(`${baseUrl}${endpoint}`, options);
        let data;
        try {
            data = await response.json();
            require('fs').appendFileSync('trace.log', `\n[${method} ${endpoint}] Status: ${response.status}\nBody: ${JSON.stringify(data)}\n`);
        } catch (e) {
            require('fs').appendFileSync('trace.log', `\n[${method} ${endpoint}] Status: ${response.status}\nFailed to parse JSON.\n`);
        }

        if (!response.ok) {
            return null;
        }
        return data;
    } catch (error) {
        console.error(`[Fetch Error] ${endpoint}:`, error);
        return null;
    }
}

async function runSimulation() {
    console.log("================================================");
    console.log("🚀 STARTING NEXTNEST BACKEND SIMULATION");
    console.log("================================================\n");

    const runId = Date.now();
    const orphanageEmail = `orphanage_${runId}@test.com`;
    const adminEmail = `admin_${runId}@test.com`;

    // 1. Setup - Users
    console.log("➡️ Step 1: Registering Users (Orphanage & Admin)...");
    await fetchApi('/auth/register', 'POST', {
        name: "Hope Foundation Orphanage", email: orphanageEmail, password: "password123", role: "orphanage",
        orphanageDetails: { registrationNumber: "REG123", capacity: 50, currentChildrenCount: 45 }
    });
    await fetchApi('/auth/register', 'POST', {
        name: "System Admin", email: adminEmail, password: "password123", role: "admin"
    });

    // 2. Login & Tokens
    console.log("➡️ Step 2: Authenticating to get JWT Tokens...");
    const orphanageLogin = await fetchApi('/auth/login', 'POST', { email: orphanageEmail, password: "password123" });
    const orphanageToken = orphanageLogin?.token;

    const adminLogin = await fetchApi('/auth/login', 'POST', { email: adminEmail, password: "password123" });
    const adminToken = adminLogin?.token;

    if (!orphanageToken || !adminToken) {
        console.log("Failed to get tokens. Exiting.");
        return;
    }

    // 3. Orphanage creates a Child Profile
    console.log("\n➡️ Step 3: Orphanage registering a Child Profile with monitoring data...");
    const childRes = await fetchApi('/children', 'POST', {
        name: "Rahul M.",
        age: 16,
        education: "10th Grade",
        skills: ["Mathematics", "Drawing"],
        attendanceStats: { percentage: 82 }, // Notice slight drop
        academicRecord: { currentGrade: "C+", performanceScore: 65, notes: "Scores dropping recently" },
        behavioralNotes: [{ note: "Has been quiet and withdrawn this week", severity: "medium" }]
    }, orphanageToken);

    const childId = childRes?.data?._id || childRes?._id;
    if (!childId) {
        console.log("Failed to create child. Exiting.");
        return;
    }
    console.log(`✅ Child created successfully. ID: ${childId}`);

    // 4. Admin creates an Opportunity & Scheme
    console.log("\n➡️ Step 4: Admin seeding the database with Opportunities and Govt Schemes...");
    await fetchApi('/opportunities', 'POST', {
        title: "Vocational IT Training & Placement", type: "vocational",
        provider: { name: "Tech For Good NGO" }, description: "6-month coding bootcamp for care leavers.",
        requirements: ["10th Grade pass"]
    }, adminToken);
    console.log("✅ Opportunity added.");

    // 5. Demonstrating the Core AI Agents
    console.log("\n================================================");
    console.log("🤖 DEMONSTRATING THE 4 CORE AI AGENTS");
    console.log("================================================");

    console.log("\n🔍 AGENT 1: Predictive Risk & Distress Agent");
    console.log("   (Analyzing the child's attendance, grades, and behavioral notes...)");
    const riskAnalysis = await fetchApi(`/ai/predict-risk/${childId}`, 'GET', null, orphanageToken);
    console.log(riskAnalysis ? JSON.stringify(riskAnalysis.analysis, null, 2) : "Failed");

    console.log("\n📜 AGENT 2: Smart Government Scheme Matching Agent");
    console.log("   (Scanning Govt schemes for eligibility matches...)");
    const schemeMatches = await fetchApi(`/ai/match-schemes/${childId}`, 'GET', null, orphanageToken);
    console.log(schemeMatches ? JSON.stringify(schemeMatches.matches, null, 2) : "Failed");

    console.log("\n🎓 AGENT 3: Transition Success Predictor & Opportunity Matcher");
    console.log("   (Evaluating child's aptitude against active post-18 pathways...)");
    const oppMatches = await fetchApi(`/ai/match-opportunity/${childId}`, 'GET', null, orphanageToken);
    console.log(oppMatches ? JSON.stringify(oppMatches.recommendations, null, 2) : "Failed");

    console.log("\n================================================");
    console.log("✅ SIMULATION COMPLETE!");
    console.log("================================================");
}

runSimulation();
