import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { CitationReference } from '../types';


export const TutorPage: React.FC = () => {
  const {
    chatMessages,
    isChatThinking,
    chatError,
    apiMode,
    sendChatMessage,
    clearChat,
    resources,
    setSelectedResourceForPreview,
    setCurrentPage
  } = useStudy();

  const [inputPrompt, setInputPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCitationId, setExpandedCitationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatThinking]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isChatThinking) return;
    setInputPrompt('');
    await sendChatMessage(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInspectCitationDoc = (citation: CitationReference) => {
    const res = resources.find(r => r.id === citation.resourceId);
    if (res) {
      setSelectedResourceForPreview(res);
      setCurrentPage('library');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-5xl mx-auto pb-4">
      {/* Top Header bar with status badge */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f172a] border border-slate-800 shrink-0 mb-3">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Bot className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0f172a]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Source-Grounded AI Tutor</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Grounding Guard Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Citations linked to verified course PDFs, lecture slides, notes, and transcripts.
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition-colors"
        >
          Reset Session
        </button>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 pr-2">
        {chatMessages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'student' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'student'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-indigo-400 border border-indigo-500/30'
              }`}
            >
              {msg.sender === 'student' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble Content */}
            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm space-y-3 leading-relaxed shadow-sm ${
                msg.sender === 'student'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-[#0f172a] border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              {/* Header inside tutor message */}
              {msg.sender === 'tutor' && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">StudyMate AI</span>
                    {msg.topicTag && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-sky-300 text-[10px] font-mono">
                        {msg.topicTag}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <span>{msg.timestamp}</span>
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="p-1 hover:text-slate-200 rounded transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Message text with markdown formatting */}
              <div className="whitespace-pre-wrap space-y-2">
                {msg.text}
              </div>

              {/* Unverified / Out-of-Domain Notice Banner */}
              {!msg.isGrounded && msg.unverifiedReason && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Hallucination Guardrail Triggered</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-normal">
                    {msg.unverifiedReason}
                  </p>
                  <div className="pt-1 text-[10px] text-amber-400/80 italic">
                    Answer was not hallucinated from non-library web trivia to protect academic rigor.
                  </div>
                </div>
              )}

              {/* Verified Source Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      Verified Source References ({msg.citations.length})
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Conf: {Math.round(msg.citations[0].confidenceScore * 100)}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    {msg.citations.map((cit, cidx) => (
                      <div
                        key={cidx}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-semibold text-sky-300">
                            <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-slate-800 uppercase">
                              {cit.fileType}
                            </span>
                            <span className="truncate">{cit.resourceTitle}</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold shrink-0">
                            {cit.location}
                          </span>
                        </div>

                        {/* Quoted Snippet */}
                        <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300 font-mono italic leading-relaxed">
                          "{cit.snippet}"
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleInspectCitationDoc(cit)}
                            className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                          >
                            <span>Inspect Full Document in Library</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Follow-Up Questions */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-400" /> Suggested Follow-Ups:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggestedFollowUps.map((q, qidx) => (
                      <button
                        key={qidx}
                        onClick={() => handleSend(q)}
                        className="text-left px-2.5 py-1 text-[11px] rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Thinking Indicator */}
        {isChatThinking && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-[#0f172a] border border-slate-800 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-400">
                Searching vector index & checking source citations...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Footer */}
      <div className="mt-3 p-3 rounded-2xl bg-[#0f172a] border border-slate-800 shrink-0 space-y-2">
        {/* Quick query chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] text-slate-400 scrollbar-none">
          <span className="font-semibold text-slate-500 shrink-0">Try asking:</span>
          <button
            onClick={() => handleSend('Why do we divide by √d_k in scaled dot-product attention?')}
            className="px-2.5 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0"
          >
            Attention √d_k Proof
          </button>
          <button
            onClick={() => handleSend('How does Adam compute bias-corrected moments?')}
            className="px-2.5 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0"
          >
            Adam Optimizer Bias
          </button>
          <button
            onClick={() => handleSend('Why normalize embeddings in CLIP to unit length?')}
            className="px-2.5 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0"
          >
            CLIP L2-Normalization
          </button>
          <button
            onClick={() => handleSend('What is the capital of Peru and its weather?')}
            className="px-2.5 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0"
            title="Demonstrates Out-of-Domain Hallucination Guardrail"
          >
            ⚡ Test Out-of-Domain Query
          </button>
        </div>

        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a conceptual question, mathematical proof, or clarify lecture transcripts... (Enter to send, Shift+Enter for newline)"
            className="flex-1 p-2.5 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputPrompt.trim() || isChatThinking}
            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
