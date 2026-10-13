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
  const { masteryData, resources, streakDays, totalStudyHours } = useStudy();

  const totalTopics = masteryData.length;
  const strongTopics = masteryData.filter(m => m.status === 'strong').length;
  const weakTopics = masteryData.filter(m => m.status === 'weak').length;
  const avgMastery = totalTopics > 0
    ? Math.round(masteryData.reduce((acc, m) => acc + m.masteryPercentage, 0) / totalTopics)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Overall Mastery */}
      <div className="p-4 rounded-2xl bg-[#0a0e17] border border-slate-800 hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Overall Mastery</span>
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">{avgMastery}%</span>
          {totalTopics > 0 ? (
            <span className="text-xs font-mono font-medium text-teal-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Live Bayesian
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-mono">Uncalibrated</span>
          )}
        </div>
        <div className="mt-3 w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${avgMastery}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-400 font-mono">
          {totalTopics > 0 ? `Based on ${totalTopics} core topics` : 'Complete a quiz to initialize calibration'}
        </p>
      </div>

      {/* 2. Topics Mastered */}
      <div className="p-4 rounded-2xl bg-[#0a0e17] border border-slate-800 hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Topics Mastered</span>
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
            <BrainCircuit className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">
            {strongTopics} <span className="text-base font-normal text-slate-500">/ {totalTopics}</span>
          </span>
          {weakTopics > 0 && (
            <span className="text-[11px] font-mono font-medium text-amber-400 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-3 h-3" /> {weakTopics} review
            </span>
          )}
        </div>
        <div className="mt-3 text-xs text-slate-400 flex items-center justify-between font-mono">
          <span>Target: 100% mastery</span>
          <span className="font-semibold text-slate-300">
            {totalTopics > 0 ? Math.round((strongTopics / totalTopics) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* 3. Study Streak / Days Active */}
      <div className="p-4 rounded-2xl bg-[#0a0e17] border border-slate-800 hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Study Streak</span>
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
            <Flame className={`w-4 h-4 ${streakDays > 0 ? 'fill-teal-400 text-teal-400' : 'text-slate-500'}`} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">{streakDays}</span>
          <span className="text-xs font-medium text-teal-300 font-mono">
            {streakDays === 1 ? 'Day Active' : 'Days Active'}
          </span>
        </div>
        <p className="mt-3 text-xs text-slate-400 font-mono">
          {streakDays === 0
            ? 'Start a quiz to begin tracking'
            : streakDays === 1
            ? '1 active study day recorded'
            : `${streakDays} days active streak`}
        </p>
      </div>

      {/* 4. Total Study Time & Resources */}
      <div className="p-4 rounded-2xl bg-[#0a0e17] border border-slate-800 hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Indexed Materials</span>
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">{resources.length}</span>
          <span className="text-xs text-slate-400 font-mono">
            docs ({resources.reduce((sum, r) => sum + r.chunkCount, 0)} chunks)
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{totalStudyHours.toFixed(1)} hrs studied total</span>
        </div>
      </div>
    </div>
  );
};
