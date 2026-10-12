import React, { useState } from 'react';
import {
  GitBranch,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { ROADMAP_NODES } from '../data/sampleRoadmap';
import { RoadmapNode } from '../types';

export const RoadmapPage: React.FC = () => {
  const { launchQuizWithConfig, setSelectedResourceForPreview, resources, setCurrentPage } = useStudy();

  const [selectedNode, setSelectedNode] = useState<RoadmapNode>(ROADMAP_NODES[4]); // default to Transformers
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(ROADMAP_NODES.map(n => n.category)))];

  const filteredNodes = ROADMAP_NODES.filter(node => {
    if (filterCategory === 'All') return true;
    return node.category === filterCategory;
  });

  const getNodeStatusBadge = (status: RoadmapNode['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Mastered</span>
          </span>
        );
      case 'in-progress':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>In Progress</span>
          </span>
        );
      case 'locked':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Locked</span>
          </span>
        );
    }
  };

  const handleOpenLinkedResource = (resId: string) => {
    const res = resources.find(r => r.id === resId);
    if (res) {
      setSelectedResourceForPreview(res);
      setCurrentPage('library');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Curriculum Architecture
            </span>
            <span className="text-xs text-slate-400">Track D: Multimodal AI</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">Adaptive Learning Roadmap</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured prerequisite graph showing foundations, sequence models, and multimodal alignment milestones.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors ${
                filterCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Roadmap Cards on left, Inspector Drawer on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Nodes List */}
        <div className="lg:col-span-2 space-y-3.5">
          {filteredNodes.map((node, index) => {
            const isSelected = selectedNode.id === node.id;
            const prereqNodes = ROADMAP_NODES.filter(n => node.prerequisites.includes(n.id));

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-r from-slate-900 via-[#10172c] to-[#0f172a] border-indigo-500 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                    : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Step indicator on the left */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        node.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : node.status === 'in-progress'
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-white">{node.title}</h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {node.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {node.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">{getNodeStatusBadge(node.status)}</div>
                </div>

                {/* Prerequisite Tags */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-semibold">Prerequisites:</span>
                    {prereqNodes.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">None (Foundation Milestone)</span>
                    ) : (
                      prereqNodes.map(pr => (
                        <span
                          key={pr.id}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-sky-300 border border-slate-700/60"
                        >
                          ↳ {pr.title}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                    <span>{node.estimatedHours} hrs</span>
                    <span className="text-indigo-400 font-bold">{node.masteryPercentage}% Mastery</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Topic Inspector Drawer */}
        <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-6 h-fit sticky top-20">
          <div className="pb-4 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-sky-400 border border-slate-800">
                {selectedNode.category}
              </span>
              {getNodeStatusBadge(selectedNode.status)}
            </div>
            <h3 className="font-bold text-lg text-white tracking-tight">{selectedNode.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.description}</p>
          </div>

          {/* Key Concepts */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Core Technical Competencies
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedNode.keyConcepts.map((kc, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 text-slate-200 border border-slate-800"
                >
                  ✓ {kc}
                </span>
              ))}
            </div>
          </div>

          {/* Linked Learning Resources */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Linked Verified Course Documents
            </span>
            <div className="space-y-2">
              {selectedNode.linkedResourceIds.map(resId => {
                const res = resources.find(r => r.id === resId);
                if (!res) return null;
                return (
                  <button
                    key={resId}
                    onClick={() => handleOpenLinkedResource(resId)}
                    className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-left flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-slate-200 truncate group-hover:text-indigo-300">{res.title}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() =>
                launchQuizWithConfig({
                  topic: selectedNode.title.includes('Attention') ? 'Transformers & LLMs' : selectedNode.title
                })
              }
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Test Mastery with Quiz</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
