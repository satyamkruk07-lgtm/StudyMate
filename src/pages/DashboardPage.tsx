import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Bot,
  BrainCircuit,
  GraduationCap,
  ShieldCheck,
  School,
  Building2,
  UserCheck,
  BookOpen,
  Plus,
  CheckCircle2,
  Settings,
  UploadCloud
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

  const studentName = user?.name || 'Satyam';
  const subjects = profile?.selected_subjects || ['Machine Learning & AI', 'Neural Networks', 'Attention Models'];

  const getEducationBadge = () => {
    if (!profile) {
      return {
        icon: <Building2 className="w-3.5 h-3.5 text-sky-400" />,
        label: 'College Student • B.Tech (3rd Year)',
        color: 'bg-sky-500/10 text-sky-300 border-sky-500/20'
      };
    }
    if (profile.education_level === 'school') {
      return {
        icon: <School className="w-3.5 h-3.5 text-indigo-400" />,
        label: `School Student • ${profile.grade_or_course} (${profile.board_or_specialization || 'CBSE'}${profile.state ? ` - ${profile.state}` : ''})`,
        color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
      };
    }
    if (profile.education_level === 'self') {
      return {
        icon: <UserCheck className="w-3.5 h-3.5 text-purple-400" />,
        label: `Self-Learner • ${profile.board_or_specialization || 'AI & Machine Learning'}`,
        color: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
      };
    }
    return {
      icon: <Building2 className="w-3.5 h-3.5 text-sky-400" />,
      label: `College Student • ${profile.grade_or_course} ${profile.board_or_specialization ? `(${profile.board_or_specialization})` : ''} ${profile.academic_year ? `• ${profile.academic_year}` : ''}`,
      color: 'bg-sky-500/15 text-sky-300 border-sky-500/30'
    };
  };

  const badgeInfo = getEducationBadge();

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#111936] via-[#0f172a] to-[#131d38] border border-indigo-500/20 shadow-xl overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> IIT Mandi Hackathon 2026 • Track D
              </span>

              {/* Education Stage Pill */}
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border flex items-center gap-1.5 ${badgeInfo.color}`}>
                {badgeInfo.icon}
                <span>{badgeInfo.label}</span>
              </span>

              {profile?.preferred_language && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                  Lang: {profile.preferred_language}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-300">{studentName}</span>
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Your personalized adaptive study companion is ready. Review source-grounded materials, test weak-topic retention with calibrated smart quizzes, or inspect your verifiable mastery roadmap.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCurrentPage('tutor')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Bot className="w-4 h-4" />
              <span>Ask {activeSubject ? activeSubject : 'Source-Grounded'} Tutor</span>
            </button>

            <button
              onClick={() =>
                launchQuizWithConfig({
                  topic: activeSubject || 'Transformers & LLMs',
                  difficulty: 'Intermediate'
                })
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-xs transition-all"
            >
              <BrainCircuit className="w-4 h-4 text-sky-400" />
              <span>Quick Adaptive Quiz</span>
            </button>

            <button
              onClick={() => setCurrentPage('onboarding')}
              title="Edit Education Profile & Subjects"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#0d1428] border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Enrolled Subjects ({subjects.length})</span>
            {activeSubject && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-normal">
                Filtering by: {activeSubject}
              </span>
            )}
          </div>
          <button
            onClick={() => setCurrentPage('onboarding')}
            className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
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
                ? 'bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
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
                    ? 'bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State for Materials */}
      {resources.length === 0 && (
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-dashed border-slate-700 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-white">No Learning Materials Uploaded Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload your syllabus textbooks, slides (PDF, PPTX, TXT), or lecture videos in the Learning Library to generate grounded quizzes and chat with citations.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('library')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all inline-flex items-center gap-2"
          >
            <span>Open Learning Library</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Stat Cards */}
      <StatCards />

      {/* Weak-Topic Alerts */}
      <WeakTopicAlerts />

      {/* Charts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>

      {/* Recommended Next Lessons */}
      <RecommendedLessons />
    </div>
  );
};
