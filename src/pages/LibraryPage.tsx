import React, { useState } from 'react';
import {
  Upload,
  Search,
  Filter,
  FileText,
  Layers,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Mic,
  Presentation,
  Sparkles,
  RefreshCw,
  Video
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { LearningResource, FileType } from '../types';
import { ResourceUploadModal } from '../components/library/ResourceUploadModal';
import { DocumentPreviewModal } from '../components/library/DocumentPreviewModal';

export const LibraryPage: React.FC = () => {
  const {
    resources,
    deleteResource,
    selectedResourceForPreview,
    setSelectedResourceForPreview,
    isLoadingMaterials,
    refreshMaterials,
    profile,
    activeSubject,
    setActiveSubject,
    updateResourceSubject
  } = useStudy();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [editingSubjectDocId, setEditingSubjectDocId] = useState<string | null>(null);

  // Topics extracted from resources
  const topics = ['All', ...Array.from(new Set(resources.map(r => r.topic)))];
  const fileTypes = ['All', 'pdf', 'pptx', 'mp4', 'transcript', 'txt'];

  const filteredResources = resources.filter(res => {
    const matchesSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === 'All' || res.topic === selectedTopic;
    const matchesSubject = !activeSubject || res.subject === activeSubject;
    const matchesType =
      selectedType === 'All' ||
      res.fileType === selectedType ||
      (selectedType === 'mp4' && ['mp4', 'webm', 'video'].includes(res.fileType));
    return matchesSearch && matchesTopic && matchesSubject && matchesType;
  });

  const getFileTypeIcon = (type: FileType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-400" />;
      case 'pptx':
        return <Presentation className="w-5 h-5 text-orange-400" />;
      case 'mp4':
      case 'webm':
      case 'video':
        return <Video className="w-5 h-5 text-indigo-400" />;
      case 'transcript':
        return <Mic className="w-5 h-5 text-purple-400" />;
      default:
        return <FileText className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getStatusBadge = (status: LearningResource['status'], chunkCount: number) => {
    switch (status) {
      case 'ready':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Indexed ({chunkCount} chunks)</span>
          </span>
        );
      case 'indexing':
      case 'processing':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30">
            <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" />
            <span>Vectorizing...</span>
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/30">
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span>Index Failed</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0a0e17] border border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Verified Learning Library</h2>
          <p className="text-xs text-slate-400 mt-1">
            All course documents, lecture slide decks, and transcripts indexed into vector chunks for source-grounded answers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => refreshMaterials()}
            disabled={isLoadingMaterials}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 font-semibold text-xs border border-slate-800 transition-all disabled:opacity-50"
            title="Refresh documents from backend database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMaterials ? 'animate-spin text-teal-400' : 'text-slate-400'}`} />
            <span>{isLoadingMaterials ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs shadow-lg shadow-teal-500/20 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Material</span>
          </button>
        </div>
      </div>

      {/* Education Profile Context Banner */}
      {profile && (
        <div className="p-4 rounded-2xl bg-[#090d15] border border-teal-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/25">
                {profile.education_level.toUpperCase()} LIBRARY
              </span>
              <span className="text-xs font-bold text-white">
                {profile.education_level === 'school'
                  ? `${profile.grade_or_course} • ${profile.board_or_specialization || 'CBSE'} Board`
                  : profile.education_level === 'college'
                  ? `${profile.grade_or_course} • ${profile.academic_year || 'College'} • ${profile.board_or_specialization || 'Engineering'}`
                  : `Self-Learner • ${profile.board_or_specialization || 'AI Focus'}`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {profile.education_level === 'school'
                ? 'Recommended categories: NCERT Chapter Notes, Solved Exemplars, Formula Sheets, Practical Lab Manuals'
                : profile.education_level === 'college'
                ? 'Recommended categories: University Syllabus Notes, Lecture Slides, Previous Year Papers, Lab Programs'
                : 'Recommended categories: Technical Whitepapers, Implementation Blueprints, Project Repos, Deep-Dive Guides'}
            </p>
          </div>

          {profile.selected_subjects && profile.selected_subjects.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
              <span className="text-[11px] font-semibold text-slate-400">Filter Subject:</span>
              <button
                onClick={() => setActiveSubject(null)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeSubject === null
                    ? 'bg-teal-500 text-slate-950 font-semibold'
                    : 'bg-[#0a0e17] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All
              </button>
              {profile.selected_subjects.map(sub => (
                <button
                  key={sub}
                  onClick={() => setActiveSubject(activeSubject === sub ? null : sub)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    activeSubject === sub
                      ? 'bg-teal-500 text-slate-950 font-semibold shadow-sm shadow-teal-500/20'
                      : 'bg-[#0a0e17] text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by title, concepts, or filename..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Topic filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              {topics.map(t => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Topics' : t}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 uppercase"
          >
            {fileTypes.map(ft => (
              <option key={ft} value={ft}>
                {ft === 'All' ? 'All Formats' : ft}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resource Count info */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing {filteredResources.length} of {resources.length} indexed documents
          {activeSubject && <strong className="text-teal-300 ml-1">in {activeSubject}</strong>}
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          Total chunks: {resources.reduce((sum, r) => sum + r.chunkCount, 0)} | Grounding status: Active
        </span>
      </div>

      {/* Resources Cards Grid */}
      {filteredResources.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0a0e17] border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mx-auto text-slate-400 border border-slate-800">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200">No matching learning materials found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms or filters, or upload a new PDF, slide deck, or transcript.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTopic('All');
              setSelectedType('All');
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map(res => (
            <div
              key={res.id}
              className="p-5 rounded-2xl bg-[#0a0e17] border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm"
            >
              <div>
                {/* Top header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-[#070b12] border border-slate-800 shrink-0">
                    {getFileTypeIcon(res.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
                      <span className="font-mono uppercase font-semibold text-teal-400">{res.fileType}</span>
                      <span>•</span>
                      <span className="truncate">{res.fileSize}</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-100 group-hover:text-teal-300 transition-colors line-clamp-2">
                      {res.title}
                    </h3>
                  </div>
                </div>

                {/* Summary */}
                <p className="mt-3 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {res.summary}
                </p>

                {/* Topic & Subject Metadata */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {/* Subject Badge / Reassign Dropdown */}
                  {editingSubjectDocId === res.id ? (
                    <select
                      value={res.subject || 'General'}
                      onChange={e => {
                        updateResourceSubject(res.id, e.target.value);
                        setEditingSubjectDocId(null);
                      }}
                      onBlur={() => setEditingSubjectDocId(null)}
                      autoFocus
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-950 text-teal-300 border border-teal-500 focus:outline-none"
                    >
                      {profile?.selected_subjects?.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="General">General</option>
                    </select>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingSubjectDocId(res.id)}
                      title="Click to reassign subject"
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/25 transition-colors flex items-center gap-1"
                    >
                      <span>📚 {res.subject || 'General'}</span>
                    </button>
                  )}

                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 text-slate-300 border border-slate-800">
                    {res.topic}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {res.uploadDate}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {getStatusBadge(res.status, res.chunkCount)}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedResourceForPreview(res)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Inspect Vectorized Chunks"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${res.title}" from library?`)) {
                        deleteResource(res.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ResourceUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      <DocumentPreviewModal
        resource={selectedResourceForPreview}
        onClose={() => setSelectedResourceForPreview(null)}
      />
    </div>
  );
};
