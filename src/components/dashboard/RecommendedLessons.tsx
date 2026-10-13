import React from 'react';
import { Sparkles, Clock, ArrowRight, BookOpen, BrainCircuit } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

export const RecommendedLessons: React.FC = () => {
  const {
    setCurrentPage,
    setSelectedResourceForPreview,
    resources,
    launchQuizWithConfig,
    backendRecommendations
  } = useStudy();

  const hasBackendRecs = backendRecommendations && backendRecommendations.length > 0;

  return (
    <div className="p-5 rounded-2xl bg-[#0a0e17] border border-slate-800 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Personalized Learning Recommendations</h3>
            <p className="text-xs text-slate-400">Derived from Bayesian competency tracking and quiz history</p>
          </div>
        </div>
        <button
          onClick={() => setCurrentPage('roadmap')}
          className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 font-mono transition-colors"
        >
          View Roadmap <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {hasBackendRecs ? (
          backendRecommendations.slice(0, 3).map((rec, idx) => (
            <div
              key={`rec-${idx}`}
              className="p-4 rounded-xl bg-[#0d121c] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-semibold px-2 py-0.5 rounded bg-slate-900 text-teal-300 border border-teal-500/20 font-mono">
                    {rec.topic}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {rec.recommended_difficulty}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-100 group-hover:text-teal-300 transition-colors line-clamp-1">
                  {rec.title}
                </h4>
                <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {rec.reason || rec.action}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <BrainCircuit className="w-3 h-3 text-teal-400" /> Adaptive
                </span>
                <button
                  onClick={() =>
                    launchQuizWithConfig({
                      topic: rec.topic,
                      difficulty: rec.recommended_difficulty
                    })
                  }
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/25 hover:bg-teal-500 hover:text-slate-950 transition-all flex items-center gap-1"
                >
                  <span>Practice</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        ) : (
          [
            {
              id: 'rec-1',
              title: 'Scaled Dot-Product Attention Proof',
              topic: 'Transformers & LLMs',
              duration: '15 mins',
              format: 'Course Slides',
              description: 'Deconstruct why dividing by √d_k counters softmax saturation in high dimensions.'
            },
            {
              id: 'rec-2',
              title: 'Vanishing Gradient Mitigation in Deep Networks',
              topic: 'Neural Networks',
              duration: '12 mins',
              format: 'Text Review',
              description: 'Explore ReLU mathematical derivatives and batch normalization internal covariate shifts.'
            },
            {
              id: 'rec-3',
              title: 'Adam Optimizer Bias Correction Derivation',
              topic: 'Optimization',
              duration: '10 mins',
              format: 'Formula Quiz',
              description: 'Analyze moving average momentum bias compensation in early training steps.'
            }
          ].map(lesson => (
            <div
              key={lesson.id}
              className="p-4 rounded-xl bg-[#0d121c] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-semibold px-2 py-0.5 rounded bg-slate-900 text-teal-300 border border-slate-700/60 font-mono">
                    {lesson.topic}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1 font-mono text-[10px]">
                    <Clock className="w-3 h-3" /> {lesson.duration}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-100 group-hover:text-teal-300 transition-colors line-clamp-1">
                  {lesson.title}
                </h4>
                <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {lesson.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-slate-400" /> {lesson.format}
                </span>
                <button
                  onClick={() => launchQuizWithConfig({ topic: lesson.topic, difficulty: 'Intermediate' })}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/25 hover:bg-teal-500 hover:text-slate-950 transition-all flex items-center gap-1"
                >
                  <span>Start</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
