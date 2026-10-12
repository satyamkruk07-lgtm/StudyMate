import React, { useState } from 'react';
import { BarChart2, Calendar, TrendingUp } from 'lucide-react';
import { WEEKLY_STUDY_DATA } from '../../data/sampleMastery';

export const WeeklyChart: React.FC = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxHours = Math.max(...WEEKLY_STUDY_DATA.map(d => d.hours));

  const totalWeeklyHours = WEEKLY_STUDY_DATA.reduce((sum, d) => sum + d.hours, 0).toFixed(1);
  const avgAccuracy = Math.round(
    WEEKLY_STUDY_DATA.reduce((sum, d) => sum + d.accuracy, 0) / WEEKLY_STUDY_DATA.length
  );

  return (
    <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Weekly Learning Progress</h3>
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Oct 6 – Oct 12
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Study hours & adaptive quiz calibration</p>
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
          {WEEKLY_STUDY_DATA.map((item, idx) => {
            const heightPercent = Math.round((item.hours / maxHours) * 100);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.day}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-16 z-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 shadow-xl text-center whitespace-nowrap pointer-events-none">
                    <div className="text-[11px] font-bold text-white">{item.day} Breakdown</div>
                    <div className="text-[10px] text-sky-400">{item.hours}h studied • {item.questions} questions</div>
                    <div className="text-[10px] text-emerald-400">{item.accuracy}% accuracy</div>
                  </div>
                )}

                {/* Accuracy badge pill */}
                <span className={`text-[10px] mb-1 font-mono transition-opacity ${
                  isHovered ? 'text-indigo-300 font-bold opacity-100' : 'text-slate-500 opacity-70 group-hover:opacity-100'
                }`}>
                  {item.hours}h
                </span>

                {/* Animated bar */}
                <div className="w-full max-w-[36px] bg-slate-800/80 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      isHovered
                        ? 'bg-gradient-to-t from-indigo-600 via-indigo-500 to-sky-400 shadow-lg shadow-indigo-500/30'
                        : 'bg-gradient-to-t from-indigo-900/90 via-indigo-700 to-indigo-500'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* Day label */}
                <span className={`mt-2 text-xs font-medium transition-colors ${
                  isHovered ? 'text-sky-300 font-bold' : 'text-slate-400'
                }`}>
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-400">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Top study peak on Saturday (+35% over baseline)</span>
        </span>
        <span className="text-[11px] text-slate-400">Hover bars to view accuracy telemetry</span>
      </div>
    </div>
  );
};
