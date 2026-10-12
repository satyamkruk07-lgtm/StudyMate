import React from 'react';
import {
  X,
  FileText,
  Layers,
  Sparkles,
  Bot,
  BrainCircuit,
  ExternalLink,
  Tag,
  Clock,
  Video
} from 'lucide-react';
import { LearningResource } from '../../types';
import { useStudy } from '../../context/StudyContext';

interface DocumentPreviewModalProps {
  resource: LearningResource | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  resource,
  onClose
}) => {
  const { setCurrentPage, launchQuizWithConfig } = useStudy();

  if (!resource) return null;

  const handleAskTutor = () => {
    onClose();
    setCurrentPage('tutor');
  };

  const handleLaunchQuiz = () => {
    onClose();
    launchQuizWithConfig({ topic: resource.topic });
  };

  const getFormatBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">PDF</span>;
      case 'pptx':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/15 text-orange-300 border border-orange-500/30">PPTX</span>;
      case 'mp4':
      case 'webm':
      case 'video':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
            <Video className="w-3 h-3 text-indigo-400" />
            <span>VIDEO (TIMESTAMPED)</span>
          </span>
        );
      case 'transcript':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">TRANSCRIPT</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">TXT</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0f172a] rounded-2xl border border-slate-700/80 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {getFormatBadge(resource.fileType)}
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                {resource.topic}
              </span>
              <span className="text-xs text-slate-400 font-mono">{resource.fileSize}</span>
            </div>
            <h3 className="font-bold text-lg text-white tracking-tight">{resource.title}</h3>
            <p className="text-xs text-slate-400">
              Source: <span className="text-slate-300">{resource.authorOrSource || resource.fileName}</span> • Uploaded {resource.uploadDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Summary */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Document Abstract & Context
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {resource.summary}
            </div>
          </div>

          {/* Vectorized Chunks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Indexed Vector Chunks ({resource.chunks.length} extracted)
              </h4>
              <span className="text-[11px] text-emerald-400 font-mono">100% Vectorized for RAG</span>
            </div>

            <div className="space-y-3">
              {resource.chunks.map((ch, idx) => (
                <div
                  key={ch.id || idx}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 space-y-2 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-indigo-300 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-indigo-400" />
                      Chunk #{ch.chunkIndex || idx + 1} • {ch.location}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                      Grounding Anchor
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-mono bg-slate-950/70 p-2.5 rounded-lg border border-slate-900 leading-relaxed whitespace-pre-wrap">
                    "{ch.content}"
                  </p>

                  {ch.keywords && ch.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {ch.keywords.map((kw, kidx) => (
                        <span
                          key={kidx}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-400 font-mono"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Status: <span className="text-emerald-400 font-semibold uppercase text-[11px]">Ready for Citations</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAskTutor}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Query in AI Tutor</span>
            </button>
            <button
              onClick={handleLaunchQuiz}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Generate Quiz</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
