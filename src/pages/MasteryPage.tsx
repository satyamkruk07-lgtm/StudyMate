import React, { useState } from 'react';
import {
  BarChart3,
  Award,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  RotateCcw,
  BrainCircuit,
  Filter,
  Sparkles,
  ArrowRight,
  BookOpen,
  Info,
  HelpCircle,
  RefreshCw,
  Compass
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { BackendTopicMastery, BackendRecommendation } from '../types';

export const MasteryPage: React.FC = () => {
  const {
    masteryData,
    quizAttempts,
    backendMastery,
    backendRecommendations,
    backendAttempts,
    isLoadingMastery,
    refreshMasteryAndRecs,
    launchQuizWithConfig,
    setCurrentPage,
    apiMode
  } = useStudy();

  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Determine whether to use real backend data or fallback
  const isUsingBackend = apiMode === 'fastapi-connected' && backendMastery && backendMastery.length > 0;

  // Normalise display list
  const displayTopics = isUsingBackend
    ? backendMastery.map(bm => ({
        id: `topic-${bm.topic}`,
        topicName: bm.topic,
        category: bm.category || 'Core Curriculum',
        masteryPercentage: bm.mastery_percentage,
        questionsAttempted: bm.total_attempts,
        lastStudied: bm.last_attempt_at ? new Date(bm.last_attempt_at).toLocaleDateString() : 'Recent session',
        status: bm.status, // 'strong' | 'weak' | 'developing' | 'insufficient_history'
        recommendedAction:
          bm.status === 'insufficient_history'
            ? 'Complete 3+ questions to initialize reliable calibration'
            : bm.status === 'weak'
            ? 'Review source derivations and attempt targeted remediation'
            : bm.status === 'strong'
            ? 'Advance to higher difficulty proof-oriented questions'
            : 'Practice regular spaced-repetition intervals',
        trend: bm.trend,
        alpha: bm.alpha,
        beta: bm.beta,
        isLive: true
      }))
    : masteryData.map(m => ({
        id: m.id,
        topicName: m.topicName,
        category: m.category,
        masteryPercentage: m.masteryPercentage,
        questionsAttempted: m.questionsAttempted,
        lastStudied: m.lastStudied,
        status: m.status as string,
        recommendedAction: m.recommendedAction,
        trend: m.trend,
        alpha: 2,
        beta: 2,
        isLive: false
      }));

  const filteredTopics = displayTopics.filter(t => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  const strongTopics = displayTopics.filter(t => t.status === 'strong');
  const weakTopics = displayTopics.filter(t => t.status === 'weak');
  const uncalibratedTopics = displayTopics.filter(t => t.status === 'insufficient_history');

  const avgMastery = Math.round(
    displayTopics.reduce((acc, t) => acc + t.masteryPercentage, 0) / (displayTopics.length || 1)
  );

  const getStatusBadge = (status: string, pct: number) => {
    if (status === 'strong') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Strong ({pct}%)</span>
        </span>
      );
    }
    if (status === 'weak') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <span>Needs Review ({pct}%)</span>
        </span>
      );
    }
    if (status === 'insufficient_history') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          <HelpCircle className="w-3 h-3 text-slate-400" />
          <span>Insufficient History ({pct}%)</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
        <TrendingUp className="w-3 h-3 text-sky-400" />
        <span>Developing ({pct}%)</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner explaining Bayesian Model & Data Status */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            {isUsingBackend ? (
              <>
                <strong className="text-white">Live Bayesian Beta-Binomial Calibration Active:</strong> Prior Beta(2,2) updated dynamically per recorded attempt (alpha + correct, beta + incorrect).
              </>
            ) : (
              <>
                <strong className="text-amber-300">Displaying Demo Baseline Telemetry:</strong> Complete an adaptive quiz to initialize live Bayesian Beta-Binomial tracking on real course materials.
              </>
            )}
          </span>
        </div>

        <button
          onClick={() => refreshMasteryAndRecs()}
          disabled={isLoadingMastery}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs self-start sm:self-auto font-mono shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMastery ? 'animate-spin' : ''}`} />
          <span>Sync Backend</span>
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Mastery Gauge Card */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mean Topic Mastery
            </span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{avgMastery}%</span>
            <span className="text-xs text-emerald-400 font-semibold font-mono">
              {isUsingBackend ? 'Bayesian Expected Mean' : '+6.5% benchmark'}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-sky-400 h-2 rounded-full"
              style={{ width: `${avgMastery}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Tracked across {displayTopics.length} indexed topics
          </p>
        </div>

        {/* Strong Topics */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Strong Topics (≥ 75%)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {strongTopics.length} <span className="text-base text-slate-500 font-normal">/ {displayTopics.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {strongTopics.length > 0 ? (
              strongTopics.slice(0, 3).map(t => (
                <span
                  key={t.id}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                >
                  {t.topicName}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-500">None yet (requires consistent performance)</span>
            )}
          </div>
        </div>

        {/* Weak Topics Alert */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-rose-500/30 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Weak Topics (&lt; 60%)
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {weakTopics.length} <span className="text-base text-slate-500 font-normal">Action Required</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {weakTopics.length > 0 ? (
              weakTopics.map(t => (
                <span
                  key={t.id}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20"
                >
                  {t.topicName}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-500">No weak topics detected</span>
            )}
          </div>
        </div>
      </div>

      {/* Real Personalized Recommendations from Backend */}
      {backendRecommendations && backendRecommendations.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-white">History-Grounded Personalized Recommendations</h3>
            </div>
            <span className="text-xs text-slate-400">Generated from measured assessment logs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {backendRecommendations.map(rec => (
              <div
                key={rec.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-sky-400" />
                      {rec.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        rec.priority === 'high'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {rec.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{rec.action}</p>
                  <p className="text-[10px] text-slate-400 italic">
                    <strong>Reason:</strong> {rec.reason}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Target: {rec.recommended_difficulty}
                  </span>
                  <button
                    onClick={() =>
                      launchQuizWithConfig({
                        topic: rec.topic,
                        difficulty: rec.recommended_difficulty
                      })
                    }
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 shadow-sm"
                  >
                    Start Session →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic-Wise Progress Table & Visualizer */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-white tracking-tight">Topic Competency Breakdown</h3>
            <p className="text-xs text-slate-400">
              Posterior Beta-Binomial distributions dynamically updated via quiz performance
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {['all', 'strong', 'developing', 'weak', 'insufficient_history'].map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize transition-colors ${
                  filterStatus === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* List of topic progress bars */}
        <div className="space-y-3.5">
          {filteredTopics.map(topic => (
            <div
              key={topic.id}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      topic.status === 'strong'
                        ? 'bg-emerald-400'
                        : topic.status === 'weak'
                        ? 'bg-rose-400'
                        : topic.status === 'insufficient_history'
                        ? 'bg-slate-500'
                        : 'bg-sky-400'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-100">{topic.topicName}</h4>
                      {topic.isLive && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          Beta({topic.alpha}, {topic.beta})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {topic.category} • {topic.questionsAttempted} attempts recorded • Last: {topic.lastStudied}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {getStatusBadge(topic.status, topic.masteryPercentage)}
                  <button
                    onClick={() =>
                      launchQuizWithConfig({
                        topic: topic.topicName
                      })
                    }
                    className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Quiz on this topic"
                  >
                    <BrainCircuit className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Visual mastery progress bar */}
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    topic.status === 'strong'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : topic.status === 'weak'
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                      : topic.status === 'insufficient_history'
                      ? 'bg-slate-600'
                      : 'bg-gradient-to-r from-sky-500 to-indigo-400'
                  }`}
                  style={{ width: `${topic.masteryPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>{topic.recommendedAction}</span>
                <span className="font-mono text-slate-300">{topic.masteryPercentage}% / 100%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning & Quiz Attempt History */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-base text-white tracking-tight">Quiz & Assessment History</h3>
          </div>
          <span className="text-xs text-slate-400">
            {backendAttempts.length || quizAttempts.length} Total Sessions Recorded
          </span>
        </div>

        <div className="space-y-3">
          {(backendAttempts.length > 0 ? backendAttempts : quizAttempts).length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No quiz attempts recorded yet. Take an adaptive quiz to start logging mastery data!
            </div>
          ) : (
            (backendAttempts.length > 0 ? backendAttempts : quizAttempts).map((att: any) => (
              <div
                key={att.attempt_id || att.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-200">{att.topic}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 font-mono">
                      {att.difficulty}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Completed: {att.completed_at || att.completedAt}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {att.correct_answers ?? att.correctAnswers} of {att.total_questions ?? att.totalQuestions} questions
                    correct • {att.time_spent_seconds ?? att.timeSpentSeconds}s duration
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <span
                    className={`font-mono text-base font-extrabold ${
                      (att.score_percentage ?? att.scorePercentage) >= 70 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {att.score_percentage ?? att.scorePercentage}%
                  </span>

                  <button
                    onClick={() =>
                      launchQuizWithConfig({
                        topic: att.topic,
                        difficulty: att.difficulty
                      })
                    }
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <span>Retake</span>
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
