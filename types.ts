export type QuestionType = 'MCQ' | 'Essay' | 'TF' | 'SA';
export type Difficulty = 'NB' | 'TH' | 'VD' | 'VDC';

export interface Question {
  id: string;
  content: string;
  type: QuestionType;
  difficulty: Difficulty;
  options?: string[]; // Mostly for MCQ
  correctAnswer?: string;
  explanation?: string;
}

export interface UserInfo {
  name: string;
  class: string;
}

export interface ExamResultLog {
  id: string;
  timestamp: number;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  mode: 'CUSTOM' | 'STANDARD';
}

export interface ExamConfig {
  mode: 'CUSTOM' | 'STANDARD'; // STANDARD = 50-30-20
  difficulty: Difficulty | 'ALL';
  questionTypes: QuestionType[]; // Changed to array for multi-select
  limit: number;
  durationMinutes: number;
}

export interface ExamState {
  status: 'LOGIN' | 'UPLOAD' | 'CONFIG' | 'RUNNING' | 'RESULT';
  userInfo: UserInfo | null;
  originalQuestions: Question[];
  activeQuestions: Question[];
  userAnswers: Record<string, string>; // questionId -> answer
  startTime: number | null;
  endTime: number | null;
  config: ExamConfig;
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  NB: 'Nhận biết',
  TH: 'Thông hiểu',
  VD: 'Vận dụng',
  VDC: 'Vận dụng cao',
  ALL: 'Tất cả mức độ'
};

export const TYPE_LABELS: Record<string, string> = {
  MCQ: 'Trắc nghiệm',
  Essay: 'Tự luận',
  TF: 'Đúng/Sai',
  SA: 'Trả lời ngắn',
  ALL: 'Tất cả loại câu hỏi'
};