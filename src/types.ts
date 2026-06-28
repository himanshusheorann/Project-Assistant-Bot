export type ProjectType =
  | "Software Development"
  | "Infrastructure"
  | "Business Transformation"
  | "Product Discovery"
  | "Operational Improvement";

export interface ProjectDetails {
  projectName: string;
  projectType: ProjectType | "";
  timeline: "Hard Deadline" | "Flexible" | "";
  scope: "Fixed" | "Flexible" | "";
  compliance: "Yes" | "No" | "";
  teamSize: "Small" | "Medium" | "Large" | "";
  agileExperience: "Beginner" | "Intermediate" | "Advanced" | "";
  stakeholderFrequency: "Weekly" | "Monthly" | "Quarterly" | "";
}

export interface FrameworkRecommendation {
  name: string;
  domain: string;
  bestFitFor: string;
  biggestRisk: string;
  moraleImpact: "Positive" | "Negative" | "Neutral" | string;
  stakeholderFit: "High" | "Med" | "Low";
  description: string;
  pros: string[];
  cons: string[];
  recommendedFor: string;
}

export interface UserStory {
  epic: string;
  stories: string[];
}

export interface TimelineMilestone {
  stage: string;
  date: string;
  details: string;
}

export interface RiskItem {
  risk: string;
  probability: "High" | "Med" | "Low";
  impact: "High" | "Med" | "Low";
  mitigation: string;
}

export interface RACIRow {
  activity: string;
  pm: string;
  techLead: string;
  designer: string;
  qa: string;
  compliance: string;
  sponsor: string;
}

export enum RACI {
  R = "R",
  A = "A",
  C = "C",
  I = "I"
}

export interface ObjectiveResult {
  objective: string;
  keyResults: string[];
}

export interface UniversalToolkit {
  wbs: { epic: string; stories: string[] }[];
  timeline: { stage: string; detail: string; date?: string }[];
  risks: { risk: string; probability: string; impact: string; mitigation: string }[];
  raci: Array<{ activity: string; pm: string; techLead: string; designer: string; qa: string; compliance: string; sponsor: string }>;
  successMetrics: { objective: string; krs: string[] }[];
  criticalAssumptions: string[];
}
