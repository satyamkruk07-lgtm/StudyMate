import React from 'react';
import { AlertTriangle, ArrowRight, BrainCircuit, Sparkles, BookOpen } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

export const WeakTopicAlerts: React.FC = () => {
  const { masteryData, launchQuizWithConfig, setCurrentPage } = useStudy();

  const weakTopics = masteryData.filter(m => m.status === 'weak');

  if (masteryData.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[#0a0e17] border border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">No Topics Assessed Yet</h4>
            <p className="text-xs text-slate-400">Complete an adaptive quiz on your study materials to calibrate topics.</p>
          </div>
        </div>
        <button
          onClick={() => setCurrentPage('quiz')}
          className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-md shadow-teal-500/20"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  if (weakTopics.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[#0a0e17] border border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">All Topics in Good Standing</h4>
            <p className="text-xs text-slate-400">No high-priority weak topics detected. Keep maintaining consistency!</p>
          </div>
        </div>
        <button
          onClick={() => setCurrentPage('quiz')}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0e1320] hover:bg-slate-800 text-slate-200 border border-slate-700/70"
        >
          Explore All Topics
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-[#0a0e17] border border-amber-500/30 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Targeted Weak-Topic Alerts</h3>
            <p className="text-xs text-slate-400">Adaptive spaced-repetition triggers (&lt; 60% mastery)</p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
          {weakTopics.length} Action Items
        </span>
      </div>

      <div className="mt-3.5 space-y-3">
        {weakTopics.map(topic => (
          <div
            key={topic.id}
            className="p-3.5 rounded-xl bg-[#0d121c] border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-100">{topic.topicName}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                  {topic.masteryPercentage}% Mastery
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{topic.category}</span>
              </div>
              <p className="text-xs text-slate-400">
                {topic.recommendedAction}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() =>
                  launchQuizWithConfig({
                    topic: topic.topicName,
                    difficulty: 'Beginner'
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-sm shadow-teal-500/20 transition-all"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Practice Topic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
