# SemesterOS — A Personal Academic Operating System

A modular, local-first academic management application designed to help an engineering student navigate and master all 8 semesters of their degree from one unified dashboard.

Designed with a sleek, minimalist monochrome black-and-white aesthetic, SemesterOS provides authentic academic calculations, conflict-checked schedules, spaced repetition revision, structured lab experiment records, and optional local AI study assistance.

---

## 🏛 Product Modules & Features

1. **Overview Dashboard**
   - Real-time semester academic KPIs: Current SGPA, Cumulative CGPA, Target CGPA, and Overall Attendance compliance.
   - Schedule for today's classes with room and instructor details.
   - Subject-wise attendance progress bars with automated threshold warnings.
   - Upcoming assignment deadlines with priority tags.
   - Upcoming examination countdown widget.

2. **Timetable & Routine Manager**
   - Mon–Sat weekly routine grid (8:00 AM – 5:00 PM) and daily schedule views.
   - Automated timetable conflict detection prevents double-booking time slots on the same day.
   - Color-coded lecture and 2-hour laboratory blocks.

3. **Subject-Wise Attendance Tracker**
   - Tracks total classes conducted, attended, missed, and cancelled.
   - Configurable minimum attendance threshold (default: 75%).
   - Bunk Forecasting: calculates the exact number of classes you can safely miss without dropping below threshold.
   - Recovery Requirement: calculates the consecutive classes you must attend to recover compliance.
   - Full historical attendance log with status indicators.

4. **Subjects & Syllabus Manager**
   - 8-semester isolated curriculum taxonomy.
   - Subject codes, credits, instructors, and syllabus module breakdown.
   - Interactive topic status lifecycle: `Not Started` → `Learning` → `Completed` → `Needs Revision`.
   - Dynamic real-time syllabus completion percentages.

5. **Tasks & Coursework**
   - Track assignments, lab submissions, problem sets, projects, and study tasks.
   - List View with priority filters and due date formatting.
   - Interactive Kanban Board View with 4 columns: `To Do`, `In Progress`, `Submitted`, `Completed`.

6. **Labs & Practicals Manager**
   - Structured engineering lab experiment records:
     - Experiment number & title
     - Aim, Apparatus/Software, Theory, Procedure, Observations, Calculations, Result
     - Viva Voce oral interview questions & answers
     - Source code snippets and outputs
   - Clean printable report layout (`Ctrl + P` / `Print Record` button) formatted for formal submission.

7. **Exams, Marks, SGPA & CGPA**
   - Assessment tracking for Quizzes, Assignments, Midterms, Lab Internals, and End-Semester exams.
   - Credit-weighted 10-point SGPA formula:
     $$\text{SGPA} = \frac{\sum (\text{Subject Credits} \times \text{Grade Points})}{\sum \text{Subject Credits}}$$
   - Multi-semester cumulative CGPA records.
   - Target CGPA Scenario Simulator: calculates the required SGPA in remaining semesters to achieve your graduation goal.

8. **Study Planner & Pomodoro Focus Timer**
   - Retro flip-clock countdown display (`25:00`) with split-tile aesthetics.
   - Modes: Pomodoro (25m), Short Break (5m), Long Break (15m).
   - Subject & Activity association with tags (`Deep Work`, `Reading`, `Problem Solving`, `Notes`).
   - Offline acoustic completion chime synthesized via HTML5 Web Audio API.
   - Daily and weekly focus statistics bar chart.
   - SuperMemo SM-2 spaced repetition revision queue for difficult topics.

9. **Notes & Academic Vault**
   - 3-column academic knowledge repository.
   - Folder taxonomy by semester, subject, and category (Class Notes, Formulas, Previous Papers).
   - High-fidelity KaTeX LaTeX mathematical equation rendering (derivatives, integrals, matrices, summations).

10. **Local AI Study Tutor (Ollama)**
    - Optional local LLM inference via Ollama (`http://localhost:11434`) using Llama 3.1, Qwen 2.5, or Mistral.
    - Zero cloud lock-in: files never leave your machine.
    - Graceful offline fallback: displays simulated academic derivations when Ollama is stopped.

11. **Settings & Data Sovereignty**
    - Student academic profile customization.
    - Semester configuration (all 8 semesters).
    - Portable JSON database export & restore.

---

## 🛠 Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom monochrome design system
- **Icons**: Lucide React
- **Data Visualizations**: Recharts
- **Mathematics**: KaTeX (LaTeX formula parsing)
- **Database**: SQLite (local `dev.db`)
- **ORM**: Prisma Client v5.22
- **Testing**: Vitest (16 unit tests for GPA, attendance, and timetable conflict math)

---

## 🚀 Quickstart & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database & Seed Sample Engineering Curriculum
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 3. Run Automated Tests
```bash
npx vitest run
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 🧠 Optional Local AI Setup (Ollama)

To use your local GPU/CPU for the AI Tutor:
```bash
# Start Ollama service
ollama serve

# Pull lightweight model (e.g., Llama 3.1 or Qwen 2.5)
ollama pull llama3.1
```
The AI Tutor will automatically detect the running instance and route questions locally!
