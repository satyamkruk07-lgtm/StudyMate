import React, { useState } from 'react';
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
  UserCheck,
  Menu,
  X
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { EducationLevel } from '../types';

export const HomePage: React.FC = () => {
  const { setCurrentPage } = useStudy();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const handleStartPath = (level: EducationLevel) => {
    sessionStorage.setItem('studymate_selected_path', level);
    setCurrentPage('signup');
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col font-sans selection:bg-teal-500/20 selection:text-teal-200">
      {/* 1. MINIMAL PREMIUM NAVBAR OVER HERO */}
      <header className="sticky top-0 z-50 w-full bg-[#06090e]/80 backdrop-blur-xl border-b border-slate-800/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500/20 to-slate-800 border border-teal-500/30 flex items-center justify-center text-teal-300 group-hover:border-teal-400/60 transition-all">
              <GraduationCap className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">StudyMate</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 font-semibold border border-teal-500/25">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Adaptive Learning Companion
              </p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
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
            <button
              onClick={() => scrollToSection('learning-paths')}
              className="hover:text-white transition-colors"
            >
              Learning Paths
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setCurrentPage('login')}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
            >
              Login
            </button>
            <button
              onClick={() => setCurrentPage('signup')}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/20 transition-all hover:shadow-teal-500/30"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#090d16] border-b border-slate-800/80 px-4 py-5 space-y-3">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2 text-sm text-slate-300 hover:text-white"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2 text-sm text-slate-300 hover:text-white"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('learning-paths')}
              className="block w-full text-left py-2 text-sm text-slate-300 hover:text-white"
            >
              Learning Paths
            </button>
            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => setCurrentPage('login')}
                className="flex-1 py-2 text-xs text-center font-medium text-slate-200 bg-slate-900 border border-slate-700/60 rounded-lg"
              >
                Login
              </button>
              <button
                onClick={() => setCurrentPage('signup')}
                className="flex-1 py-2 text-xs text-center font-bold text-slate-950 bg-teal-500 rounded-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. CINEMATIC HERO SECTION WITH 3D SPHERE VIDEO */}
      <section className="relative min-h-[86vh] lg:min-h-[88vh] flex items-center overflow-hidden border-b border-slate-800/60">
        {/* Background 3D Video Asset */}
        {!videoError ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setVideoError(true)}
            className="absolute inset-0 w-full h-full object-cover object-right md:object-center pointer-events-none opacity-80"
            src="/videos/studymate-hero.mp4"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-950/20 via-[#0a0e17] to-[#06090e]" />
        )}

        {/* Sophisticated Dual Gradient Mask for Content Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#06090e] via-[#06090e]/85 to-transparent pointer-events-none md:w-3/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06090e] via-transparent to-[#06090e]/60 pointer-events-none" />

        {/* Foreground Content (Left Aligned, keeping 3D Sphere visible on Right) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 w-full">
          <div className="max-w-2xl space-y-7">
            {/* Eyebrow Label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider uppercase bg-teal-500/10 text-teal-300 border border-teal-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span>Personalized AI Learning</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05]">
              LEARN BEYOND <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-slate-100 to-slate-300">
                LIMITS.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              One intelligent learning companion for your subjects, study materials, practice, and personal growth.
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => setCurrentPage('signup')}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/20 hover:shadow-teal-500/35 transition-all transform hover:-translate-y-0.5"
              >
                <span>Start Learning</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection('features')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/70 font-semibold text-sm transition-all"
              >
                <span>Explore Features</span>
              </button>
            </div>

            {/* Grounding Telemetry Mini-Badge */}
            <div className="pt-4 flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 text-teal-400 font-mono">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>100% Source-Grounded</span>
              </div>
              <span className="text-slate-700">•</span>
              <div className="text-slate-400 font-mono">
                <span>Zero Hallucinations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LEARNING PATHS */}
      <section id="learning-paths" className="py-24 bg-[#090d16] border-b border-slate-800/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono font-semibold tracking-wider uppercase text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              Tailored Education Paths
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Calibrated to Your Academic Stage
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              StudyMate AI configures its explanation depth, rubric criteria, and question difficulty to match whether you are in school, completing college degree coursework, or upskilling independently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* School Learning */}
            <div className="p-7 rounded-2xl bg-[#0d121c] border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between group shadow-lg">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <School className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">School Learning</h3>
                <p className="text-xs font-mono text-teal-300">
                  Classes 1 to 12 • CBSE, ICSE, State Boards
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Clear, step-by-step conceptual foundations for school subjects. Practice textbook-grounded quizzes, identify weak chapters, and build exam confidence without rote memorization.
                </p>
                <div className="pt-2 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Board syllabus and grade-level alignment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Step-by-step mathematical proofs & definitions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Direct page citations from uploaded textbooks</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartPath('school')}
                className="mt-8 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/70 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <span>Select School Path</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* College Learning */}
            <div className="p-7 rounded-2xl bg-[#0d121c] border border-teal-500/30 hover:border-teal-400/60 transition-all flex flex-col justify-between group shadow-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-slate-950 font-bold text-[10px] uppercase font-mono tracking-wider px-3 py-0.5 rounded-full shadow-md">
                Most Popular
              </div>

              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">College Learning</h3>
                <p className="text-xs font-mono text-teal-300">
                  BCA, B.Tech, B.Sc., B.Com., B.A. & Graduate Degrees
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Grounded in actual university lecture slides, research papers, and technical transcripts. Tackle advanced formulas, numerical questions, code concepts, and semester exams.
                </p>
                <div className="pt-2 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Multi-slide PPTX & PDF lecture indexing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Multimodal lecture video timestamp citations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Subject-specific semester mastery tracking</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartPath('college')}
                className="mt-8 w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all"
              >
                <span>Select College Path</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Self-Learning */}
            <div className="p-7 rounded-2xl bg-[#0d121c] border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between group shadow-lg">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Self-Learning</h3>
                <p className="text-xs font-mono text-teal-300">
                  Upskilling, Certifications, Career Transition & Deep-Dives
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Goal-oriented autonomous study. Upload any documentation, whitepaper, or recorded course, and get targeted diagnostic probes, weakness detection, and custom revision.
                </p>
                <div className="pt-2 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Flexible, goal-driven topic organization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>No rigid schedules — learn at your own pace</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Empirical Bayesian mastery validation</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartPath('self')}
                className="mt-8 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/70 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <span>Select Self-Learner Path</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES */}
      <section id="features" className="py-24 bg-[#06090e] border-b border-slate-800/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono font-semibold tracking-wider uppercase text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for Authentic, Grounded Understanding
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Built to satisfy multimodal adaptive learning requirements: verifiable citations, empirical calibration, and zero hallucinations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-[#0a0e17] border border-slate-800/90 hover:border-slate-700 transition-all space-y-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 w-fit">
                <Bot className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">AI Tutor with Source Citations</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Asks and explains concepts with verbatim citations to specific pages, slides, or timestamps. If uploaded material lacks evidence, it explicitly refuses to fabricate.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-[#0a0e17] border border-slate-800/90 hover:border-slate-700 transition-all space-y-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 w-fit">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Adaptive Smart Quiz Generator</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generates calibrated Multiple Choice, Conceptual Short-Answer, and Numerical questions directly from retrieved text. Answer rubrics remain confidential until submission.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-[#0a0e17] border border-slate-800/90 hover:border-slate-700 transition-all space-y-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 w-fit">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Bayesian Topic Mastery Tracker</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Maintains a transparent Beta-Binomial posterior Beta(α, β) for each curriculum topic with an explicit neutral prior, updated after every graded attempt.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-[#0a0e17] border border-slate-800/90 hover:border-slate-700 transition-all space-y-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 w-fit">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Personalized Revision Recommendations</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Evaluates incorrect quiz responses to pinpoint misconceptions, advising immediate remedial steps and prerequisite revision based on measured history.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-[#0a0e17] border border-slate-800/90 hover:border-slate-700 transition-all space-y-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 w-fit">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">PDF, PPTX, TXT & Video Ingestion</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Drag-and-drop course slides, book chapters, typed lecture notes, and actual video files. Automatic parsing and chunking makes content instantly searchable.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-[#0a0e17] border border-slate-800/90 hover:border-slate-700 transition-all space-y-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 w-fit">
                <Video className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Timestamped Video Citations</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ingested lecture videos are chronologically parsed to extract concepts with exact timestamp markers (e.g. 04:12), grounding tutor explanations in actual video segments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-[#090d16] border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono font-semibold tracking-wider uppercase text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              Workflow Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How StudyMate AI Works
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              From raw course documents to continuous mastery, follow the 5-step learning cycle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold font-mono text-xs flex items-center justify-center mb-3">
                  01
                </div>
                <h4 className="text-sm font-bold text-white">Upload Materials</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Upload lecture slides, notes, or videos. Text and keyframes are extracted and chunked into indexed units.
                </p>
              </div>
              <div className="text-[11px] text-teal-400/90 font-mono">PDF, PPTX, Video</div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold font-mono text-xs flex items-center justify-center mb-3">
                  02
                </div>
                <h4 className="text-sm font-bold text-white">Ask AI Tutor</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Prompt the AI Tutor on specific topics. Only verified facts with verbatim citations are returned.
                </p>
              </div>
              <div className="text-[11px] text-teal-400/90 font-mono">100% Grounded</div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold font-mono text-xs flex items-center justify-center mb-3">
                  03
                </div>
                <h4 className="text-sm font-bold text-white">Practice</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Take dynamic quizzes covering your topics. Choose from MCQ, Short-Answer, and Numerical tests.
                </p>
              </div>
              <div className="text-[11px] text-teal-400/90 font-mono">Multi-Format</div>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold font-mono text-xs flex items-center justify-center mb-3">
                  04
                </div>
                <h4 className="text-sm font-bold text-white">Track Mastery</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Bayesian Beta-Binomial models update topic competence after each submission with transparent parameters.
                </p>
              </div>
              <div className="text-[11px] text-teal-400/90 font-mono">Empirical Beta(α, β)</div>
            </div>

            {/* Step 5 */}
            <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold font-mono text-xs flex items-center justify-center mb-3">
                  05
                </div>
                <h4 className="text-sm font-bold text-white">Improve</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Review diagnosed misconceptions, follow recommended revisions, and progress to advanced difficulty.
                </p>
              </div>
              <div className="text-[11px] text-teal-400/90 font-mono">Continuous Growth</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CALL TO ACTION */}
      <section className="py-24 bg-[#06090e] relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 sm:p-14 rounded-3xl bg-[#0b101b] border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Ready to Experience Adaptive AI Learning?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
                Create your personalized student profile in seconds, choose your learning path, and start practicing with verified, source-grounded materials.
              </p>
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setCurrentPage('signup')}
                  className="px-8 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/20 hover:shadow-teal-500/30 transition-all flex items-center gap-2"
                >
                  <span>Start Learning Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. MINIMAL REFINED FOOTER */}
      <footer className="border-t border-slate-800/60 bg-[#05080d] py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white">StudyMate AI</span>
              <p className="text-[11px] text-slate-500 font-mono">
                IIT Mandi Multimodal AI Hackathon 2026 • Track D
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">
              Features
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">
              How It Works
            </button>
            <button onClick={() => scrollToSection('learning-paths')} className="hover:text-white transition-colors">
              Learning Paths
            </button>
            <button onClick={() => setCurrentPage('login')} className="hover:text-white transition-colors">
              Student Login
            </button>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-500 space-y-1 font-mono">
            <div>Zero-Hallucination Adaptive AI Tutoring System</div>
            <div>© 2026 StudyMate AI. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
