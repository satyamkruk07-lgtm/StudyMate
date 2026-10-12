import React from 'react';
import { Sparkles, Clock, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

interface Lesson {
  id: string;
  title: string;
  topic: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  format: 'PDF Review' | 'Audio Transcript' | 'Interactive Problem';
  description: string;
  resourceId?: string;
}

const RECOMMENDED_LESSONS: Lesson[] = [
  {
    id: 'rec-1',
    title: 'Scaled Dot-Product Attention Mathematical Proof',
    topic: 'Transformers & LLMs',
    duration: '15 mins',
    difficulty: 'Intermediate',
    format: 'PDF Review',
    description: 'Deconstruct why dividing by √d_k guarantees gradient variance = 1 and counters softmax saturation.',
    resourceId: 'res-2'
  },
  {
    id: 'rec-2',
    title: 'CLIP Contrastive Alignment & Zero-Shot Classification',
    topic: 'Multimodal Learning',
    duration: '20 mins',
    difficulty: 'Intermediate',
    format: 'Audio Transcript',
    description: 'Listen to Lecture 04 excerpts exploring L2 normalization and learned softmax temperature.',
    resourceId: 'res-4'
  },
  {
    id: 'rec-3',
    title: 'Adam Optimizer: Step-by-Step Bias Correction Derivation',
    topic: 'Optimization & Loss Functions',
    duration: '12 mins',
    difficulty: 'Beginner',
    format: 'Interactive Problem',
    description: 'Fix cold-start distortion in first and second momentum terms through numerical exercises.',
    resourceId: 'res-3'
  }
];

export const RecommendedLessons: React.FC = () => {
  const { setCurrentPage, setSelectedResourceForPreview, resources, launchQuizWithConfig } = useStudy();

  const handleStartLesson = (lesson: Lesson) => {
    if (lesson.resourceId) {
      const targetRes = resources.find(r => r.id === lesson.resourceId);
      if (targetRes) {
        setSelectedResourceForPreview(targetRes);
        setCurrentPage('library');
        return;
      }
    }
    launchQuizWithConfig({ topic: lesson.topic, difficulty: lesson.difficulty });
  };

  return (
    <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Recommended Next Lessons</h3>
            <p className="text-xs text-slate-400">Tailored to your current knowledge frontier</p>
          </div>
        </div>
        <button
          onClick={() => setCurrentPage('roadmap')}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          View Roadmap <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-3.5 grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {RECOMMENDED_LESSONS.map(lesson => (
          <div
            key={lesson.id}
            className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="font-semibold px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700/60">
                  {lesson.topic}
                </span>
                <span className="text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> {lesson.duration}
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
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
                onClick={() => handleStartLesson(lesson)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1"
              >
                <span>Study</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
