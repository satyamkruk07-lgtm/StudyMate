import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Bot,
  BrainCircuit,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { StatCards } from '../components/dashboard/StatCards';
import { WeeklyChart } from '../components/dashboard/WeeklyChart';
import { WeakTopicAlerts } from '../components/dashboard/WeakTopicAlerts';
import { RecommendedLessons } from '../components/dashboard/RecommendedLessons';
import { RecentActivity } from '../components/dashboard/RecentActivity';

export const DashboardPage: React.FC = () => {
  const { setCurrentPage, launchQuizWithConfig } = useStudy();

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#111936] via-[#0f172a] to-[#131d38] border border-indigo-500/20 shadow-xl overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> IIT Mandi Hackathon 2026 • Track D
              </span>
              <span className="text-xs text-slate-400 font-mono">Multimodal AI & Personalized Tutoring</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-300">Satyam</span>
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
              <span>Ask Source-Grounded Tutor</span>
            </button>

            <button
              onClick={() =>
                launchQuizWithConfig({
                  topic: 'Transformers & LLMs',
                  difficulty: 'Intermediate'
                })
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-xs transition-all"
            >
              <BrainCircuit className="w-4 h-4 text-sky-400" />
              <span>Quick Adaptive Quiz</span>
            </button>
          </div>
        </div>
      </div>

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
