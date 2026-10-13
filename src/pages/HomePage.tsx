import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Bot,
  BrainCircuit,
  GraduationCap,
  FileText,
  Video,
  CheckCircle2,
  BarChart3,
  ChevronRight,
  ShieldCheck,
  Target,
  School,
  Building2,
  UserCheck
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { EducationLevel } from '../types';

export const HomePage: React.FC = () => {
  const { setCurrentPage, guestLogin } = useStudy();

  const handleStartPath = (level: EducationLevel) => {
    guestLogin(level);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. PUBLIC NAVBAR */}
      <header className="sticky top-0 z-40 w-full bg-[#0a0f1d]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-white tracking-tight">StudyMate</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Adaptive Learning Companion
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <button
              onClick={() => scrollToSection('learning-paths')}
              className="hover:text-white transition-colors"
            >
              Learning Paths
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-white transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-white transition-colors"
            >
              How It Works
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage('login')}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
            >
              Login
            </button>
            <button
              onClick={() => setCurrentPage('signup')}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 sm:pt-24 pb-20 overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>IIT Mandi Multimodal AI Hackathon 2026 • Track D</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Your Education. Your Goals.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">
              Your AI Study Companion.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            From school classrooms to college lectures, StudyMate AI helps you understand concepts, practice questions, track your progress, and learn at your own pace.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage('signup')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all transform hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm transition-all"
            >
              <span>Explore Features</span>
            </button>
            <button
              onClick={() => guestLogin('college')}
              className="px-5 py-3.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700/50 transition-all"
            >
              Try Instant Demo
            </button>
          </div>

          {/* Product Dashboard Preview Mockup */}
          <div className="mt-16 max-w-5xl mx-auto rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-indigo-500/20 to-slate-800/40 border border-slate-700/80 shadow-2xl backdrop-blur-xl">
            <div className="rounded-xl bg-[#0b1329] border border-slate-800 p-4 sm:p-6 text-left space-y-6">
              {/* Window Controls & Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">studymate-platform.app/dashboard</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Source-Grounded Verification Active</span>
                </div>
              </div>

              {/* Mockup Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tutor Grounded Card */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                      <Bot className="w-4 h-4" /> AI Tutor Response
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Grounded
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    "In deep hierarchical networks, the scaled dot-product attention computes A(Q,K,V) = softmax(Q K^T / √d_k) V. Scaling avoids vanishing gradients."
                  </p>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="truncate">Attention Is All You Need • Page 4, §3.2</span>
                    <span className="text-sky-400 font-mono">0.96 score</span>
                  </div>
                </div>

                {/* Adaptive Smart Quiz Card */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                      <BrainCircuit className="w-4 h-4" /> Smart Quiz Generation
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Intermediate
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 font-medium">
                    Question 3: Why does scaled dot-product attention divide by √d_k?
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="p-1.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-200">
                      ✓ Prevents softmax gradients from vanishing in high dimensions
                    </div>
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800/80">
                      ✗ To increase the parameter count of matrices
                    </div>
                  </div>
                </div>

                {/* Bayesian Beta-Binomial Mastery Card */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4" /> Bayesian Mastery
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Beta(α, β)</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Transformers & Attention</span>
                        <span className="text-emerald-400 font-mono font-bold">87.5%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-[87.5%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Adam Moment Calibration</span>
                        <span className="text-amber-400 font-mono font-bold">58.3%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full w-[58.3%]" />
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    Recommendation: Practice 3 diagnostic questions on Adam bias correction.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LEARNING PATHS */}
      <section id="learning-paths" className="py-20 bg-[#090e1c] border-t border-slate-800/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold tracking-wider uppercase text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
              Personalized Learning Paths
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Adapted to Your Exact Educational Stage
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              StudyMate AI configures its questions, explanation depth, and study guidance to fit whether you are in school, pursuing a college degree, or mastering new skills independently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* School Learning */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#111936] to-[#0c1224] border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between group shadow-lg">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <School className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">School Learning</h3>
                <p className="text-xs font-semibold text-indigo-300">
                  Classes 1 to 12 • CBSE, ICSE, State Boards
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Clear, step-by-step conceptual foundations for school subjects. Practice textbook-grounded quizzes, identify weak chapters, and build exam confidence without memorization shortcuts.
                </p>
                <div className="pt-2 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Board syllabus and grade-level alignment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Step-by-step mathematical proofs & definitions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Direct page citations from uploaded textbooks</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartPath('school')}
                className="mt-8 w-full py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <span>Select School Path</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* College Learning */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#111936] to-[#0c1224] border border-sky-500/30 hover:border-sky-500/50 transition-all flex flex-col justify-between group shadow-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                Most Popular
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">College Learning</h3>
                <p className="text-xs font-semibold text-sky-300">
                  BCA, B.Tech, B.Sc., B.Com., B.A. & Graduate Degrees
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Grounded in actual university lecture slides, research papers, and technical transcripts. Tackle advanced formulas, numerical questions, code concepts, and semester exams.
                </p>
                <div className="pt-2 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Multi-slide PPTX & PDF lecture indexing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Multimodal lecture video timestamp citations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Subject-specific semester mastery tracking</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartPath('college')}
                className="mt-8 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25 transition-all"
              >
                <span>Select College Path</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Self-Learning */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#111936] to-[#0c1224] border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-lg">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Self-Learning</h3>
                <p className="text-xs font-semibold text-purple-300">
                  Upskilling, Certifications, Career Transition & Deep-Dives
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Goal-oriented autonomous study. Upload any documentation, whitepaper, or recorded course, and get targeted diagnostic probes, weakness detection, and custom revision.
                </p>
                <div className="pt-2 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Flexible, goal-driven topic organization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>No rigid schedules — learn at your own pace</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Empirical Bayesian mastery validation</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartPath('self')}
                className="mt-8 w-full py-2.5 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <span>Select Self-Learner Path</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold tracking-wider uppercase text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for Authentic, Grounded Understanding
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Built specifically to address the core requirements of Multimodal Adaptive Learning: strict source attribution, calibration, and zero hallucinations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 w-fit">
                <Bot className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">AI Tutor with Source Citations</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Asks and explains concepts with verbatim citations to specific pages, slides, or timestamps. If uploaded material lacks evidence, it refuses to fabricate.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 w-fit">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Adaptive Smart Quiz Generator</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generates calibrated Multiple Choice, Conceptual Short-Answer, and Numerical questions directly from retrieved text. Answers remain confidential until submission.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 w-fit">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Bayesian Topic Mastery Tracker</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Maintains a transparent Beta-Binomial posterior Beta(α, β) for each curriculum topic with an explicit neutral prior, updated after every graded attempt.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 w-fit">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Personalized Revision Recommendations</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Evaluates incorrect quiz responses to pinpoint misconceptions, advising immediate remedial steps and prerequisite revision based on measured history.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 w-fit">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">PDF, PPTX, TXT & Video Ingestion</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Drag-and-drop course slides, book chapters, typed lecture notes, and actual video files. Automatic parsing and chunking makes content instantly searchable.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 w-fit">
                <Video className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Timestamped Lecture Video References</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ingested videos are analyzed chronologically to extract visual keyframes and concepts, attaching exact timestamp markers (e.g. 04:12) to all generated tutor citations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-[#090e1c] border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Workflow Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How StudyMate AI Works
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              From raw course documents to continuous mastery, follow the 5-step learning cycle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center mb-3">
                  01
                </div>
                <h4 className="text-sm font-bold text-white">Upload Materials</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Upload lecture slides, notes, or videos. Text and keyframes are extracted and chunked locally.
                </p>
              </div>
              <div className="text-[11px] text-indigo-300 font-mono">PDF, PPTX, Video</div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center mb-3">
                  02
                </div>
                <h4 className="text-sm font-bold text-white">Ask Questions</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Prompt the AI Tutor on specific topics. Only verified facts with verbatim citations are returned.
                </p>
              </div>
              <div className="text-[11px] text-sky-300 font-mono">100% Grounded</div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center mb-3">
                  03
                </div>
                <h4 className="text-sm font-bold text-white">Practice</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Take dynamic quizzes covering your weak topics. Choose from MCQ, Short-Answer, and Numerical tests.
                </p>
              </div>
              <div className="text-[11px] text-purple-300 font-mono">Multi-Format</div>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center mb-3">
                  04
                </div>
                <h4 className="text-sm font-bold text-white">Track Mastery</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Bayesian Beta-Binomial models update topic competence after each submission with no black-box scores.
                </p>
              </div>
              <div className="text-[11px] text-amber-300 font-mono">Empirical Updates</div>
            </div>

            {/* Step 5 */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center mb-3">
                  05
                </div>
                <h4 className="text-sm font-bold text-white">Improve</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Review misconceptions, follow recommended revisions, and progress to advanced difficulty.
                </p>
              </div>
              <div className="text-[11px] text-emerald-300 font-mono">Continuous Growth</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA BANNER */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-slate-900 to-sky-900/40 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Ready to Experience Adaptive AI Learning?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
                Create your personalized student profile in seconds, choose your learning path, and start practicing with verified, source-grounded materials.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => setCurrentPage('signup')}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  <span>Get Started Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => guestLogin('college')}
                  className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 text-sm font-semibold transition-all"
                >
                  Explore Demo Platform
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. POLISHED FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#070b16] py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white">StudyMate AI</span>
              <p className="text-[11px] text-slate-400">
                IIT Mandi Multimodal AI Hackathon 2026 • Track D
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs">
            <button onClick={() => scrollToSection('learning-paths')} className="hover:text-white transition-colors">
              Learning Paths
            </button>
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">
              Features
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">
              How It Works
            </button>
            <button onClick={() => setCurrentPage('login')} className="hover:text-white transition-colors">
              Student Login
            </button>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-400 space-y-1">
            <div>Zero-Hallucination Adaptive AI Tutoring System</div>
            <div className="text-slate-400 font-mono">© 2026 StudyMate AI. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
