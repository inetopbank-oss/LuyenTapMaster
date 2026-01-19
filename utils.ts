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

const normalizeDifficulty = (val: any): Difficulty => {
    if (!val) return 'NB';
    const s = String(val).toUpperCase();
    if (s === 'NB' || s.includes('NHẬN BIẾT')) return 'NB';
    if (s === 'TH' || s.includes('THÔNG HIỂU')) return 'TH';
    if (s === 'VDC' || s.includes('VẬN DỤNG CAO')) return 'VDC'; // Check VDC before VD
    if (s === 'VD' || s.includes('VẬN DỤNG')) return 'VD';
    return 'NB'; // Default
};

export function normalizeQuestions(input: any): Question[] {
  let data: any[] = [];
  
  // Handle both array input (legacy) and object input (new format with metadata)
  if (Array.isArray(input)) {
    data = input;
  } else if (input && typeof input === 'object') {
     if (Array.isArray(input.questions)) {
         data = input.questions;
     } else if (input.content && input.options) {
         // Handle single question object input directly
         data = [input];
     }
  }

  return data.map((q, index) => {
    // 1. Difficulty normalization
    const difficulty = normalizeDifficulty(q.difficulty);

    // 2. Options & Correct Answer normalization
    let options: string[] = [];
    let correctAnswer = '';

    if (Array.isArray(q.options) && q.options.length > 0) {
        // Case A: Options are objects { id: string, content: string }
        if (typeof q.options[0] === 'object' && q.options[0] !== null) {
            const correctId = q.correctOptionId;
            let foundIndex = -1;

            options = q.options.map((opt: any, idx: number) => {
                // Check if this option ID matches the correctOptionId
                if (correctId !== undefined && (opt.id == correctId || opt.id === q.correctAnswer)) {
                    foundIndex = idx;
                }
                // Convert content to standardized "A. Content" format
                const label = String.fromCharCode(65 + idx); // A, B, C...
                return `${label}. ${opt.content || ''}`;
            });

            // Set correct answer based on the index of the matching ID
            if (foundIndex !== -1) {
                correctAnswer = String.fromCharCode(65 + foundIndex);
            } else {
                // Fallback: Check if correctAnswer field exists directly and matches A, B, C, D
                if (q.correctOptionId && ['A','B','C','D'].includes(String(q.correctOptionId))) {
                    correctAnswer = String(q.correctOptionId);
                } else if (q.correctAnswer) {
                    correctAnswer = String(q.correctAnswer);
                }
            }
        } 
        // Case B: Options are simple strings
        else {
            options = q.options.map((opt: string) => String(opt));
            
            // Determine Correct Answer for string arrays
            if (typeof q.correctOptionId === 'number') {
                // e.g. 0 -> A
                correctAnswer = String.fromCharCode(65 + q.correctOptionId);
            } else if (q.correctOptionId !== undefined && q.correctOptionId !== null) {
                // e.g. "0" -> A, "A" -> A
                const strId = String(q.correctOptionId);
                const numId = parseInt(strId);
                // If it looks like an index (0-9)
                if (!isNaN(numId) && numId >= 0 && numId < 10 && strId.length === 1) {
                     correctAnswer = String.fromCharCode(65 + numId);
                } else {
                     correctAnswer = strId;
                }
            } else if (q.correctAnswer) {
                correctAnswer = String(q.correctAnswer);
            }
        }
    }

    // 3. Explanation normalization
    let explanation = '';
    if (q.explanation) {
        if (typeof q.explanation === 'object') {
             // Support for structured explanation { short: string, full: string }
             explanation = q.explanation.full || q.explanation.short || '';
        } else {
             explanation = String(q.explanation);
        }
    } else {
        // Legacy fallback keys
        explanation = q.solution || q.loigiai || q.loi_giai || q.guide || q.huongdan || '';
    }

    // 4. Lesson/Chapter normalization
    const lesson = q.lesson || q.chapter || q.bai || q.chuong || '';

    return {
      id: q.id ? String(q.id) : `q-${index}`,
      content: q.content || q.text || '',
      type: q.type || 'MCQ',
      difficulty: difficulty,
      options: options,
      correctAnswer: correctAnswer,
      explanation: explanation,
      lesson: lesson
    };
  });
}