import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Warning: GEMINI_API_KEY is not defined. Advisor will run in robust fallback mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 50+ Frameworks database overview for prompt injection
const FRAMEWORKS_KNOWLEDGE_BASE = `
We support 50+ industry project management frameworks divided into 6 domains:
1. Project Management: PMBOK, PRINCE2, Waterfall/SDLC, CPM (Critical Path Method), PERT, CCPM (Critical Chain Project Management), IPMA ICB 4.0, PRiSM (Sustainability PM)
2. Agile & Lean: Scrum, Kanban, SAFe 6.0, XP (Extreme Programming), Lean Software Dev, LeSS (Large-Scale Scrum), Disciplined Agile (DA), Scrum@Scale, DevOps, Lean Six Sigma, Shape Up, Spotify Model, Agile Manifesto
3. IT Service Management: ITIL 4, COBIT 2019, SIAM (Service Integration and Management), IT4IT, ISO/IEC 20000, VeriSM, CMMI for Services, M_o_R (Management of Risk)
4. Product Management: Jobs-to-be-Done (JTBD), OKRs, Business Model Canvas, Lean Startup, Design Thinking, MoSCoW Prioritisation, RICE Scoring, Kano Model, Hook Model, GIST Planning
5. Governance & Standards: ISO/IEC 27001, ISO 9001, ISO 31000, NIST CSF 2.0, TOGAF 10, COSO ERM, CMMI, COBIT 2019
6. Portfolio & Programme Management: MSP (Managing Successful Programmes), MoP (Management of Portfolios), P3O, Lean Portfolio Management (LPM), PIM (Project Portfolio Management), M_o_R, GPM P5 Standard
`;

// Helper: Rule-based suggestion fallback when Gemini key is missing
function getRuleBasedFallback(body: any) {
  const { projectType, timeline, scope, teamSize, agileExperience } = body;
  
  // Decide 3 frameworks based on inputs
  let recommended = [];
  if (projectType === "Software Development" && scope === "Flexible") {
    recommended = [
      {
        framework: "Scrum",
        domain: "Agile & Lean",
        bestFit: "Provides high adaptability for rapid delivery of software features via 2-week iterations.",
        biggestRisk: "Sprint boundaries can feel arbitrary if user stories are poorly sliced.",
        teamMoraleImpact: "Positive",
        stakeholderFit: "High"
      },
      {
        framework: "Kanban",
        domain: "Agile & Lean",
        bestFit: "Maximizes flow and limits work-in-progress, making it perfect for continuous delivery.",
        biggestRisk: "Lack of predefined timeboxes can lead to complacency without strong team discipline.",
        teamMoraleImpact: "Positive",
        stakeholderFit: "Med"
      },
      {
        framework: "Extreme Programming (XP)",
        domain: "Agile & Lean",
        bestFit: "Emphasizes engineering practices like TDD and pair programming for technical excellence.",
        biggestRisk: "High discipline overhead might face resistance from beginner developers.",
        teamMoraleImpact: "Positive",
        stakeholderFit: "Low"
      }
    ];
  } else if (projectType === "Operational Improvement" || projectType === "Infrastructure") {
    recommended = [
      {
        framework: "Lean Six Sigma",
        domain: "Agile & Lean",
        bestFit: "Excellent for eliminating operational waste and reducing manufacturing/process variance.",
        biggestRisk: "Heavily analytical structure can slow down creative, immediate changes.",
        teamMoraleImpact: "Neutral",
        stakeholderFit: "High"
      },
      {
        framework: "Kanban",
        domain: "Agile & Lean",
        bestFit: "Visualizes workflows instantly, letting operations identify bottleneck zones cleanly.",
        biggestRisk: "Difficult to forecast long-term resource capabilities accurately without historical metrics.",
        teamMoraleImpact: "Positive",
        stakeholderFit: "High"
      },
      {
        framework: "ITIL 4",
        domain: "IT Service Management",
        bestFit: "Optimizes end-to-end IT service delivery through a modern service value system.",
        biggestRisk: "Prone to over-documentation and procedural bureaucracy if implemented rigidly.",
        teamMoraleImpact: "Neutral",
        stakeholderFit: "High"
      }
    ];
  } else if (projectType === "Product Discovery") {
    recommended = [
      {
        framework: "Design Thinking",
        domain: "Product Management",
        bestFit: "Focuses deeply on user empathy, ideation, and rapid low-fidelity prototyping cycles.",
        biggestRisk: "Can lead to analysis paralysis without transition gates into technical delivery.",
        teamMoraleImpact: "Positive",
        stakeholderFit: "Med"
      },
      {
        framework: "Lean Startup",
        domain: "Product Management",
        bestFit: "Accelerates product-market fit using rapid Build-Measure-Learn validation loops.",
        biggestRisk: "Sponsors might tire of endless pivot cycles without seeing structured milestones.",
        teamMoraleImpact: "Positive",
        stakeholderFit: "Low"
      },
      {
        framework: "Jobs-to-be-Done (JTBD)",
        domain: "Product Management",
        bestFit: "Deconstructs actual customer outcomes based on functional, emotional, and social needs.",
        biggestRisk: "Translating abstract jobs into concrete engineering requirements requires expert translation.",
        teamMoraleImpact: "Neutral",
        stakeholderFit: "High"
      }
    ];
  } else {
    // Default fallback
    recommended = [
      {
        framework: "PRINCE2®",
        domain: "Project Management",
        bestFit: "Highly structured methodology providing clear stage-gates, tolerances, and governance.",
        biggestRisk: "Very rigid framework that struggles with shifting scope or evolving specifications.",
        teamMoraleImpact: "Neutral",
        stakeholderFit: "High"
      },
      {
        framework: "Waterfall / SDLC",
        domain: "Project Management",
        bestFit: "Traditional linear PM system suited for predictable phases with clear predefined sign-offs.",
        biggestRisk: "Late defect discovery can create significant rework costs near deployment.",
        teamMoraleImpact: "Neutral",
        stakeholderFit: "High"
      },
      {
        framework: "Scrum",
        domain: "Agile & Lean",
        bestFit: "Brings structure and predictable 2-week iterations to cross-functional operational teams.",
        biggestRisk: "Stakeholders can disrupt sprints with sudden unplanned emergency demands.",
        teamMoraleImpact: "Positive",
        stakeholderFit: "Med"
      }
    ];
  }

  return {
    requiresClarification: false,
    frameworks: recommended,
    disclaimer: "These are data-driven suggestions based on industry patterns. I do not know your team's personal dynamics, your stakeholder's hidden agendas, or your company's political landscape. You are uniquely qualified to make the final call."
  };
}

// Fallback WBS & Toolkit generator
function getFallbackToolkit(framework: string, body: any) {
  const pName = body.projectName || "New Strategic Initiative";
  
  // Custom WBS
  const wbs = [
    {
      epic: "Epic 1: Initiative Foundations & Scope Alignment",
      stories: [
        "As a Project Manager, I want to host alignment sessions so that we agree on objective success boundaries.",
        "As a Technical Lead, I want to map out initial architecture variables so that we prevent downstream blockages."
      ]
    },
    {
      epic: "Epic 2: Core Capability Construction & Development",
      stories: [
        "As a system user, I want a clean landing page interface so that I can easily navigate core application features.",
        "As an operations executive, I want real-time validation checks so that we avoid corrupted database records."
      ]
    },
    {
      epic: "Epic 3: Deployment, Integration & Continuous Verification",
      stories: [
        "As a DevOps Engineer, I want automated deployment pipelines so that releases are fast and free of manual error.",
        "As a Stakeholder, I want an end-to-end performance audit so that I can confidently sign off on the delivery."
      ]
    }
  ];

  // Timeline (Framework-Adaptive)
  let timeline: any = {
    frameworkType: framework,
    title: `${framework} Timeline Visualization`,
    items: []
  };

  if (framework === "Scrum") {
    timeline.title = "2-Week Sprints with Release Milestones";
    timeline.items = [
      { phase: "Sprint 1: Onboarding & Setup", goal: "Setup dev environment, databases, and project core structure", date: "Within 14 Days" },
      { phase: "Sprint 2: Core Capabilities", goal: "Complete principal application features and mock data integrations", date: "Within 28 Days" },
      { phase: "Sprint 3: Quality Polish & UAT", goal: "Perform comprehensive security audit and deploy user acceptance testing", date: "Within 42 Days" }
    ];
  } else if (framework === "Kanban") {
    timeline.title = "Continuous Stream-Based Flow";
    timeline.items = [
      { phase: "Backlog Intake", goal: "Continual triage of stories and task cards", date: "On-Going" },
      { phase: "In Progress Stage", goal: "Limit work-in-progress (WIP limit = 3 cards active)", date: "Active" },
      { phase: "Major Milestone: Alpha Go-Live", goal: "Rollout core interfaces to beta testing group", date: "Dec 15, 2026" },
      { phase: "Major Milestone: Production Release", goal: "Full rollout and live performance tracking", date: "Jan 10, 2027" }
    ];
  } else if (framework === "Shape Up") {
    timeline.title = "6-Week Build Cycles & Cool-Downs";
    timeline.items = [
      { phase: "Cycle 1: Core System Build", goal: "Execute shaped pitches directly without daily status overhead", date: "Weeks 1 to 6" },
      { phase: "Cool-Down Period", goal: "Fix minor bugs, address technical debt, and shape the next Cycle pitch", date: "Weeks 7 to 8" },
      { phase: "Cycle 2: Scaling Features", goal: "Incorporate second round of prioritized features", date: "Weeks 9 to 14" }
    ];
  } else {
    timeline.title = "Structured Phase-Gate Methodology";
    timeline.items = [
      { phase: "Phase 1: Requirements Gathering", goal: "Document detailed functional specifications and secure sponsor sign-off", date: "Month 1" },
      { phase: "Phase 2: Architectural Design", goal: "Formulate database blueprints, system diagrams, and UI/UX mockups", date: "Month 2" },
      { phase: "Phase 3: Core Implementation", goal: "Complete coding, system testing, and operational configuration", date: "Month 3-4" },
      { phase: "Phase 4: Deployment & Transition", goal: "Provide training manuals and transition application to operations", date: "Month 5" }
    ];
  }

  // Risk Register
  const riskRegister = [
    { risk: "Sponsor changes scope mid-lifecycle", probability: "Medium", impact: "High", mitigation: "Establish rigid tolerance thresholds and process change controls." },
    { risk: "Team lacks specialized Agile experience", probability: "High", impact: "Medium", mitigation: "Pair beginner developers with seniors and conduct weekly agile mentoring hours." },
    { risk: "Compliance delays on data privacy audits", probability: "Medium", impact: "High", mitigation: "Engage the compliance team on day one to perform pre-assessments early." },
    { risk: "Integration API endpoint changes unexpectedly", probability: "Low", impact: "High", mitigation: "Build proxy abstraction layers to isolate our database from external shifts." },
    { risk: "Key resource leaves during critical phase", probability: "Low", impact: "Medium", mitigation: "Ensure comprehensive documentation and cross-train team members on key systems." }
  ];

  // RACI
  const raci = [
    { activity: "Initiative Scoping", PM: "A", TechLead: "C", Designer: "C", QA: "I", Compliance: "I", BusinessSponsor: "R" },
    { activity: "Technical Architecture", PM: "C", TechLead: "A", Designer: "I", QA: "I", Compliance: "C", BusinessSponsor: "I" },
    { activity: "Core Construction", PM: "I", TechLead: "R", Designer: "R", QA: "R", Compliance: "I", BusinessSponsor: "I" },
    { activity: "Quality Gate Sign-off", PM: "C", TechLead: "C", Designer: "I", QA: "A", Compliance: "R", BusinessSponsor: "I" },
    { activity: "UAT Approval", PM: "R", TechLead: "I", Designer: "I", QA: "I", Compliance: "I", BusinessSponsor: "A" }
  ];

  // OKRs
  const successMetrics = [
    {
      objective: "Deliver exceptional operational velocity",
      krs: [
        "KR 1: Release MVP solution to active testing within 45 days.",
        "KR 2: Reduce average task transition time across columns by 20%."
      ]
    },
    {
      objective: "Maintain absolute data integrity & compliance",
      krs: [
        "KR 1: Achieve 100% compliance score in data privacy audit by Dec 2026.",
        "KR 2: Maintain zero data leak incidents across all active databases."
      ]
    },
    {
      objective: "Enhance team morale & stakeholder trust",
      krs: [
        "KR 1: Maintain average team satisfaction index of > 4.5/5.0.",
        "KR 2: Keep weekly sponsor sentiment updates consistently green."
      ]
    }
  ];

  // Critical Assumptions
  const criticalAssumptions = [
    `Your team has prior experience with ${framework} or a closely aligned methodology.`,
    "Required compliance and legal sign-off from legal units will take no longer than 14 days.",
    "Your key stakeholders prefer structured bi-weekly metrics over direct visual dashboard access."
  ];

  return {
    wbs,
    timeline,
    riskRegister,
    raci,
    successMetrics,
    criticalAssumptions
  };
}

// Endpoint 1: Analyze project context & fetch 3 Options Matrix
app.post("/api/analyze", async (req, res) => {
  const {
    projectName,
    projectType,
    timeline,
    scope,
    compliance,
    teamSize,
    agileExperience,
    stakeholderFrequency,
    clarifyingAnswer
  } = req.body;

  const client = getGeminiClient();

  if (!client) {
    // If no API key, return rule-based fallback logic immediately
    return res.json(getRuleBasedFallback(req.body));
  }

  try {
    // Scenario A: First evaluation of project, generate context-specific clarifying question first
    if (!clarifyingAnswer) {
      const prompt = `
You are a Senior Project Strategy Advisor.
Analyze the following project setup:
- Name: "${projectName}"
- Type: ${projectType}
- Timeline: ${timeline}
- Scope: ${scope}
- Compliance requirements: ${compliance}
- Team size: ${teamSize}
- Team Agile experience: ${agileExperience}
- Stakeholder update frequency: ${stakeholderFrequency}

Based on this project, formulated for a project manager, create exactly ONE conversational, sharp, advisory clarifying question that will help you perfectly recommend the 3 best-fitting project management frameworks.
Do NOT recommend any frameworks yet. Just return the clarifying question.

Your response MUST be in JSON format matching this schema:
{
  "requiresClarification": true,
  "clarifyingQuestion": "A high-quality strategy question"
}
`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    }

    // Scenario B: Clarifying question has been answered! Generate 3 Options Matrix
    const matrixPrompt = `
You are a Senior Project Strategy Advisor. Recommend exactly 3 project management frameworks based on this project context and the project manager's answer to your clarifying question:

Project Context:
- Name: "${projectName}"
- Type: ${projectType}
- Timeline: ${timeline}
- Scope: ${scope}
- Compliance requirements: ${compliance}
- Team size: ${teamSize}
- Team Agile experience: ${agileExperience}
- Stakeholder update frequency: ${stakeholderFrequency}
- Clarifying Answer: "${clarifyingAnswer}"

Framework Knowledge Base Reference:
${FRAMEWORKS_KNOWLEDGE_BASE}

Instructions:
1. Recommend EXACTLY 3 frameworks (no more, no less) from the list above. Choose the ones that fit this specific combination of variables best.
2. Present them in a side-by-side comparison matrix with clear trade-offs, matching this schema:
{
  "requiresClarification": false,
  "frameworks": [
    {
      "framework": "[Framework Name]",
      "domain": "[Framework Domain Name]",
      "bestFit": "[1-sentence description of why it fits this project]",
      "biggestRisk": "[1-sentence description of its biggest risk in this project]",
      "teamMoraleImpact": "Positive" | "Negative" | "Neutral",
      "stakeholderFit": "High" | "Med" | "Low"
    }
  ],
  "disclaimer": "These are data-driven suggestions based on industry patterns. I do not know your team's personal dynamics, your stakeholder's hidden agendas, or your company's political landscape. You are uniquely qualified to make the final call."
}

Do not include any other conversational text in your JSON response. Make sure the JSON is perfectly valid.
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: matrixPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);

  } catch (err: any) {
    console.error("Gemini API Error in /api/analyze:", err);
    // Graceful fallback to rule-based suggestion on error
    return res.json(getRuleBasedFallback(req.body));
  }
});

// Endpoint 2: Generate Framework-Adaptive Toolkit Templates
app.post("/api/generate-templates", async (req, res) => {
  const { framework, ...projectDetails } = req.body;
  const client = getGeminiClient();

  if (!client) {
    return res.json(getFallbackToolkit(framework, req.body));
  }

  try {
    const prompt = `
You are a Senior Project Strategy Advisor.
The project manager has chosen the framework: **${framework}** for their project: "${projectDetails.projectName || 'New Project'}".

Project Context:
- Type: ${projectDetails.projectType}
- Timeline: ${projectDetails.timeline}
- Scope: ${projectDetails.scope}
- Compliance requirements: ${projectDetails.compliance}
- Team size: ${projectDetails.teamSize}
- Agile experience: ${projectDetails.agileExperience}
- Stakeholder updates: ${projectDetails.stakeholderFrequency}
- Clarifying Answer: ${projectDetails.clarifyingAnswer || 'None'}

Generate a fully custom, highly professional Universal Project Toolkit customized specifically for the **${framework}** framework.

Your output MUST be in JSON format matching this schema:
{
  "wbs": [
    {
      "epic": "Epic name with serial number (e.g. Epic 1: [Name])",
      "stories": [
        "Story in INVEST format: As a [role], I want [goal] so that [benefit]"
      ]
    }
  ],
  "timeline": {
    "frameworkType": "${framework}",
    "title": "A highly customized title suited for ${framework}",
    "items": [
      {
        "phase": "The phase, iteration, cycle, DMAIC stage, or gate approval name",
        "goal": "Description of the key goal for this timebox",
        "date": "Estimated milestone date/relative timeframe"
      }
    ]
  },
  "riskRegister": [
    {
      "risk": "Description of a realistic, highly specific risk for this project",
      "probability": "High" | "Med" | "Low",
      "impact": "High" | "Med" | "Low",
      "mitigation": "1-sentence mitigation strategy"
    }
  ],
  "raci": [
    {
      "activity": "Activity name",
      "PM": "R" | "A" | "C" | "I",
      "TechLead": "R" | "A" | "C" | "I",
      "Designer": "R" | "A" | "C" | "I",
      "QA": "R" | "A" | "C" | "I",
      "Compliance": "R" | "A" | "C" | "I",
      "BusinessSponsor": "R" | "A" | "C" | "I"
    }
  ],
  "successMetrics": [
    {
      "objective": "Objective statement with business goal",
      "krs": [
        "Key Result 1: [Metric] to reach [Target] by [Date]",
        "Key Result 2: ..."
      ]
    }
  ],
  "criticalAssumptions": [
    "Assumption 1 e.g. Your team has previous experience with Scrum",
    "Assumption 2",
    "Assumption 3"
  ]
}

Specific Guidelines:
- generate exactly 5-7 Epics in WBS, each with 2-3 INVEST stories.
- generate exactly 3-5 timeline items customized according to the selected framework rules (e.g. Scrum uses 2-week sprints, Kanban uses WIP limits & milestones, Waterfall uses phases & gates, etc.).
- generate exactly 5 risks in Risk Register.
- generate exactly 4-5 key activities in RACI matrix (using roles PM, Tech Lead, Designer, QA, Compliance, Business Sponsor).
- generate exactly 3 objectives in Success Metrics, with 2 Key Results per objective.
- generate exactly 3 assumptions with yellow warning accent.
- Ensure all text fits the professional SaaS consulting tone (analytical, sharp, modern SaaS vibes).

Do not include any other markdown formatting or text in your JSON output. Return only the valid JSON.
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);

  } catch (err: any) {
    console.error("Gemini API Error in /api/generate-templates:", err);
    return res.json(getFallbackToolkit(framework, req.body));
  }
});

async function startServer() {
  // Serve static assets in production
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // Vite dev middleware for development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
