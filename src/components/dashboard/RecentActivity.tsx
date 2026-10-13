import React from 'react';
import {
  Clock,
  BrainCircuit,
  BookOpen,
  Bot,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

export const RecentActivity: React.FC = () => {
  const { quizAttempts, resources, chatMessages, setCurrentPage } = useStudy();

  // Combine recent items
  const recentActivities = [
    ...quizAttempts.slice(0, 3).map(att => ({
      id: `act-quiz-${att.id}`,
      type: 'quiz' as const,
      title: `Completed ${att.topic} Quiz`,
      subtitle: `Score: ${att.correctAnswers}/${att.totalQuestions} (${att.scorePercentage}%) • ${att.difficulty} difficulty`,
      timestamp: att.completedAt,
      isSuccess: att.scorePercentage >= 70
    })),
    ...resources.slice(0, 2).map(res => ({
      id: `act-res-${res.id}`,
      type: 'resource' as const,
      title: `Indexed ${res.title}`,
      subtitle: `${res.chunkCount} vector chunks vectorized (${res.fileType.toUpperCase()})`,
      timestamp: res.uploadDate,
      isSuccess: res.status === 'ready'
    })),
    ...chatMessages.filter(m => m.sender === 'student').slice(-2).map(msg => ({
      id: `act-chat-${msg.id}`,
      type: 'chat' as const,
      title: `Asked AI Tutor: "${msg.text.slice(0, 48)}..."`,
      subtitle: 'Source-grounded retrieval against active course library',
      timestamp: msg.timestamp,
      isSuccess: true
    }))
  ].slice(0, 5);

  return (
    <div className="p-5 rounded-2xl bg-[#0a0e17] border border-slate-800 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Recent Activity</h3>
              <p className="text-xs text-slate-400">Audit trail of learning milestones</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentPage('mastery')}
            className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 font-mono transition-colors"
          >
            History <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 font-mono">
              No recent activity recorded yet.
            </div>
          ) : (
            recentActivities.map(act => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-[#0d121c] border border-slate-800/80 hover:border-slate-700/80 transition-colors"
              >
                <div className="p-2 rounded-lg bg-slate-900 shrink-0 mt-0.5 border border-slate-800">
                  {act.type === 'quiz' ? (
                    <BrainCircuit className="w-4 h-4 text-teal-400" />
                  ) : act.type === 'resource' ? (
                    <BookOpen className="w-4 h-4 text-slate-300" />
                  ) : (
                    <Bot className="w-4 h-4 text-emerald-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-semibold text-xs text-slate-200 truncate">
                      {act.title}
                    </h5>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                      {act.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {act.subtitle}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="font-mono text-[11px]">Calibrated via live Bayesian updates</span>
        <button
          onClick={() => setCurrentPage('quiz')}
          className="text-teal-400 hover:text-teal-300 font-semibold text-[11px] font-mono transition-colors"
        >
          Take Quiz →
        </button>
      </div>
    </div>
  );
};
