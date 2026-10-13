import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Bot,
  BrainCircuit,
  ShieldCheck,
  School,
  Building2,
  UserCheck,
  BookOpen,
  Plus,
  CheckCircle2,
  Settings,
  UploadCloud,
  Library
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { StatCards } from '../components/dashboard/StatCards';
import { WeeklyChart } from '../components/dashboard/WeeklyChart';
import { WeakTopicAlerts } from '../components/dashboard/WeakTopicAlerts';
import { RecommendedLessons } from '../components/dashboard/RecommendedLessons';
import { RecentActivity } from '../components/dashboard/RecentActivity';

export const DashboardPage: React.FC = () => {
  const {
    user,
    profile,
    activeSubject,
    setActiveSubject,
    setCurrentPage,
    launchQuizWithConfig,
    resources
  } = useStudy();

  const [dashboardVideoError, setDashboardVideoError] = useState(false);

  const studentName = user?.name || 'Student';
  const subjects = profile?.selected_subjects || [
    'Machine Learning & AI',
    'Neural Networks',
    'Attention Models'
  ];

  // Specific education-level tailored message as specified
  const getPersonalizedWelcome = () => {
    if (!profile) {
      return {
        heading: "Welcome back. Let's make progress on your learning goals.",
        subtext: 'Your source-grounded companion is calibrated to your verified study materials.'
      };
    }
    if (profile.education_level === 'school') {
      return {
        heading: 'Welcome back. Ready to master your subjects?',
        subtext: `Targeting ${profile.grade_or_course || 'Class 10'} (${profile.board_or_specialization || 'CBSE'}) curriculum with step-by-step proofs and textbook citations.`
      };
    }
    if (profile.education_level === 'self') {
      return {
        heading: 'Welcome back. Continue your learning journey.',
        subtext: `Autonomous deep-dive path focused on ${profile.board_or_specialization || 'AI & Machine Learning'} with empirical Bayesian mastery tracking.`
      };
    }
    return {
      heading: "Welcome back. Let's make progress on your semester goals.",
      subtext: `Enrolled in ${profile.grade_or_course || 'B.Tech Computer Science'}${profile.academic_year ? ` • ${profile.academic_year}` : ''}${profile.semester ? ` (${profile.semester})` : ''}. Tackle slides, derivations, and practice exams.`
    };
  };

  const getEducationBadge = () => {
    if (!profile) {
      return {
        icon: <Building2 className="w-3.5 h-3.5 text-teal-400" />,
        label: 'College Student • B.Tech',
        color: 'bg-teal-500/10 text-teal-300 border-teal-500/25'
      };
    }
    if (profile.education_level === 'school') {
      return {
        icon: <School className="w-3.5 h-3.5 text-teal-400" />,
        label: `School Student • ${profile.grade_or_course} (${profile.board_or_specialization || 'CBSE'})`,
        color: 'bg-teal-500/10 text-teal-300 border-teal-500/25'
      };
    }
    if (profile.education_level === 'self') {
      return {
        icon: <UserCheck className="w-3.5 h-3.5 text-teal-400" />,
        label: `Self-Learner • ${profile.board_or_specialization || 'AI & Machine Learning'}`,
        color: 'bg-teal-500/10 text-teal-300 border-teal-500/25'
      };
    }
    return {
      icon: <Building2 className="w-3.5 h-3.5 text-teal-400" />,
      label: `College Student • ${profile.grade_or_course}${profile.academic_year ? ` • ${profile.academic_year}` : ''}`,
      color: 'bg-teal-500/10 text-teal-300 border-teal-500/25'
    };
  };

  const welcomeContent = getPersonalizedWelcome();
  const badgeInfo = getEducationBadge();

  return (
    <div className="space-y-6 pb-12">
      {/* 1. DEDICATED CINEMATIC WELCOME SECTION WITH 3D DASHBOARD VIDEO */}
      <div className="relative rounded-2xl bg-[#090d16] border border-slate-800 shadow-xl overflow-hidden">
        <div className="flex flex-col lg:flex-row items-stretch">
          {/* Left Content Area */}
          <div className="flex-1 p-6 sm:p-8 space-y-4 z-10 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-teal-500/10 text-teal-300 border border-teal-500/25 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-400" /> Track D • IIT Mandi 2026
                </span>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border flex items-center gap-1.5 ${badgeInfo.color}`}>
                  {badgeInfo.icon}
                  <span>{badgeInfo.label}</span>
                </span>

                {profile?.preferred_language && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    Lang: {profile.preferred_language}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  {welcomeContent.heading}
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  {welcomeContent.subtext}
                </p>
              </div>
            </div>

            {/* Quick Action Navigation Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setCurrentPage('tutor')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all"
              >
                <Bot className="w-4 h-4" />
                <span>Ask AI Tutor</span>
              </button>

              <button
                onClick={() =>
                  launchQuizWithConfig({
                    topic: activeSubject || subjects[0] || 'Neural Networks',
                    difficulty: 'Intermediate'
                  })
                }
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0e1320] hover:bg-slate-800 text-slate-200 border border-slate-700/70 font-semibold text-xs transition-all"
              >
                <BrainCircuit className="w-4 h-4 text-teal-400" />
                <span>Adaptive Quiz</span>
              </button>

              <button
                onClick={() => setCurrentPage('library')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0e1320] hover:bg-slate-800 text-slate-300 border border-slate-700/70 font-medium text-xs transition-all"
              >
                <Library className="w-4 h-4 text-slate-400" />
                <span>Library</span>
              </button>

              <button
                onClick={() => setCurrentPage('onboarding')}
                title="Edit Education Profile & Subjects"
                className="p-2.5 rounded-xl bg-[#0e1320] border border-slate-700/70 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right 3D Sphere Video Panel */}
          <div className="w-full lg:w-72 xl:w-80 h-48 lg:h-auto min-h-[190px] relative shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800/80 bg-[#070a12] flex items-center justify-center overflow-hidden">
            {!dashboardVideoError ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onError={() => setDashboardVideoError(true)}
                className="w-full h-full object-cover object-center pointer-events-none opacity-90"
                src="/videos/studymate-dashboard.mp4"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-950/20 to-transparent">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-2">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono text-slate-400">Adaptive Core Online</span>
              </div>
            )}
            {/* Subtle soft edge gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#090d16] via-transparent to-transparent pointer-events-none opacity-80" />
          </div>
        </div>
      </div>

      {/* 2. ENROLLED SUBJECTS FILTER BAR */}
      <div className="p-4 rounded-2xl bg-[#090d16] border border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-400" />
            <span>Enrolled Course Subjects ({subjects.length})</span>
            {activeSubject && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Filtered: {activeSubject}
              </span>
            )}
          </div>
          <button
            onClick={() => setCurrentPage('onboarding')}
            className="text-[11px] font-medium text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors font-mono"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manage Subjects</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setActiveSubject(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeSubject === null
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'bg-[#0d121c] text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            All Subjects
          </button>

          {subjects.map(sub => {
            const isSelected = activeSubject === sub;
            return (
              <button
                key={sub}
                onClick={() => setActiveSubject(isSelected ? null : sub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                    : 'bg-[#0d121c] text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. EMPTY STATE IF NO LEARNING MATERIALS */}
      {resources.length === 0 && (
        <div className="p-8 rounded-2xl bg-[#090d16] border border-dashed border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-white">No Learning Materials Ingested Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload your syllabus textbooks, slides (PDF, PPTX, TXT), or actual video lectures in the Learning Library to generate verified smart quizzes and chat with timestamp citations.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('library')}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all inline-flex items-center gap-2 shadow-lg shadow-teal-500/20"
          >
            <span>Open Learning Library</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. METRIC STAT CARDS (REAL DATABASE DATA) */}
      <StatCards />

      {/* 5. WEAK-TOPIC ALERTS */}
      <WeakTopicAlerts />

      {/* 6. CHARTS & ACTIVITY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>

      {/* 7. RECOMMENDED NEXT LESSONS */}
      <RecommendedLessons />
    </div>
  );
};
