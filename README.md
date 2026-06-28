**Live link**: https://project-framework-advisor-585899077862.asia-southeast1.run.app/

# 🧠 Project Strategy Navigator

> An AI-powered Decision Support Bot that recommends project management frameworks and generates tailored project artifacts—without making the final decision for you.

---

## 📌 Overview

**Project Strategy Navigator** is a proof-of-concept AI bot built for Project Managers who want to eliminate the "blank page" problem when starting a new project. 

Instead of spending hours researching frameworks, debating methodologies, or manually formatting templates, you describe your project once, and the bot:

1. **Analyzes** your project context (scope, timeline, team size, compliance needs).
2. **Recommends 3 frameworks** from a curated list of 50+ frameworks, presented in a side-by-side comparison matrix.
3. **Forces you to decide**—the bot explicitly refuses to pick for you.
4. **Generates a tailored Project Toolkit** (WBS, Timeline, Risk Register, RACI, OKRs) formatted specifically for the framework you chose.

**The Philosophy:** AI handles the *mechanical* work (research, formatting, arranging). The PM handles the *strategic* work (judgment, trade-offs, team dynamics).

---

## ✨ Key Features

### 🧩 50+ Framework Knowledge Base
The bot draws from a comprehensive playbook covering **6 domains**:

| Domain | Examples |
| :--- | :--- |
| **Project Management** | PMBOK, PRINCE2, Waterfall, CPM, PERT, CCPM, IPMA ICB 4.0, PRiSM |
| **Agile & Lean** | Scrum, Kanban, SAFe 6.0, XP, LeSS, Disciplined Agile, DevOps, Shape Up, Spotify Model |
| **IT Service Management** | ITIL 4, COBIT 2019, SIAM, IT4IT, ISO 20000, VeriSM, CMMI for Services, M_o_R |
| **Product Management** | JTBD, OKRs, Business Model Canvas, Lean Startup, Design Thinking, MoSCoW, RICE, Kano Model, Hook Model, GIST |
| **Governance & Standards** | ISO 27001, ISO 9001, ISO 31000, NIST CSF 2.0, TOGAF 10, COSO ERM, CMMI |
| **Portfolio & Programme** | MSP, MoP, P3O, Lean Portfolio Management, PIM, GPM P5 Standard |

### 🎯 3-Option Comparison Matrix
The bot doesn't give you a single answer. It gives you **three curated options** with:
- Best-fit scenario
- Biggest risk
- Team morale impact
- Stakeholder fit

### 🛑 Mandatory Human Decision
The bot **stops** after presenting the options. It will not generate templates until you explicitly type your chosen framework. This ensures you stay in control.

### 📋 Adaptive Project Toolkit
Once you choose a framework, the bot generates 5 templates, **formatted specifically for your selection**:

| Template | Description |
| :--- | :--- |
| **Scope Breakdown Sheet** | WBS with Epics and User Stories (INVEST format) |
| **Timeline & Milestones** | Framework-adaptive (Sprints, Cycles, Phases, DMAIC, etc.) |
| **Risk Register** | Pre-populated with 5 common risks for your project type |
| **RACI Chart** | Suggests roles and responsibilities |
| **Success Metrics (OKRs)** | 3 Objectives with measurable Key Results |

### ⚠️ Assumptions Checker
Every output ends with a transparent list of assumptions the bot made—so you can spot errors and adjust accordingly.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- An API key for OpenAI (GPT-4o) or Anthropic (Claude 3.5)
- (Optional) Streamlit for the UI

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/project-strategy-navigator.git
cd project-strategy-navigator

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Add your API keys to .env
```

### Environment Variables
Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here  # Optional
MODEL=gpt-4o  # or claude-3-5-sonnet-20241022
```

### Running the Bot

**CLI Version:**
```bash
python main.py
```

**Streamlit UI (Recommended for Demos):**
```bash
streamlit run app.py
```

---

## 📁 Project Structure

```
project-strategy-navigator/
├── app.py                  # Streamlit UI
├── main.py                 # CLI entry point
├── bot/
│   ├── __init__.py
│   ├── prompt.py           # The master system prompt (Markdown)
│   ├── llm_client.py       # API wrapper for OpenAI/Anthropic
│   └── framework_kb.py     # 50+ frameworks knowledge base
├── templates/
│   └── system_prompt.md    # The core prompt (human-readable)
├── .env.example
├── requirements.txt
└── README.md
```

---

## 🧪 Example Usage

### User Input
> *"We're building a new internal HR portal for 500 employees. Deadline is fixed for Dec 1 due to annual reviews. Compliance needs to approve data privacy. Team of 6 devs, all experienced with Scrum but hate daily standups. Stakeholders are HR VPs who want monthly updates."*

### Bot Output (Abridged)

| Framework | Domain | Best Fit For | Biggest Risk | Team Morale | Stakeholder Fit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PRINCE2** | Project Management | Fixed deadline, compliance-heavy environments | Overhead of stage-gate approvals | Neutral | High |
| **Scrum** | Agile & Lean | Experienced team, predictable 2-week cycles | Team hates daily standups | Negative | Medium |
| **Waterfall-Scrum Hybrid** | Agile & Lean | Compliance + iterative development | Complexity of blending two systems | Positive | High |

> 🔴 **YOUR DECISION REQUIRED**
> *Please type your chosen framework from the list above.*

*(Bot stops. User types "PRINCE2". Bot generates 5 templates formatted for PRINCE2.)*

---

## 🛡️ Security & Confidentiality

**This bot does NOT store or transmit company data.** 
- All inputs are sent directly to the LLM API.
- No data is persisted, logged, or used for training.
- The bot operates entirely on public knowledge (frameworks, industry standards).
- Designed for internal POC use. No customer data should be used in testing.

---

## 🧠 Why This Matters

Project Managers are judged on **delivery speed** and **risk mitigation**. This bot:

- **Reduces research time** from days to minutes.
- **Eliminates confirmation bias** by forcing you to compare 3 options.
- **Exposes blind spots** through the Assumptions Checker.
- **Keeps you sharp**—the bot doesn't decide; you do.

---

## 🏗️ Architecture

```mermaid
graph TD
    A[User Input] --> B[Prompt Engine]
    B --> C{LLM API<br/>(GPT-4o / Claude)}
    C --> D[3 Framework Options]
    D --> E[User Selects Framework]
    E --> F[Generate 5 Templates]
    F --> G[Assumptions Checker]
    G --> H[Final Output]
```

---

## 🧪 Testing

Run unit tests:

```bash
pytest tests/
```

Test coverage includes:
- Prompt formatting
- Framework selection logic
- Template generation
- Edge cases (ambiguous inputs, missing context)

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License—see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Frameworks Playbook:** Compiled from PMI, AXELOS, The Open Group, ISO, NIST, and industry best practices.
- **Inspiration:** Basecamp's Shape Up, John Doerr's OKRs, and the Agile Manifesto.
- **AI:** Built on OpenAI's GPT-4o and Anthropic's Claude 3.5.

---

## 📬 Contact

**Your Name**  
[LinkedIn](linkedin.com/in/himanshu-sheoran7)
[Portfolio](https://himanshuseoran.carrd.co/)

*If you're a recruiter or hiring manager—this bot was built to demonstrate strategic thinking, not just coding. Let's talk.*

---

## ⭐ Star the Repo

If you found this useful, please give it a star ⭐—it helps others discover it!
