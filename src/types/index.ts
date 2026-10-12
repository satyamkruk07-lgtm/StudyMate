export type PageId =
  | 'dashboard'
  | 'library'
  | 'tutor'
  | 'quiz'
  | 'mastery'
  | 'roadmap'
  | 'evaluation';

export type FileType = 'pdf' | 'pptx' | 'txt' | 'transcript' | 'mp4' | 'webm' | 'video';

export type ProcessingStatus = 'ready' | 'processing' | 'indexing' | 'error';

export interface DocumentChunk {
  id: string;
  chunkIndex: number;
  content: string;
  location: string; // e.g. "Page 14", "Slide 8", "04:12"
  keywords: string[];
}

export interface LearningResource {
  id: string;
  title: string;
  fileType: FileType;
  fileName: string;
  fileSize: string;
  topic: string;
  uploadDate: string;
  status: ProcessingStatus;
  chunkCount: number;
  summary: string;
  chunks: DocumentChunk[];
  authorOrSource?: string;
}

export interface CitationReference {
  resourceId: string;
  resourceTitle: string;
  fileType: FileType;
  location: string; // e.g. "p. 42", "Slide 14", "14:28"
  snippet: string;
  confidenceScore: number; // e.g. 0.94
}

export interface ChatMessage {
  id: string;
  sender: 'student' | 'tutor';
  text: string;
  timestamp: string;
  isGrounded: boolean; // True if answer is verified from learning library
  citations?: CitationReference[];
  suggestedFollowUps?: string[];
  unverifiedReason?: string; // Reason if question cannot be answered from library
  topicTag?: string;
}

export type QuestionType = 'mcq' | 'short-answer' | 'numerical';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  topic: string;
  subtopic: string;
  difficulty: DifficultyLevel;
  prompt: string;
  explanation: string;
  citation: CitationReference;
}

export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: string[];
  correctOptionIndex: number;
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short-answer';
  acceptableKeywords: string[];
  sampleModelAnswer: string;
}

export interface NumericalQuestion extends BaseQuestion {
  type: 'numerical';
  correctValue: number;
  tolerance: number; // e.g., +- 0.05
  unit?: string;
  formulaHint?: string;
}

export type QuizQuestion = MCQQuestion | ShortAnswerQuestion | NumericalQuestion;

export interface QuizAttempt {
  id: string;
  topic: string;
  difficulty: DifficultyLevel;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  completedAt: string;
  timeSpentSeconds: number;
  questionResults: {
    questionId: string;
    questionPrompt: string;
    questionType: QuestionType;
    userAnswer: string;
    isCorrect: boolean;
    explanation: string;
    citation: CitationReference;
  }[];
}

export interface TopicMastery {
  id: string;
  topicName: string;
  category: string;
  masteryPercentage: number; // 0 - 100
  questionsAttempted: number;
  lastStudied: string;
  status: 'strong' | 'moderate' | 'weak';
  recommendedAction: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedHours: number;
  prerequisites: string[]; // ids of prereq nodes
  status: 'completed' | 'in-progress' | 'locked';
  masteryPercentage: number;
  linkedResourceIds: string[];
  keyConcepts: string[];
}

export interface EvaluationMetric {
  id: string;
  name: string;
  category: string;
  score: number; // e.g. 94.6%
  benchmarkTarget: number; // e.g. 90.0%
  description: string;
  evaluationMethod: string;
  isMeasuredBenchmark: boolean; // True = measured test suite, False = illustrative telemetry
  datasetSampleCount: number;
  historicalTrend: number[];
}

export interface EvaluationTestCase {
  id: string;
  query: string;
  topic: string;
  retrievedDocs: string;
  groundTruthFact: string;
  generatedAnswer: string;
  citationCorrect: boolean;
  faithfulnessScore: number; // 0.0 - 1.0
  outOfDomainHandled: boolean;
  isMeasured: boolean;
  latencyMs: number;
}

export interface BackendQuizQuestion {
  id: string;
  question_index: number;
  prompt: string;
  question_type: QuestionType;
  topic: string;
  difficulty: DifficultyLevel;
  options?: string[];
  unit?: string;
  tolerance?: number;
  source_doc_name: string;
  source_location: string;
  source_snippet: string;
}

export interface BackendQuiz {
  id: string;
  title: string;
  topic: string;
  difficulty: DifficultyLevel;
  question_count: number;
  created_at: string;
  questions: BackendQuizQuestion[];
}

export interface BackendAttemptResult {
  attempt_id: string;
  quiz_id: string;
  topic: string;
  difficulty: DifficultyLevel;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  time_spent_seconds: number;
  completed_at: string;
  question_results: {
    id: string;
    question_id: string;
    question_prompt: string;
    question_type: QuestionType;
    user_answer: string;
    expected_answer: string;
    is_correct: boolean;
    score: number;
    feedback: string;
    misconception?: string;
    evaluated_by: string;
    source_doc_name: string;
    source_location: string;
    source_snippet: string;
  }[];
}

export interface BackendTopicMastery {
  topic: string;
  category: string;
  alpha: number;
  beta: number;
  mastery_percentage: number;
  total_attempts: number;
  correct_attempts: number;
  status: 'strong' | 'weak' | 'developing' | 'insufficient_history';
  trend: 'improving' | 'stable' | 'declining';
  last_attempt_at?: string;
}

export interface BackendRecommendation {
  id: string;
  type: 'weakness_revision' | 'concept_remediation' | 'progression' | 'diagnostic_probe';
  topic: string;
  title: string;
  action: string;
  recommended_difficulty: DifficultyLevel;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  metrics?: Record<string, any>;
  source_reference?: {
    document: string;
    location: string;
  };
}

