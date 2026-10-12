import React from 'react';
import {
  Flame,
  Award,
  BookOpen,
  Clock,
  TrendingUp,
  BrainCircuit,
  AlertTriangle
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

export const StatCards: React.FC = () => {
  const { masteryData, resources, quizAttempts, streakDays, totalStudyHours } = useStudy();

  const strongTopics = masteryData.filter(m => m.status === 'strong').length;
  const weakTopics = masteryData.filter(m => m.status === 'weak').length;
  const avgMastery = Math.round(
    masteryData.reduce((acc, m) => acc + m.masteryPercentage, 0) / (masteryData.length || 1)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Overall Mastery */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Mastery</span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{avgMastery}%</span>
          <span className="text-xs font-medium text-emerald-400 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> +4.2%
          </span>
        </div>
        <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-sky-400 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${avgMastery}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Based on {masteryData.length} core course topics</p>
      </div>

      {/* 2. Topics Mastered */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Topics Mastered</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <BrainCircuit className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            {strongTopics} <span className="text-base font-normal text-slate-500">/ {masteryData.length}</span>
          </span>
          {weakTopics > 0 && (
            <span className="text-[11px] font-medium text-amber-400 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-3 h-3" /> {weakTopics} need review
            </span>
          )}
        </div>
        <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
          <span>Target: 100% by finals</span>
          <span className="font-semibold text-slate-300">{Math.round((strongTopics / (masteryData.length || 1)) * 100)}%</span>
        </div>
      </div>

      {/* 3. Study Streak */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Study Streak</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Flame className="w-4 h-4 fill-amber-400" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{streakDays}</span>
          <span className="text-xs font-medium text-amber-300">Days Active</span>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Personal Best: <strong className="text-slate-200">14 days</strong>
        </p>
      </div>

      {/* 4. Total Study Time & Resources */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Indexed Materials</span>
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{resources.length}</span>
          <span className="text-xs text-slate-400">documents ({resources.reduce((sum, r) => sum + r.chunkCount, 0)} chunks)</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{totalStudyHours} hrs studied this week</span>
        </div>
      </div>
    </div>
  );
};
