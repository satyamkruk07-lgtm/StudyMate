import React, { useState, useMemo } from 'react';
import { BarChart2, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

export const WeeklyChart: React.FC = () => {
  const { quizAttempts, backendAttempts } = useStudy();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute trailing 7-day activity dynamically from real attempts
  const daysData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = dayNames[d.getDay()];

      let dailySeconds = 0;
      let dailyQuestions = 0;
      let dailyCorrect = 0;
      const seen = new Set<string>();

      backendAttempts.forEach(a => {
        const aDate = (a.completed_at || a.completedAt || '').slice(0, 10);
        if (aDate === dateStr) {
          if (a.id) seen.add(a.id);
          dailySeconds += (a.time_spent_seconds || 0);
          dailyQuestions += (a.total_questions || 0);
          dailyCorrect += (a.correct_answers || 0);
        }
      });

      quizAttempts.forEach(a => {
        const aDate = (a.completedAt || '').slice(0, 10);
        if (aDate === dateStr && !seen.has(a.id)) {
          dailySeconds += (a.timeSpentSeconds || 0);
          dailyQuestions += (a.totalQuestions || 0);
          dailyCorrect += (a.correctAnswers || 0);
        }
      });

      const hours = dailySeconds > 0 ? Math.max(0.1, Math.round((dailySeconds / 3600) * 10) / 10) : 0;
      const accuracy = dailyQuestions > 0 ? Math.round((dailyCorrect / dailyQuestions) * 100) : 0;

      result.push({
        day: dayName,
        date: dateStr,
        hours,
        questions: dailyQuestions,
        accuracy,
        correct: dailyCorrect
      });
    }

    return result;
  }, [backendAttempts, quizAttempts]);

  const maxHours = Math.max(...daysData.map(d => d.hours), 0.5);
  const totalWeeklyHours = daysData.reduce((sum, d) => sum + d.hours, 0).toFixed(1);
  const totalQuestions = daysData.reduce((sum, d) => sum + d.questions, 0);
  const totalCorrect = daysData.reduce((sum, d) => sum + d.correct, 0);
  const avgAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Format date range string (e.g., "Oct 7 – Oct 13")
  const dateRangeStr = useMemo(() => {
    if (daysData.length < 2) return 'This Week';
    const start = new Date(daysData[0].date);
    const end = new Date(daysData[daysData.length - 1].date);
    const format = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${format(start)} – ${format(end)}`;
  }, [daysData]);

  // Peak study day
  const peakDay = useMemo(() => {
    const withActivity = daysData.filter(d => d.hours > 0);
    if (withActivity.length === 0) return null;
    return withActivity.reduce((max, d) => (d.hours > max.hours ? d : max), withActivity[0]);
  }, [daysData]);

  return (
    <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Weekly Learning Progress</h3>
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                {dateRangeStr}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Real-time study hours & quiz calibration</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <div className="text-[11px] text-slate-400">Total Hours</div>
              <div className="font-bold text-white font-mono">{totalWeeklyHours}h</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400">Avg Accuracy</div>
              <div className="font-bold text-emerald-400 font-mono">{avgAccuracy}%</div>
            </div>
          </div>
        </div>

        {/* Bar visualizer */}
        <div className="mt-6 h-48 flex items-end justify-between gap-2 sm:gap-4 px-2">
          {daysData.map((item, idx) => {
            const heightPercent = item.hours > 0 ? Math.round((item.hours / maxHours) * 100) : 4;
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.date}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-16 z-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 shadow-xl text-center whitespace-nowrap pointer-events-none">
                    <div className="text-[11px] font-bold text-white">{item.day} ({item.date.slice(5)})</div>
                    <div className="text-[10px] text-sky-400">{item.hours}h studied • {item.questions} questions</div>
                    <div className="text-[10px] text-emerald-400">{item.accuracy}% accuracy</div>
                  </div>
                )}

                {/* Hours pill */}
                <span
                  className={`text-[10px] mb-1 font-mono transition-opacity ${
                    item.hours > 0
                      ? isHovered
                        ? 'text-indigo-300 font-bold opacity-100'
                        : 'text-slate-400 opacity-90'
                      : 'text-slate-600 opacity-50'
                  }`}
                >
                  {item.hours > 0 ? `${item.hours}h` : '0h'}
                </span>

                {/* Animated bar */}
                <div className="w-full max-w-[36px] bg-slate-800/50 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      item.hours > 0
                        ? isHovered
                          ? 'bg-gradient-to-t from-indigo-600 via-indigo-500 to-sky-400 shadow-lg shadow-indigo-500/30'
                          : 'bg-gradient-to-t from-indigo-900/90 via-indigo-700 to-indigo-500'
                        : 'bg-slate-800'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* Day label */}
                <span
                  className={`mt-2 text-xs font-medium transition-colors ${
                    isHovered ? 'text-sky-300 font-bold' : item.hours > 0 ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        {peakDay ? (
          <span className="flex items-center gap-1.5 text-slate-300">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Peak study session on {peakDay.day} ({peakDay.hours}h • {peakDay.questions} questions)</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-slate-500">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>No study activity recorded this week. Complete quizzes to log hours.</span>
          </span>
        )}
        <span className="text-[11px] text-slate-500">Hover bars to view accuracy breakdown</span>
      </div>
    </div>
  );
};
