import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileText,
  FileCheck,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  Paperclip
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { FileType } from '../../types';

interface ResourceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResourceUploadModal: React.FC<ResourceUploadModalProps> = ({
  isOpen,
  onClose
}) => {
  const { uploadRealFile, apiMode } = useStudy();

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('Transformers & LLMs');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      if (!title) {
        const cleanTitle = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));
      }
      setErrorMsg('');
    }
  };

  const handleLoadSampleTemplate = (type: 'pdf' | 'pptx' | 'txt') => {
    setErrorMsg('');
    if (type === 'txt') {
      const content = `Gradient Descent and Learning Rate Scheduling\nAuthor: IIT Mandi AI Research Group\n\nStochastic Gradient Descent (SGD) computes parameter updates along the negative gradient vector: theta = theta - eta * grad(L). Adding momentum accelerates SGD in the direction of persistent gradient vectors and dampens oscillations. Cosine annealing schedules smoothly decrease the learning rate eta following a cosine curve.`;
      const file = new File([content], 'sgd_momentum_notes.txt', { type: 'text/plain' });
      setSelectedFile(file);
      setTitle('SGD Momentum & Learning Rate Dynamics');
      setTopic('Optimization & Loss Functions');
    } else if (type === 'pptx') {
      const content = `Transformer Architectures and Multi-Head Attention\nSlide 1: In Multi-Head Attention, queries, keys, and values are projected h times with separate learned linear projections to d_k, d_k, and d_v dimensions respectively.`;
      const file = new File([content], 'multihead_attention_slides.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      setSelectedFile(file);
      setTitle('Multi-Head Attention Projections');
      setTopic('Transformers & LLMs');
    } else {
      const content = `%PDF-1.4\n1 0 obj\n<< /Title (Deep Learning Basics) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`;
      const file = new File([content], 'deep_learning_primer.pdf', { type: 'application/pdf' });
      setSelectedFile(file);
      setTitle('Deep Learning Fundamentals Primer');
      setTopic('Neural Networks');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a file to upload (.pdf, .pptx, or .txt).');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    try {
      await uploadRealFile(selectedFile, title.trim() || selectedFile.name, topic);
      setIsUploading(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing document. Ensure file contains extractable text.');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl p-6 bg-[#0f172a] rounded-2xl border border-slate-700/80 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Upload Learning Material</h3>
              <p className="text-xs text-slate-400">
                Extracts text, builds vector chunks, and tracks page/slide numbers for RAG grounding.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Backend mode indicator */}
        <div className="mt-3 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Active Backend Target:</span>
          <span className="font-mono text-[11px] text-sky-400">
            {apiMode === 'fastapi-connected' ? 'FastAPI Ingestion Engine' : 'In-Browser Engine'}
          </span>
        </div>

        {/* Preset quick test buttons */}
        <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Quick Preset Test Files:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleLoadSampleTemplate('txt')}
              className="px-2 py-1.5 text-[11px] font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-center"
            >
              📝 Notes (.txt)
            </button>
            <button
              type="button"
              onClick={() => handleLoadSampleTemplate('pptx')}
              className="px-2 py-1.5 text-[11px] font-medium rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 text-center"
            >
              📊 Slides (.pptx)
            </button>
            <button
              type="button"
              onClick={() => handleLoadSampleTemplate('pdf')}
              className="px-2 py-1.5 text-[11px] font-medium rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-center"
            >
              📄 Paper (.pdf)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* File selector input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Choose Learning Resource (.pdf, .pptx, .txt, .mp4, .webm) *
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.pptx,.txt,.md,.mp4,.webm,.mov"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-950/60"
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-300">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  <span className="font-semibold">{selectedFile.name}</span>
                  <span className="text-slate-400 font-mono">
                    {selectedFile.size < 1024 * 1024
                      ? `${Math.round(selectedFile.size / 1024)} KB`
                      : `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <Paperclip className="w-5 h-5 text-slate-400 mx-auto" />
                  <div className="text-xs text-slate-300 font-medium">
                    Click to browse or drop your course file / lecture video here
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Supports PDF, PPTX slides, TXT notes, and MP4/WebM lecture videos
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Document Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Scaled Dot-Product Attention Proofs"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Curriculum Topic *
              </label>
              <select
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="Transformers & LLMs">Transformers & LLMs</option>
                <option value="Multimodal Learning">Multimodal Learning</option>
                <option value="Optimization & Loss Functions">Optimization & Loss Functions</option>
                <option value="Neural Networks">Neural Networks</option>
                <option value="Model Alignment & RL">Model Alignment & RL</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all"
            >
              {isUploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Extracting & Indexing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ingest & Index</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
