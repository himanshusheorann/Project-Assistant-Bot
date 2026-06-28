import { ProjectDetails, FrameworkRecommendation } from "./types";

export const FRAMEWORK_DETAILS_DATABASE: Record<string, { pros: string[]; cons: string[]; desc: string; recommendedFor: string }> = {
  "Scrum": {
    desc: "A sprint-based, iterative framework built for complex product delivery using fast feedback loops.",
    pros: [
      "Accelerates time-to-market with functional product increments every sprint.",
      "High team empowerment and alignment through dedicated agile roles (SM, PO).",
      "Increases risk mitigation through constant, iterative inspection and adaptation."
    ],
    cons: [
      "Prone to scope creep if the Product Owner lacks firm prioritisation control.",
      "High meeting overhead (daily stands, sprint planning, review, retrospective).",
      "Requires active, continuous stakeholder participation which can be hard to secure."
    ],
    recommendedFor: "Software development teams with evolving requirements and highly engaged product sponsors."
  },
  "Kanban": {
    desc: "A visual continuous flow framework focused on work-in-progress (WIP) reduction and process optimisation.",
    pros: [
      "Zero timebox overhead allows continuous deployment of tasks when ready.",
      "Limits WIP directly, making bottlenecks immediately obvious in the system.",
      "Highly adaptable to sudden operational shifts and support requests."
    ],
    cons: [
      "Harder to forecast long-term completion dates without historical velocity metrics.",
      "Less structure can lead to complacency or lack of focus without tight team discipline.",
      "Can suffer from visual clutter on the board if team policies are not explicit."
    ],
    recommendedFor: "Support, operations, and platform engineering teams demanding continuous, fluid delivery."
  },
  "PRINCE2®": {
    desc: "A structured, stage-gated project management methodology focused on business justification and defined tolerances.",
    pros: [
      "Rigorous risk management and clear accountability across project board levels.",
      "Defined stage-gates ensure projects only proceed if business viability is verified.",
      "Highly standardized templates prevent procedural gaps and manage tolerances."
    ],
    cons: [
      "High documentation and administrative overhead can slow down early phases.",
      "Rigid change control processes make adaptation to evolving design specs slow.",
      "Focuses heavily on management control rather than hands-on team execution."
    ],
    recommendedFor: "Government, heavy infrastructure, or highly regulated enterprise projects with fixed scope requirements."
  },
  "Waterfall / SDLC": {
    desc: "A linear, sequential project cycle where progress flows steadily downward through defined phases.",
    pros: [
      "Extremely clear milestones, budget estimates, and final sign-off expectations from day one.",
      "Suited for contractual client relationships where deliverables are strictly bound.",
      "Does not require constant client availability during the implementation phase."
    ],
    cons: [
      "Extremely high risk of downstream integration or quality issues during testing.",
      "Scope changes near the end are exceptionally expensive to correct.",
      "Client does not see or interact with a working product until the final phase."
    ],
    recommendedFor: "Contract-bound projects with unyielding scope boundaries and completely predictable technologies."
  },
  "Shape Up": {
    desc: "A cycle-based design and build system designed by Basecamp to eliminate estimation anxiety and foster autonomy.",
    pros: [
      "Gives builders absolute distraction-free focus during the 6-week build cycle.",
      "Fixed appetite ensures tasks are scoped to fit the timeframe (no estimation bloating).",
      "Cool-down periods provide dedicated time to breathe, address tech debt, and innovate."
    ],
    cons: [
      "Hard to implement if stakeholders demand week-by-week status metrics.",
      "Requires high-level shaper resources to draft crystal-clear pitches.",
      "No process support for sudden emergency bugs during active build cycles."
    ],
    recommendedFor: "Autonomous product-driven teams who want to build high-quality solutions without daily standup friction."
  },
  "Lean Startup": {
    desc: "A product validation framework focused on minimizing waste via fast Build-Measure-Learn feedback loops.",
    pros: [
      "Minimizes wasted capital by validating consumer demand before deep coding starts.",
      "Ensures the final product solves an authentic, painful market problem.",
      "Fosters a culture of extreme data-driven experimentation and pivot adaptability."
    ],
    cons: [
      "High user-research overhead can delay core foundational backend builds.",
      "Constant pivot loops can frustrate technical resources who desire delivery stability.",
      "Uncertainty can make long-term financial budgeting difficult for CFO levels."
    ],
    recommendedFor: "Early-stage venture discovery, product R&D divisions, and validation-heavy startups."
  },
  "Design Thinking": {
    desc: "A user-centric innovation system focusing on deep user empathy, qualitative research, and collaborative ideation.",
    pros: [
      "Deep empathy phases eliminate team assumptions about user needs.",
      "Promotes extremely creative, non-obvious solutions through open brainstorming.",
      "Validates concepts quickly with cheap, low-fidelity paper and digital mockups."
    ],
    cons: [
      "Can suffer from infinite ideation loops without rigid exit gates.",
      "Can feel abstract to purely execution-oriented software engineering groups.",
      "Does not provide any delivery structures for core technical system code."
    ],
    recommendedFor: "UX discovery squads, customer experience innovation, and pre-development concept validation."
  },
  "Lean Six Sigma": {
    desc: "A process improvement system combining lean waste reduction and statistical Six Sigma defect prevention.",
    pros: [
      "Extremely robust statistical control mechanisms for high-volume processes.",
      "Eliminates duplicate, non-value-adding process loops cleanly.",
      "Improves customer satisfaction by establishing extremely predictable performance metrics."
    ],
    cons: [
      "Can feel overly clinical or bureaucratic for small creative/tech teams.",
      "Requires specialized training belt certifications to operate effectively.",
      "Requires deep, historical data logs which may not exist in new initiatives."
    ],
    recommendedFor: "Continuous manufacturing, scale logistics, and enterprise process optimization divisions."
  },
  "ITIL 4": {
    desc: "An IT service management standard focused on creating value-driven services through aligned IT operations.",
    pros: [
      "Establishes a highly resilient service value chain for complex IT ecosystems.",
      "Excellent management of incidents, problems, and coordinated enterprise changes.",
      "Aligns IT delivery directly with strategic corporate business objectives."
    ],
    cons: [
      "Prone to massive procedural bloat if implemented without tailoring.",
      "Slows down software deployment velocity if change boards are too rigid.",
      "Heavy training and documentation overhead for support personnel."
    ],
    recommendedFor: "Enterprise IT support divisions, managed service providers, and mature operations teams."
  }
};

export const INITIAL_DETAILS: ProjectDetails = {
  projectName: "",
  projectType: "",
  timeline: "",
  scope: "",
  compliance: "",
  teamSize: "",
  agileExperience: "",
  stakeholderFrequency: ""
};

export const PROJECT_TYPES = [
  "Software Development",
  "Infrastructure",
  "Business Transformation",
  "Product Discovery",
  "Operational Improvement"
] as const;
