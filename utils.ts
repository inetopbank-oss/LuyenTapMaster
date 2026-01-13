import { Question, Difficulty } from './types';

// Fisher-Yates shuffle
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  'Nhận biết': 'NB',
  'Thông hiểu': 'TH',
  'Vận dụng': 'VD',
  'Vận dụng cao': 'VDC',
  'NB': 'NB',
  'TH': 'TH',
  'VD': 'VD',
  'VDC': 'VDC'
};

export function normalizeQuestions(input: any): Question[] {
  let data: any[] = [];
  
  // Handle both array input (legacy) and object input (new format with metadata)
  if (Array.isArray(input)) {
    data = input;
  } else if (input && typeof input === 'object' && Array.isArray(input.questions)) {
    data = input.questions;
  }

  return data.map((q, index) => {
    // Normalize Options
    // Convert object-based options (id, content) to string format "ID. Content" to match UI components
    let options: string[] = [];
    if (Array.isArray(q.options)) {
      if (q.options.length > 0 && typeof q.options[0] === 'object') {
         options = q.options.map((opt: any, optIdx: number) => {
             const id = opt.id || String.fromCharCode(65 + optIdx);
             return `${id}. ${opt.content}`;
         });
      } else {
         options = q.options;
      }
    }

    // Normalize Difficulty (Map Vietnamese text to Code)
    const diffInput = q.difficulty || 'NB';
    const difficulty: Difficulty = DIFFICULTY_MAP[diffInput] || 'NB';

    // Normalize Correct Answer
    // Logic: 
    // 1. If correctOptionId is present and is a number, map it to A, B, C...
    // 2. If correctOptionId is a string, use it.
    // 3. Fallback to correctAnswer field.
    let correctAnswer = '';
    
    if (typeof q.correctOptionId === 'number') {
        correctAnswer = String.fromCharCode(65 + q.correctOptionId);
    } else if (q.correctOptionId !== undefined && q.correctOptionId !== null) {
        correctAnswer = String(q.correctOptionId);
    } else if (q.correctAnswer !== undefined && q.correctAnswer !== null) {
        correctAnswer = String(q.correctAnswer);
    }

    // Normalize Explanation: Check common field names
    const explanation = q.explanation || q.solution || q.loigiai || q.loi_giai || q.guide || q.huongdan || '';

    return {
      id: q.id ? String(q.id) : `q-${index}`,
      content: q.content || q.text || '',
      type: q.type || 'MCQ',
      difficulty: difficulty,
      options: options,
      correctAnswer: correctAnswer,
      explanation: explanation
    };
  });
}