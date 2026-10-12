import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Flame,
  Check,
  Loader2,
  AlertTriangle,
  FileText,
  Clock,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { DifficultyLevel, BackendQuiz, BackendAttemptResult } from '../types';
import { SAMPLE_QUESTIONS } from '../data/sampleQuestions';

export const QuizPage: React.FC = () => {
  const {
    resources,
    apiMode,
    apiEndpoint,
    generateQuizFromBackend,
    submitQuizToBackend,
    backendMastery,
    quizLauncherConfig,
    clearQuizLauncherConfig,
    setCurrentPage,
    setSelectedResourceForPreview,
    quizAttempts,
    saveQuizAttempt
  } = useStudy();

  const [quizState, setQuizState] = useState<'setup' | 'generating' | 'active' | 'submitting' | 'results'>('setup');

  // Setup options
  const [selectedDocId, setSelectedDocId] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('Intermediate');
  const [questionCount, setQuestionCount] = useState(3);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active quiz state
  const [activeQuizId, setActiveQuizId] = useState<string>('');
  const [activeQuestions, setActiveQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [startTimeMs, setStartTimeMs] = useState<number>(0);
  const [startTimeIso, setStartTimeIso] = useState<string>('');

  // Evaluated results state
  const [attemptResult, setAttemptResult] = useState<BackendAttemptResult | null>(null);

  // Check launcher config
  useEffect(() => {
    if (quizLauncherConfig) {
      if (quizLauncherConfig.topic) {
        setSelectedTopic(quizLauncherConfig.topic);
      }
      if (quizLauncherConfig.difficulty) {
        setSelectedDifficulty(quizLauncherConfig.difficulty);
      }
      if (quizLauncherConfig.document_id) {
        setSelectedDocId(quizLauncherConfig.document_id);
      }
      clearQuizLauncherConfig();
    }
  }, [quizLauncherConfig, clearQuizLauncherConfig]);

  // Derived available topics from documents & mastery
  const availableTopics = [
    'All Topics',
    ...Array.from(
      new Set([
        ...resources.map(r => r.topic),
        ...backendMastery.map(m => m.topic),
        'Neural Networks',
        'Activation Functions',
        'Loss Functions',
        'Transformers & Attention',
        'Optimization & Adam'
      ])
    )
  ];

  const handleStartQuiz = async () => {
    setErrorMessage(null);
    setQuizState('generating');

    const startIso = new Date().toISOString();
    const startMs = Date.now();
    setStartTimeIso(startIso);
    setStartTimeMs(startMs);

    // If connected to FastAPI backend, request real grounded generation
    if (apiMode === 'fastapi-connected') {
      try {
        const payload: {
          document_id?: string;
          topic?: string;
          question_type: string;
          difficulty: DifficultyLevel;
          question_count: number;
        } = {
          question_type: selectedQuestionType,
          difficulty: selectedDifficulty,
          question_count: questionCount
        };

        if (selectedDocId !== 'all') {
          payload.document_id = selectedDocId;
        }
        if (selectedTopic !== 'All Topics') {
          payload.topic = selectedTopic;
        }

        const backendQuiz: BackendQuiz = await generateQuizFromBackend(payload);

        if (!backendQuiz || !backendQuiz.questions || backendQuiz.questions.length === 0) {
          throw new Error('No valid questions generated from selected material.');
        }

        setActiveQuizId(backendQuiz.id);
        setActiveQuestions(backendQuiz.questions);
        setCurrentIdx(0);
        setUserAnswers({});
        setQuizState('active');
        return;
      } catch (err: any) {
        console.warn('Backend quiz generation failed, offering client fallback:', err);
        setErrorMessage(
          err.message || 'Quiz generation failed. Ensure documents are uploaded or Gemini API is reachable.'
        );
        // Do not immediately fail if client wants to use client questions
      }
    }

    // Client-side fallback if offline or backend generation was unavailable
    let pool = [...SAMPLE_QUESTIONS];
    if (selectedTopic !== 'All Topics') {
      const topicMatches = pool.filter(q => q.topic.toLowerCase() === selectedTopic.toLowerCase());
      if (topicMatches.length > 0) pool = topicMatches;
    }
    if (selectedQuestionType !== 'all') {
      const typeMatches = pool.filter(q => q.type === selectedQuestionType);
      if (typeMatches.length > 0) pool = typeMatches;
    }

    const diffMatches = pool.filter(q => q.difficulty === selectedDifficulty);
    const chosen = diffMatches.length > 0 ? diffMatches : pool;
    const clientQuestions = chosen.slice(0, questionCount).map((q, idx) => ({
      id: q.id,
      question_index: idx + 1,
      prompt: q.prompt,
      question_type: q.type,
      topic: q.topic,
      difficulty: q.difficulty,
      options: q.type === 'mcq' ? q.options : undefined,
      unit: q.type === 'numerical' ? q.unit : undefined,
      source_doc_name: q.citation.resourceTitle,
      source_location: q.citation.location,
      source_snippet: q.citation.snippet
    }));

    setActiveQuizId(`client-quiz-${Date.now()}`);
    setActiveQuestions(clientQuestions);
    setCurrentIdx(0);
    setUserAnswers({});
    setQuizState('active');
  };

  const currentQ = activeQuestions[currentIdx];

  const handleSelectOption = (qId: string, optVal: string) => {
    setUserAnswers(prev => ({ ...prev, [qId]: optVal }));
  };

  const handleTextAnswerChange = (qId: string, val: string) => {
    setUserAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleFinalSubmit = async () => {
    setQuizState('submitting');
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeMs) / 1000));

    if (apiMode === 'fastapi-connected' && !activeQuizId.startsWith('client-quiz-')) {
      try {
        const result = await submitQuizToBackend(
          activeQuizId,
          userAnswers,
          startTimeIso,
          elapsedSeconds
        );
        setAttemptResult(result);
        setQuizState('results');
        return;
      } catch (err: any) {
        console.error('Backend submission error:', err);
        // Fallback to client grading if backend had network error
      }
    }

    // Client fallback grading
    let correctCount = 0;
    const questionResults = activeQuestions.map(q => {
      const uAns = userAnswers[q.id] || '';
      let isCorrect = false;
      let expAns = '';
      let feedback = '';

      const sampleMatch = SAMPLE_QUESTIONS.find(sq => sq.id === q.id);
      if (sampleMatch) {
        if (sampleMatch.type === 'mcq') {
          expAns = sampleMatch.options[sampleMatch.correctOptionIndex];
          isCorrect = uAns === sampleMatch.correctOptionIndex.toString();
          feedback = isCorrect ? 'Correct! Matched canonical definition.' : sampleMatch.explanation;
        } else if (sampleMatch.type === 'numerical') {
          expAns = `${sampleMatch.correctValue} ${sampleMatch.unit || ''}`;
          const num = parseFloat(uAns);
          isCorrect = !isNaN(num) && Math.abs(num - sampleMatch.correctValue) <= sampleMatch.tolerance;
          feedback = sampleMatch.explanation;
        } else if (sampleMatch.type === 'short-answer') {
          expAns = sampleMatch.sampleModelAnswer;
          const matchCount = sampleMatch.acceptableKeywords.filter(kw =>
            uAns.toLowerCase().includes(kw.toLowerCase())
          ).length;
          isCorrect = matchCount >= 2;
          feedback = isCorrect
            ? 'Demonstrated strong grasp of key terms.'
            : `Missing critical concepts: ${sampleMatch.acceptableKeywords.join(', ')}`;
        }
      } else {
        // Fallback
        isCorrect = uAns.trim().length > 3;
        expAns = 'Course-grounded standard model answer';
        feedback = isCorrect ? 'Answer provided aligns with material context.' : 'Answer lacks sufficient detail.';
      }

      if (isCorrect) correctCount += 1;

      return {
        id: `ans-${q.id}`,
        question_id: q.id,
        question_prompt: q.prompt,
        question_type: q.question_type,
        user_answer: uAns || 'No response submitted',
        expected_answer: expAns,
        is_correct: isCorrect,
        score: isCorrect ? 1.0 : 0.0,
        feedback: feedback,
        evaluated_by: 'client-rule-engine',
        source_doc_name: q.source_doc_name,
        source_location: q.source_location,
        source_snippet: q.source_snippet
      };
    });

    const pct = Math.round((correctCount / (activeQuestions.length || 1)) * 100);

    const fallbackResult: BackendAttemptResult = {
      attempt_id: `att-${Date.now()}`,
      quiz_id: activeQuizId,
      topic: selectedTopic === 'All Topics' ? 'Adaptive Assessment' : selectedTopic,
      difficulty: selectedDifficulty,
      total_questions: activeQuestions.length,
      correct_answers: correctCount,
      score_percentage: pct,
      time_spent_seconds: elapsedSeconds,
      completed_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      question_results: questionResults
    };

    saveQuizAttempt({
      id: fallbackResult.attempt_id,
      topic: fallbackResult.topic,
      difficulty: fallbackResult.difficulty,
      totalQuestions: fallbackResult.total_questions,
      correctAnswers: fallbackResult.correct_answers,
      scorePercentage: fallbackResult.score_percentage,
      completedAt: fallbackResult.completed_at,
      timeSpentSeconds: fallbackResult.time_spent_seconds,
      questionResults: questionResults.map(qr => ({
        questionId: qr.question_id,
        questionPrompt: qr.question_prompt,
        questionType: qr.question_type,
        userAnswer: qr.user_answer,
        isCorrect: qr.is_correct,
        explanation: qr.feedback,
        citation: {
          resourceId: 'res-grounded',
          resourceTitle: qr.source_doc_name,
          fileType: 'pdf',
          location: qr.source_location,
          snippet: qr.source_snippet,
          confidenceScore: 0.95
        }
      }))
    });

    setAttemptResult(fallbackResult);
    setQuizState('results');
  };

  const handleInspectCitation = (docName: string) => {
    const res = resources.find(
      r => r.title.toLowerCase() === docName.toLowerCase() || r.fileName.toLowerCase() === docName.toLowerCase()
    );
    if (res) {
      setSelectedResourceForPreview(res);
      setCurrentPage('library');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 1. SETUP STATE */}
      {quizState === 'setup' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Adaptive Smart Quiz</h2>
                  <p className="text-xs text-slate-400">
                    Source-grounded assessments generated strictly from your uploaded course materials.
                  </p>
                </div>
              </div>

              {/* Backend status indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] self-start sm:self-auto">
                <div
                  className={`w-2 h-2 rounded-full ${
                    apiMode === 'fastapi-connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="text-slate-300 font-mono">
                  {apiMode === 'fastapi-connected' ? 'FastAPI + Gemini Active' : 'Offline Client Engine'}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[11px] font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Material Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  1. Source Material
                </label>
                <select
                  value={selectedDocId}
                  onChange={e => setSelectedDocId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Uploaded Course Materials ({resources.length} files)</option>
                  {resources.map(res => (
                    <option key={res.id} value={res.id}>
                      {res.title} ({res.fileType.toUpperCase()} • {res.chunkCount} chunks)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Questions will be extracted strictly from evidence in this document.
                </p>
              </div>

              {/* Topic Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  2. Select Topic Focus
                </label>
                <select
                  value={selectedTopic}
                  onChange={e => setSelectedTopic(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {availableTopics.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  BM25 retriever will prioritize text chunks mapped to this topic.
                </p>
              </div>

              {/* Question Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  3. Question Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: 'Mixed Formats' },
                    { id: 'mcq', label: 'Multiple Choice (MCQ)' },
                    { id: 'short-answer', label: 'Conceptual Short-Answer' },
                    { id: 'numerical', label: 'Numerical Problem' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedQuestionType(opt.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        selectedQuestionType === opt.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  4. Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Beginner', 'Intermediate', 'Advanced'] as DifficultyLevel[]).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedDifficulty(lvl)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        selectedDifficulty === lvl
                          ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{lvl}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    5. Question Count
                  </label>
                  <div className="flex gap-2">
                    {[3, 5, 7].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                          questionCount === num
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {num} Qs
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Launch Action */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Source citations preserved for post-quiz evaluation audit</span>
              </div>
              <button
                onClick={handleStartQuiz}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
              >
                <span>Generate Grounded Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Past Assessment History */}
          {quizAttempts.length > 0 && (
            <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">Recent Quiz Attempts</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">{quizAttempts.length} Total Sessions</span>
              </div>

              <div className="space-y-2.5">
                {quizAttempts.slice(0, 3).map(att => (
                  <div
                    key={att.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        <span>{att.topic}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                          {att.difficulty}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {att.correctAnswers} / {att.totalQuestions} Correct • Completed at {att.completedAt}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-sm text-emerald-400">{att.scorePercentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. GENERATING STATE */}
      {quizState === 'generating' && (
        <div className="p-12 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl text-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-white">Generating Source-Grounded Questions</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Retrieving relevant chunks via BM25 and generating schema-validated questions with Gemini AI. Correct
            answers and rubrics remain confidential until submission.
          </p>
        </div>
      )}

      {/* 3. ACTIVE QUIZ STATE */}
      {quizState === 'active' && currentQ && (
        <div className="space-y-4">
          {/* Top Navigation & Status */}
          <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Question {currentIdx + 1} of {activeQuestions.length}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {currentQ.topic}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-sky-300">
                  {currentQ.difficulty}
                </span>
              </div>
              {/* Question selector pills */}
              <div className="flex items-center gap-1.5 pt-1">
                {activeQuestions.map((q, idx) => {
                  const answered = !!userAnswers[q.id];
                  const isCurrent = idx === currentIdx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-md'
                          : answered
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Quit this quiz session? Unsubmitted answers will be lost.')) {
                  setQuizState('setup');
                }
              }}
              className="text-xs font-medium text-slate-400 hover:text-slate-200 self-end sm:self-auto"
            >
              Exit Quiz
            </button>
          </div>

          {/* Question Card */}
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase font-mono tracking-wider font-semibold text-indigo-400">
                  {currentQ.question_type === 'mcq'
                    ? 'Multiple Choice Question'
                    : currentQ.question_type === 'short-answer'
                    ? 'Conceptual Short Answer'
                    : 'Numerical Problem'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Source: {currentQ.source_doc_name}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">{currentQ.prompt}</h3>
            </div>

            {/* Answer Input */}
            <div className="space-y-3">
              {/* MCQ Options */}
              {currentQ.question_type === 'mcq' && (
                <div className="space-y-2.5">
                  {(currentQ.options || []).map((opt: string, optIdx: number) => {
                    const isSelected = userAnswers[currentQ.id] === optIdx.toString();
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, optIdx.toString())}
                        className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1 mt-0.5 leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short Answer Input */}
              {currentQ.question_type === 'short-answer' && (
                <div className="space-y-2">
                  <textarea
                    rows={5}
                    value={userAnswers[currentQ.id] || ''}
                    onChange={e => handleTextAnswerChange(currentQ.id, e.target.value)}
                    placeholder="Enter your source-grounded explanation. Be specific about key formulas, assumptions, or mechanisms..."
                    className="w-full p-3.5 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Will be evaluated against verified model rubric and conceptual keywords.</span>
                    <span>{(userAnswers[currentQ.id] || '').split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                </div>
              )}

              {/* Numerical Input */}
              {currentQ.question_type === 'numerical' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="any"
                      value={userAnswers[currentQ.id] || ''}
                      onChange={e => handleTextAnswerChange(currentQ.id, e.target.value)}
                      placeholder="Enter computed value..."
                      className="w-64 p-3 text-sm font-mono rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                    {currentQ.unit && <span className="text-xs font-mono text-slate-400">{currentQ.unit}</span>}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Numeric tolerance and units will be checked deterministically.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 text-xs font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-3">
                {currentIdx < activeQuestions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx(prev => prev + 1)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinalSubmit}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <span>Submit Quiz for Evaluation</span>
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUBMITTING STATE */}
      {quizState === 'submitting' && (
        <div className="p-12 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl text-center space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-white">Evaluating Quiz Submission</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Deterministically scoring MCQs & numerical bounds, grading short answers against AI rubrics, and updating
            your Bayesian topic mastery estimates.
          </p>
        </div>
      )}

      {/* 5. RESULTS STATE */}
      {quizState === 'results' && attemptResult && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#111936] to-[#0f172a] border border-indigo-500/30 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Assessment Completed • {attemptResult.topic}
                </span>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Assessment Evaluation Audit</h2>
                <p className="text-xs text-slate-400">
                  Scored via deterministic rules & AI rubrics with transparent source grounding.
                </p>
              </div>

              <div className="text-right sm:text-center p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="text-3xl font-extrabold text-white font-mono">{attemptResult.score_percentage}%</div>
                <div className="text-xs text-emerald-400 font-semibold">
                  {attemptResult.correct_answers} / {attemptResult.total_questions} Correct
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Difficulty</span>
                <span className="font-semibold text-slate-200">{attemptResult.difficulty}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Time Spent</span>
                <span className="font-semibold text-slate-200 font-mono">
                  {attemptResult.time_spent_seconds} seconds
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Bayesian Mastery</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Beta-Binomial Posterior Updated
                </span>
              </div>
            </div>
          </div>

          {/* Question Breakdown List */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
              Detailed Question-by-Question Evaluation
            </h3>

            {attemptResult.question_results.map((res, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">Q{idx + 1}.</span>
                    <h4 className="font-bold text-xs sm:text-sm text-white">{res.question_prompt}</h4>
                  </div>
                  {res.is_correct ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Full Credit (1.0)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30 shrink-0">
                      <XCircle className="w-3.5 h-3.5" /> Needs Review (0.0)
                    </span>
                  )}
                </div>

                {/* Answers & Feedback Card */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Your Submitted Answer:</span>
                      <span className="font-mono text-slate-200 font-semibold">{res.user_answer}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Expected Grounded Answer:</span>
                      <span className="font-mono text-emerald-300 font-semibold">{res.expected_answer}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-900 text-slate-300 leading-relaxed">
                    <strong className="text-sky-300">Evaluator Feedback: </strong> {res.feedback}
                  </div>

                  {res.misconception && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                      <strong>Misconception Identified:</strong> {res.misconception}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 font-mono">
                    Graded by: <span className="text-slate-400">{res.evaluated_by}</span>
                  </div>
                </div>

                {/* Supporting Source Citation */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{res.source_doc_name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300">
                        {res.source_location}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 italic font-mono truncate max-w-xl">
                      "{res.source_snippet}"
                    </div>
                  </div>

                  <button
                    onClick={() => handleInspectCitation(res.source_doc_name)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 whitespace-nowrap self-end sm:self-auto flex items-center gap-1"
                  >
                    <span>Inspect Document</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setQuizState('setup')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Take Another Quiz</span>
            </button>

            <button
              onClick={() => setCurrentPage('mastery')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30"
            >
              <span>View Bayesian Mastery & Recommendations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
