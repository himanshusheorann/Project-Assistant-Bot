import { useState } from "react";
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  Search,
  Bell,
  User,
  Table,
  FileText,
  Calendar,
  ShieldAlert,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Sparkles,
  Check,
  HelpCircle,
  History,
  Settings,
  ClipboardList,
  Grid,
  ChevronDown,
  ChevronUp,
  FileDown,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectDetails, ProjectType, FrameworkRecommendation, UniversalToolkit } from "./types";
import { INITIAL_DETAILS, PROJECT_TYPES, FRAMEWORK_DETAILS_DATABASE } from "./data";

export default function App() {
  // Navigation & Screen states
  const [activeMenu, setActiveMenu] = useState("Advisor");
  const [step, setStep] = useState(0); // 0: Hero/Home, 1: Details, 2: Clarifying, 3: Compare/Choose, 4: Toolkit
  
  // Project details & analysis inputs
  const [details, setProjectDetails] = useState<ProjectDetails>(INITIAL_DETAILS);
  const [clarifyingQuestion, setClarifyingQuestion] = useState("");
  const [clarifyingAnswer, setClarifyingAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Analysis Outputs from Backend
  const [recommendedFrameworks, setRecommendedFrameworks] = useState<FrameworkRecommendation[]>([]);
  const [disclaimer, setDisclaimer] = useState("");
  
  // Selection
  const [selectedFramework, setSelectedFramework] = useState("");
  const [toolkit, setToolkit] = useState<UniversalToolkit | null>(null);

  // Accordion panel indices in Toolkit screen
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    wbs: true,
    timeline: true,
    risks: false,
    raci: false,
    metrics: false
  });

  const toggleAccordion = (section: string) => {
    setOpenAccordions(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // 1. Submit Screen 1 Details -> Check if requires clarification or gives matrix
  const handleStartAnalysis = async () => {
    // Basic validation
    if (!details.projectName.trim()) {
      setErrorMsg("Silakan masukkan Nama Proyek.");
      return;
    }
    if (!details.projectType || !details.timeline || !details.scope || !details.compliance || !details.teamSize || !details.agileExperience || !details.stakeholderFrequency) {
      setErrorMsg("Silakan lengkapi seluruh kolom isian sebelum melanjutkan.");
      return;
    }

    setErrorMsg("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details)
      });
      const data = await response.json();

      if (data.requiresClarification) {
        setClarifyingQuestion(data.clarifyingQuestion);
        setStep(2); // Go to Clarifying Question Screen
      } else {
        // Direct to Comparison Screen
        const mapped = mapFrameworkRecommendations(data.frameworks);
        setRecommendedFrameworks(mapped);
        setDisclaimer(data.disclaimer);
        setStep(3); // Go to Comparison Screen
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kegagalan saat menghubungi Advisor. Menggunakan fallback offline.");
      setStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Submit Screen 2 Clarifying Answer -> Get Comparison Matrix
  const handleClarifyingSubmit = async () => {
    if (!clarifyingAnswer.trim()) {
      setErrorMsg("Silakan berikan jawaban atau klarifikasi singkat.");
      return;
    }

    setErrorMsg("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, clarifyingAnswer })
      });
      const data = await response.json();

      const mapped = mapFrameworkRecommendations(data.frameworks);
      setRecommendedFrameworks(mapped);
      setDisclaimer(data.disclaimer);
      setStep(3); // Direct to Comparison Matrix
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal melakukan analisis. Menggunakan fallback offline.");
      setStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  // Map backend output to local fully detailed recommendations including offline database pros/cons
  const mapFrameworkRecommendations = (list: any[]): FrameworkRecommendation[] => {
    return (list || []).map((f: any) => {
      const dbInfo = FRAMEWORK_DETAILS_DATABASE[f.framework] || {
        desc: "Framework pilihan yang diadaptasikan untuk mendukung kesuksesan inisiatif proyek.",
        pros: ["Mudah diimplementasikan secara bertahap.", "Fokus pada transparansi.", "Penyelarasan peran yang kuat."],
        cons: ["Butuh disiplin tim yang stabil.", "Membutuhkan waktu adaptasi awal."],
        recommendedFor: "Proyek dengan karakteristik taktis."
      };
      return {
        name: f.framework,
        domain: f.domain || "Project Management",
        bestFitFor: f.bestFit || f.bestFitFor || "Kecepatan eksekusi dan toleransi deviasi yang memadai.",
        biggestRisk: f.biggestRisk || "Risiko komunikasi antartim jika parameter tidak seragam.",
        moraleImpact: f.teamMoraleImpact || f.moraleImpact || "Neutral",
        stakeholderFit: f.stakeholderFit || "High",
        description: dbInfo.desc,
        pros: dbInfo.pros,
        cons: dbInfo.cons,
        recommendedFor: dbInfo.recommendedFor
      };
    });
  };

  // 3. Choose Framework -> Generate Universal Project Toolkit
  const handleSelectFramework = async (fwName: string) => {
    setSelectedFramework(fwName);
    setIsLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/generate-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, clarifyingAnswer, framework: fwName })
      });
      const data = await response.json();

      setToolkit({
        wbs: data.wbs || [],
        timeline: Array.isArray(data.timeline) 
          ? data.timeline 
          : (data.timeline?.items || []),
        risks: (data.riskRegister || data.risks || []).map((r: any) => ({
          risk: r.risk || "",
          probability: r.probability || r.prob || "Medium",
          impact: r.impact || "Medium",
          mitigation: r.mitigation || ""
        })),
        raci: (data.raci || []).map((row: any) => ({
          activity: row.activity || "",
          pm: row.pm || row.PM || "",
          techLead: row.techLead || row.TechLead || "",
          designer: row.designer || row.Designer || "",
          qa: row.qa || row.QA || "",
          compliance: row.compliance || row.Compliance || "",
          sponsor: row.sponsor || row.BusinessSponsor || row.Sponsor || ""
        })),
        successMetrics: (data.successMetrics || []).map((m: any) => ({
          objective: m.objective || "",
          krs: m.krs || m.keyResults || []
        })),
        criticalAssumptions: data.criticalAssumptions || []
      });
      
      // Update assumptions in details if needed, or get from response
      setStep(4); // Go to Toolkit screen
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menjabarkan toolkit. Silakan coba kembali.");
    } finally {
      setIsLoading(false);
    }
  };

  // Back actions
  const resetGame = () => {
    setProjectDetails(INITIAL_DETAILS);
    setClarifyingQuestion("");
    setClarifyingAnswer("");
    setRecommendedFrameworks([]);
    setSelectedFramework("");
    setToolkit(null);
    setErrorMsg("");
    setStep(0);
  };

  // Export Toolkit as JSON Configuration
  const handleExportJSON = () => {
    if (!toolkit) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      projectName: details.projectName,
      frameworkSelected: selectedFramework,
      toolkit
    }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Project_Toolkit_${selectedFramework.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Print toolkit cleanly (Formatted as a high-quality summary document)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex bg-[#FAFAFC] text-[#111827] font-sans relative antialiased selection:bg-indigo-100 selection:text-indigo-900 print:bg-white print:text-black">
      
      {/* Sidebar Navigation - Linear.app inspired */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col shrink-0 sticky top-0 h-screen select-none print:hidden">
        {/* Workspace Brand */}
        <div className="h-16 px-6 border-b border-[#E5E7EB] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-sm leading-tight text-gray-900">Project Strat</h1>
            <p className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">Advisor VM</p>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button
            onClick={() => { setActiveMenu("Advisor"); if(step > 0) resetGame(); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150 ${activeMenu === "Advisor" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4" />
              <span>Framework Advisor</span>
            </div>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-semibold font-display">STAR ⭐</span>
          </button>

          <button
            onClick={() => { setActiveMenu("History"); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${activeMenu === "History" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <History className="w-4 h-4" />
            <span>Analysis History</span>
          </button>

          <button
            onClick={() => { setActiveMenu("Settings"); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${activeMenu === "Settings" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </nav>

        {/* User Info Foot */}
        <div className="p-4 border-t border-[#E5E7EB] bg-gray-50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
            <User className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-gray-900 truncate">Project Manager</p>
            <p className="text-[10px] text-gray-500 font-mono truncate">strategist@workspace.io</p>
          </div>
        </div>
      </aside>

      {/* Main Advisory Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 select-none print:hidden">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
              <span>PROJECTS</span>
              <span>/</span>
              <span className="text-gray-700 font-medium uppercase">{details.projectName || "UNTITLED ANALYSIS"}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full bg-[#FAFAFC] border border-[#E5E7EB] rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            </button>
            <div className="h-6 w-[1px] bg-[#E5E7EB]"></div>
            <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-1 rounded">V2.4 Active</span>
          </div>
        </header>

        {/* Dynamic Content View */}
        <div className="flex-1 overflow-y-auto px-8 py-10 print:p-0">
          
          {/* STEP PROGRESS BAR */}
          {activeMenu === "Advisor" && step > 0 && (
            <div className="max-w-4xl mx-auto mb-10 print:hidden select-none">
              <div className="flex items-center justify-between">
                {[
                  { s: 1, label: "Project Details" },
                  { s: 2, label: "Clarifying Step" },
                  { s: 3, label: "Compare Frameworks" },
                  { s: 4, label: "Choose & Generate" }
                ].map((item, idx) => {
                  const isActive = step === item.s;
                  const isCompleted = step > item.s;
                  return (
                    <div key={item.s} className="flex items-center flex-1 last:flex-initial">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${isActive ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100" : isCompleted ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                          {isCompleted ? <Check className="w-4 h-4" /> : item.s}
                        </div>
                        <span className={`text-xs font-medium ${isActive ? "text-indigo-600 font-semibold" : "text-gray-500"}`}>{item.label}</span>
                      </div>
                      {idx < 3 && (
                        <div className={`h-[2px] mx-4 flex-1 transition-all ${step > item.s ? "bg-emerald-500" : "bg-gray-200"}`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW SWITCHER */}
          <div className="max-w-4xl mx-auto">
            
            {activeMenu === "Advisor" && (
              <AnimatePresence mode="wait">
                
                {/* STEP 0: HERO WELCOME SCREEN */}
                {step === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="text-center py-16"
                  >
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-6 shadow-sm">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <h2 className="font-display font-semibold text-3xl tracking-tight text-gray-900 mb-3">
                      Choose the Right Project Framework
                    </h2>
                    <p className="text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
                      Compare industry frameworks, analyze situational trade-offs, and generate project templates perfectly formatted for your selected strategy—all in one place.
                    </p>

                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => setStep(1)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow-sm transition-all duration-150 cursor-pointer"
                      >
                        <span>Start New Analysis</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveMenu("History")}
                        className="bg-white border border-[#E5E7EB] hover:bg-[#FAFAFC] text-gray-700 text-sm font-medium px-6 py-3 rounded-xl transition-all duration-150 cursor-pointer"
                      >
                        View Previous Projects
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 1: ONBOARDING DETAILS FORM */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm"
                  >
                    <div className="border-b border-[#E5E7EB] pb-6 mb-8">
                      <h3 className="font-display font-semibold text-lg text-gray-900">Project Context Profiling</h3>
                      <p className="text-xs text-gray-500 mt-1">Specify your project parameters below. Our strategy engine will use these variables to evaluate compatible frameworks.</p>
                    </div>

                    {errorMsg && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Project Name */}
                      <div className="col-span-1 md:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">Project Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Core Banking System Revamp"
                          value={details.projectName}
                          onChange={e => setProjectDetails(p => ({ ...p, projectName: e.target.value }))}
                          className="w-full bg-[#FAFAFC] border border-[#E5E7EB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      {/* Project Type */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">Project Type</label>
                        <select
                          value={details.projectType}
                          onChange={e => setProjectDetails(p => ({ ...p, projectType: e.target.value as ProjectType }))}
                          className="w-full bg-[#FAFAFC] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Select Type --</option>
                          {PROJECT_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Timeline */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">Timeline Constraints</label>
                        <select
                          value={details.timeline}
                          onChange={e => setProjectDetails(p => ({ ...p, timeline: e.target.value as any }))}
                          className="w-full bg-[#FAFAFC] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Select Timeline --</option>
                          <option value="Hard Deadline">Hard Deadline</option>
                          <option value="Flexible">Flexible Target</option>
                        </select>
                      </div>

                      {/* Scope */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">Scope Adaptability</label>
                        <select
                          value={details.scope}
                          onChange={e => setProjectDetails(p => ({ ...p, scope: e.target.value as any }))}
                          className="w-full bg-[#FAFAFC] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Select Scope --</option>
                          <option value="Fixed">Fixed (Contractual/Defined)</option>
                          <option value="Flexible">Flexible (Evolving/Agile)</option>
                        </select>
                      </div>

                      {/* Compliance */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">Compliance & Regulatory Sign-offs</label>
                        <select
                          value={details.compliance}
                          onChange={e => setProjectDetails(p => ({ ...p, compliance: e.target.value as any }))}
                          className="w-full bg-[#FAFAFC] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Select Compliance --</option>
                          <option value="Yes">Yes (Audits / Legal Constraints)</option>
                          <option value="No">No (Low Regulatory Burden)</option>
                        </select>
                      </div>

                      {/* Team Size */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">Team Size</label>
                        <select
                          value={details.teamSize}
                          onChange={e => setProjectDetails(p => ({ ...p, teamSize: e.target.value as any }))}
                          className="w-full bg-[#FAFAFC] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Select Team Size --</option>
                          <option value="Small">Small (&lt; 5 members)</option>
                          <option value="Medium">Medium (5 - 15 members)</option>
                          <option value="Large">Large (15+ members)</option>
                        </select>
                      </div>

                      {/* Agile Experience */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">Team Agile Maturity</label>
                        <select
                          value={details.agileExperience}
                          onChange={e => setProjectDetails(p => ({ ...p, agileExperience: e.target.value as any }))}
                          className="w-full bg-[#FAFAFC] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Select Agile Maturity --</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>

                      {/* Stakeholder Involvement */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-gray-700">Required Stakeholder Sync Frequency</label>
                        <select
                          value={details.stakeholderFrequency}
                          onChange={e => setProjectDetails(p => ({ ...p, stakeholderFrequency: e.target.value as any }))}
                          className="w-full bg-[#FAFAFC] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Select Update Cadence --</option>
                          <option value="Weekly">Weekly (High Touch)</option>
                          <option value="Monthly">Monthly (Medium Touch)</option>
                          <option value="Quarterly">Quarterly (Low Touch)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-6">
                      <button
                        onClick={() => setStep(0)}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium transition duration-150"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleStartAnalysis}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all duration-150 cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Analyzing Context...</span>
                          </>
                        ) : (
                          <>
                            <span>Continue</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: CLARIFYING QUESTION SCREEN */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm max-w-xl mx-auto"
                  >
                    <div className="flex items-center gap-2.5 text-indigo-600 mb-4">
                      <HelpCircle className="w-5 h-5" />
                      <span className="text-xs uppercase font-semibold font-mono tracking-widest">Context Clarification</span>
                    </div>

                    <h3 className="font-display font-semibold text-lg text-gray-900 mb-3">
                      I need one quick clarification before comparing frameworks.
                    </h3>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 font-sans italic">
                      "{clarifyingQuestion}"
                    </p>

                    <div class="mb-6">
                      <label htmlFor="clarifying-input" class="block text-xs font-semibold text-gray-400 uppercase mb-2">Your Answer</label>
                      <textarea
                        id="clarifying-input"
                        rows={3}
                        placeholder="Provide details about your workspace culture, team preferences, legacy tech limits, or operational goals..."
                        value={clarifyingAnswer}
                        onChange={e => setClarifyingAnswer(e.target.value)}
                        className="w-full bg-[#FAFAFC] border border-[#E5E7EB] rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-400"
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-6">
                      <button
                        onClick={() => setStep(1)}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium transition duration-150"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleClarifyingSubmit}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition duration-150"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Formulating Matrix...</span>
                          </>
                        ) : (
                          <>
                            <span>Compare Frameworks</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: FRAMEWORK COMPARISON MATRIX & SELECTION */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-10"
                  >
                    <div>
                      <h3 className="font-display font-semibold text-2xl text-gray-900 tracking-tight">Recommended Strategy Options</h3>
                      <p className="text-sm text-gray-500 mt-1">Below are the three frameworks that best fit your project context. Review their strengths and risk factors.</p>
                    </div>

                    {/* Exactly 3 Framework Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {recommendedFrameworks.map((fw, idx) => (
                        <div key={idx} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors duration-200">
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded font-mono uppercase tracking-wider">{fw.domain}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase font-mono ${fw.stakeholderFit === 'High' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                Fit: {fw.stakeholderFit}
                              </span>
                            </div>

                            <h4 className="font-display font-bold text-lg text-gray-900 mb-2">{fw.name}</h4>
                            <p className="text-xs text-gray-500 leading-relaxed mb-4">{fw.description}</p>

                            <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
                              <div>
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">PROS</span>
                                <ul className="text-[11px] text-gray-600 space-y-1 list-disc pl-4 leading-relaxed">
                                  {fw.pros?.slice(0, 2).map((pro, pIdx) => <li key={pIdx}>{pro}</li>)}
                                </ul>
                              </div>

                              <div>
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">CONS</span>
                                <ul className="text-[11px] text-gray-600 space-y-1 list-disc pl-4 leading-relaxed">
                                  {fw.cons?.slice(0, 2).map((con, cIdx) => <li key={cIdx}>{con}</li>)}
                                </ul>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">BEST SUITED FOR</span>
                            <p className="text-[11.5px] font-medium text-[#111827] leading-relaxed italic">"{fw.recommendedFor}"</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Comparison Table */}
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
                      <div className="p-5 border-b border-[#E5E7EB] bg-gray-50 flex items-center justify-between">
                        <h4 className="font-display font-semibold text-sm text-gray-900">Side-by-Side Trade-off Matrix</h4>
                        <span className="text-xs font-mono text-gray-500">exactly 3 framework options</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#E5E7EB] text-[11px] font-semibold text-gray-400 uppercase bg-gray-50/50">
                              <th className="px-5 py-3">Framework</th>
                              <th className="px-5 py-3">Domain</th>
                              <th className="px-5 py-3">Best Fit For</th>
                              <th className="px-5 py-3">Biggest Risk</th>
                              <th className="px-5 py-3 text-center">Morale</th>
                              <th className="text-right px-5 py-3">Stakeholder Fit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E7EB]">
                            {recommendedFrameworks.map((f, i) => (
                              <tr key={i} className="hover:bg-[#FAFAFC] transition-colors duration-150">
                                <td className="px-5 py-4 font-bold text-gray-900 text-[14px]">{f.name}</td>
                                <td className="px-5 py-4 text-xs font-mono text-indigo-600 font-semibold">{f.domain}</td>
                                <td className="px-5 py-4 text-xs text-gray-600 max-w-[200px] leading-relaxed">{f.bestFitFor}</td>
                                <td className="px-5 py-4 text-xs text-red-600 max-w-[200px] leading-relaxed">{f.biggestRisk}</td>
                                <td className="px-5 py-4 text-xs font-semibold text-center">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono ${f.moraleImpact === 'Positive' ? 'bg-emerald-50 text-emerald-700' : f.moraleImpact === 'Negative' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {f.moraleImpact}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    {f.stakeholderFit}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="p-4 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-gray-500 leading-relaxed italic">
                      {disclaimerText()}
                    </div>

                    {/* Decision Section */}
                    <div className="p-8 bg-indigo-50/30 border border-indigo-100 rounded-xl flex flex-col items-center text-center max-w-2xl mx-auto mt-6">
                      <span className="text-xs font-black tracking-widest text-red-500 uppercase mb-2">🔴 YOUR DECISION REQUIRED</span>
                      <h4 className="font-display font-semibold text-lg text-gray-900 mb-2">Select Your Framework Strategy</h4>
                      <p className="text-xs text-gray-500 mb-6 max-w-md leading-relaxed">
                        Please type your chosen framework from the list above. Once you select, I will generate your project templates formatted for that specific framework.
                      </p>

                      <div className="flex flex-wrap items-center justify-center gap-4">
                        {recommendedFrameworks.map((f, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectFramework(f.name)}
                            disabled={isLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-3 rounded-lg flex items-center gap-2 shadow-sm transition duration-150 cursor-pointer"
                          >
                            <span>Choose {f.name}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: TOOLKIT VIEW SCREEN */}
                {step === 4 && toolkit && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-10"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                      <div>
                        <button
                          onClick={() => setStep(3)}
                          className="text-gray-500 hover:text-gray-700 text-xs font-medium flex items-center gap-1.5 mb-2 transition"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back to comparison</span>
                        </button>
                        <h3 className="font-display font-semibold text-2xl text-gray-900 tracking-tight">
                          Universal Project Toolkit: <span className="text-indigo-600">{selectedFramework}</span>
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Generated and adaptive strategic templates formulated for your chosen framework.</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={handlePrint}
                          className="bg-white border border-[#E5E7EB] hover:bg-[#FAFAFC] text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition duration-150 cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Generate PDF</span>
                        </button>
                        <button
                          onClick={handleExportJSON}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition duration-150 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export JSON</span>
                        </button>
                      </div>
                    </div>

                    {/* PRINT DOCUMENT HEADER - Shown ONLY in Print Mode */}
                    <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
                      <h1 className="font-display font-bold text-2xl text-black">Project Strat Advisor - Strategy & Templates</h1>
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono text-gray-700 mt-3">
                        <p><strong>Project Name:</strong> {details.projectName}</p>
                        <p><strong>Selected Strategy:</strong> {selectedFramework}</p>
                        <p><strong>Date Generated:</strong> {new Date().toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>

                    {/* Accordion Template Section */}
                    <div className="space-y-6">
                      
                      {/* TEMPLATE 1: Work Breakdown Structure (WBS) */}
                      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm print:shadow-none print:border-b print:rounded-none">
                        <button
                          onClick={() => toggleAccordion("wbs")}
                          className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition print:pointer-events-none select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 print:bg-none print:text-black">
                              <ClipboardList className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <span className="text-[10px] text-gray-400 font-mono font-semibold uppercase tracking-wider block">Template 1</span>
                              <h4 className="font-display font-semibold text-sm text-gray-900">Work Breakdown Structure (WBS)</h4>
                            </div>
                          </div>
                          {openAccordions.wbs ? <ChevronUp className="w-4 h-4 text-gray-400 print:hidden" /> : <ChevronDown className="w-4 h-4 text-gray-400 print:hidden" />}
                        </button>

                        {(openAccordions.wbs || window.matchMedia('print').matches) && (
                          <div className="px-6 pb-6 pt-2 border-t border-[#E5E7EB]/50 space-y-4">
                            {toolkit.wbs.map((item, idx) => (
                              <div key={idx} className="bg-gray-50/50 p-4 rounded-xl border border-[#E5E7EB] space-y-2 print:bg-white print:border-none print:p-0">
                                <h5 className="font-display font-semibold text-xs text-indigo-700 font-mono uppercase tracking-wider print:text-black">{item.epic}</h5>
                                <ul className="text-sm text-gray-700 space-y-1.5 pl-5 list-disc leading-relaxed">
                                  {(item.stories || []).map((story, sIdx) => <li key={sIdx}>{story}</li>)}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* TEMPLATE 2: Timeline & Milestones */}
                      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm print:shadow-none print:border-b print:rounded-none">
                        <button
                          onClick={() => toggleAccordion("timeline")}
                          className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition print:pointer-events-none select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 print:bg-none print:text-black">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <span className="text-[10px] text-gray-400 font-mono font-semibold uppercase tracking-wider block">Template 2</span>
                              <h4 className="font-display font-semibold text-sm text-gray-900">Timeline & Milestones (Framework-Adaptive)</h4>
                            </div>
                          </div>
                          {openAccordions.timeline ? <ChevronUp className="w-4 h-4 text-gray-400 print:hidden" /> : <ChevronDown className="w-4 h-4 text-gray-400 print:hidden" />}
                        </button>

                        {(openAccordions.timeline || window.matchMedia('print').matches) && (
                          <div className="px-6 pb-6 pt-2 border-t border-[#E5E7EB]/50">
                            {/* Adaptive Timeline Visualizer */}
                            <div className="space-y-6 pt-4">
                              <div className="flex items-center justify-between bg-indigo-50/40 px-4 py-2 rounded-lg border border-indigo-100/50 print:bg-white print:border-none print:p-0">
                                <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider font-mono print:text-black">TIMELINE LOGIC</span>
                                <span className="text-xs text-indigo-600 italic font-mono print:text-black">{selectedFramework} Setup</span>
                              </div>

                              <div className="relative border-l-2 border-indigo-100 ml-4 pl-6 space-y-6 print:border-black">
                                {toolkit.timeline.map((item, idx) => (
                                  <div key={idx} className="relative">
                                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm print:border-black print:bg-black"></div>
                                    <div className="text-left">
                                      <div className="flex items-center justify-between">
                                        <h5 className="font-display font-bold text-xs text-gray-900">{item.stage}</h5>
                                        {item.date && <span className="text-[11px] font-mono text-indigo-600 font-semibold uppercase print:text-black">{item.date}</span>}
                                      </div>
                                      <p className="text-sm text-gray-600 leading-relaxed mt-0.5">{item.detail}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* TEMPLATE 3: Risk Register */}
                      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm print:shadow-none print:border-b print:rounded-none">
                        <button
                          onClick={() => toggleAccordion("risks")}
                          className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition print:pointer-events-none select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 print:bg-none print:text-black">
                              <ShieldAlert className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <span className="text-[10px] text-gray-400 font-mono font-semibold uppercase tracking-wider block">Template 3</span>
                              <h4 className="font-display font-semibold text-sm text-gray-900">Pre-populated Risk Register</h4>
                            </div>
                          </div>
                          {openAccordions.risks ? <ChevronUp className="w-4 h-4 text-gray-400 print:hidden" /> : <ChevronDown className="w-4 h-4 text-gray-400 print:hidden" />}
                        </button>

                        {(openAccordions.risks || window.matchMedia('print').matches) && (
                          <div className="px-6 pb-6 pt-2 border-t border-[#E5E7EB]/50">
                            <div className="overflow-x-auto pt-2">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-[#E5E7EB] text-[10px] font-semibold text-gray-400 uppercase">
                                    <th className="py-2.5">Risk Description</th>
                                    <th className="py-2.5 text-center">Probability</th>
                                    <th className="py-2.5 text-center">Impact</th>
                                    <th className="py-2.5 text-right">Mitigation Strategy</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {toolkit.risks.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition">
                                      <td className="py-3 text-sm text-gray-900 leading-relaxed max-w-[200px]">{item.risk}</td>
                                      <td className="py-3 text-center text-xs font-mono font-semibold">
                                        <span className={`px-2 py-0.5 rounded ${item.probability === 'High' ? 'bg-red-50 text-red-700' : item.probability === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                          {item.probability}
                                        </span>
                                      </td>
                                      <td className="py-3 text-center text-xs font-mono font-semibold">
                                        <span className={`px-2 py-0.5 rounded ${item.impact === 'High' ? 'bg-red-50 text-red-700' : item.impact === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                          {item.impact}
                                        </span>
                                      </td>
                                      <td className="py-3 text-right text-sm text-gray-600 max-w-[250px] leading-relaxed">{item.mitigation}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* TEMPLATE 4: RACI Matrix */}
                      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm print:shadow-none print:border-b print:rounded-none">
                        <button
                          onClick={() => toggleAccordion("raci")}
                          className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition print:pointer-events-none select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 print:bg-none print:text-black">
                              <Grid className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <span className="text-[10px] text-gray-400 font-mono font-semibold uppercase tracking-wider block">Template 4</span>
                              <h4 className="font-display font-semibold text-sm text-gray-900">RACI Assignment Chart</h4>
                            </div>
                          </div>
                          {openAccordions.raci ? <ChevronUp className="w-4 h-4 text-gray-400 print:hidden" /> : <ChevronDown className="w-4 h-4 text-gray-400 print:hidden" />}
                        </button>

                        {(openAccordions.raci || window.matchMedia('print').matches) && (
                          <div className="px-6 pb-6 pt-2 border-t border-[#E5E7EB]/50">
                            <div className="overflow-x-auto pt-2">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-[#E5E7EB] text-[10px] font-semibold text-gray-400 uppercase">
                                    <th className="py-3">Activity</th>
                                    <th className="py-3 text-center">PM</th>
                                    <th className="py-3 text-center">Tech Lead</th>
                                    <th className="py-3 text-center">Designer</th>
                                    <th className="py-3 text-center">QA</th>
                                    <th className="py-3 text-center">Compliance</th>
                                    <th className="py-3 text-center">Sponsor</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-mono">
                                  {toolkit.raci.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition text-gray-700">
                                      <td className="py-3.5 font-sans font-medium text-gray-900 text-sm">{row.activity}</td>
                                      <td className="py-3.5 text-center font-bold">{row.pm}</td>
                                      <td className="py-3.5 text-center font-bold">{row.techLead}</td>
                                      <td className="py-3.5 text-center font-bold">{row.designer}</td>
                                      <td className="py-3.5 text-center font-bold">{row.qa}</td>
                                      <td className="py-3.5 text-center font-bold">{row.compliance}</td>
                                      <td className="py-3.5 text-center font-bold">{row.sponsor}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <p className="text-[10px] font-mono text-gray-400 mt-4 uppercase">Legend: R = Responsible | A = Accountable | C = Consulted | I = Informed</p>
                          </div>
                        )}
                      </div>

                      {/* TEMPLATE 5: Success Metrics */}
                      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm print:shadow-none print:border-b print:rounded-none">
                        <button
                          onClick={() => toggleAccordion("metrics")}
                          className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition print:pointer-events-none select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 print:bg-none print:text-black">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <span className="text-[10px] text-gray-400 font-mono font-semibold uppercase tracking-wider block">Template 5</span>
                              <h4 className="font-display font-semibold text-sm text-gray-900">Framework-Aligned OKRs</h4>
                            </div>
                          </div>
                          {openAccordions.metrics ? <ChevronUp className="w-4 h-4 text-gray-400 print:hidden" /> : <ChevronDown className="w-4 h-4 text-gray-400 print:hidden" />}
                        </button>

                        {(openAccordions.metrics || window.matchMedia('print').matches) && (
                          <div className="px-6 pb-6 pt-2 border-t border-[#E5E7EB]/50 space-y-4">
                            {toolkit.successMetrics.map((item, idx) => (
                              <div key={idx} className="bg-gray-50/50 p-4 rounded-xl border border-[#E5E7EB] space-y-2 print:bg-white print:border-none print:p-0">
                                <h5 className="font-display font-bold text-sm text-gray-900">{item.objective}</h5>
                                <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5 font-mono">
                                  {(item.krs || []).map((kr, kIdx) => <li key={kIdx} className="leading-relaxed">{kr}</li>)}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* FINAL SCREEN - CRITICAL ASSUMPTIONS MADE */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm print:bg-white print:border-none print:shadow-none">
                      <div className="flex items-center gap-2.5 text-amber-800 mb-4 print:text-black">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <h4 className="font-display font-bold text-sm uppercase tracking-wider">⚠️ Critical Assumptions Made</h4>
                      </div>
                      <p className="text-xs text-amber-700 leading-relaxed mb-4 print:text-black">The templates above operate under the following workspace assumptions. If these do not align, modifications are recommended:</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(toolkit.criticalAssumptions || []).map((assump, idx) => (
                          <div key={idx} className="bg-white border border-amber-100 rounded-xl p-4 shadow-sm text-xs text-gray-700 leading-relaxed print:border-black print:p-0">
                            {assump}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between border-t border-amber-200 mt-6 pt-4 print:hidden">
                        <button
                          onClick={resetGame}
                          className="text-amber-800 hover:text-amber-900 font-semibold text-xs flex items-center gap-1.5 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Restart Analysis</span>
                        </button>
                      </div>
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
            )}

            {/* SECONDARY SCREEN VIEWS */}
            {activeMenu === "History" && (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm">
                <h3 className="font-display font-semibold text-lg text-gray-900 mb-2">Analysis History</h3>
                <p className="text-sm text-gray-500 mb-6">Access previously formulated framework advice portfolios and strategic toolkits.</p>

                <div className="text-center py-12 border-2 border-dashed border-[#E5E7EB] rounded-xl">
                  <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-xs font-semibold text-gray-500">No previous sessions stored in this cache.</p>
                  <p className="text-[11px] text-gray-400 mt-1">Start a Framework Advisor cycle to populate logs.</p>
                </div>
              </div>
            )}

            {activeMenu === "Settings" && (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="font-display font-semibold text-lg text-gray-900">Settings & Key Configurations</h3>
                  <p className="text-sm text-gray-500 mt-1">Workspace settings and advisor modeling variables.</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">Advanced Server-Side Gemini API Modeling</h4>
                      <p className="text-xs text-gray-400">Pipes strategizing analysis directly to Gemini model endpoints safely.</p>
                    </div>
                    <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-semibold">Active</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]/50">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">Fallback Advisor Routine</h4>
                      <p className="text-xs text-gray-400">Guarantees 100% operation using strict offline heuristics if API limit occurs.</p>
                    </div>
                    <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-semibold">Enabled</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );

  function disclaimerText() {
    return disclaimer || "These are data-driven suggestions based on industry patterns. I do not know your team's personal dynamics, your stakeholder's hidden agendas, or your company's political landscape. You are uniquely qualified to make the final call.";
  }
}
