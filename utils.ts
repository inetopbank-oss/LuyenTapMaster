import { Question, Difficulty, QuestionType } from './types';

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

// --- HELPER: Clean JSON String ---
export function cleanJsonString(str: string): string {
    if (!str) return "";
    let cleaned = str;

    // 1. Remove BOM (Byte Order Mark) usually found in Windows files
    if (cleaned.charCodeAt(0) === 0xFEFF) {
        cleaned = cleaned.slice(1);
    }

    // 2. Remove Markdown Code Blocks (e.g., ```json ... ```)
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?|```$/gm, '');

    // 3. Remove JS-style comments (// comment) - careful not to remove urls http://
    // Simple regex for line comments that aren't URLs
    cleaned = cleaned.replace(/^[ \t]*\/\/.*/gm, '');

    return cleaned.trim();
}

// --- HELPER: Find Array in Object (Deep Search) ---
function findQuestionArray(obj: any): any[] | null {
    if (Array.isArray(obj)) return obj;
    if (!obj || typeof obj !== 'object') return null;

    // 1. Common keys
    const keys = ['questions', 'data', 'items', 'quiz', 'exam', 'content', 'list'];
    for (const key of keys) {
        if (Array.isArray(obj[key]) && obj[key].length > 0) {
            return obj[key];
        }
    }

    // 2. Iterate all keys to find ANY array that looks like questions
    for (const key in obj) {
        if (Array.isArray(obj[key]) && obj[key].length > 0) {
            // Heuristic: Check if the first item has "content", "question", "text" property
            const firstItem = obj[key][0];
            if (typeof firstItem === 'object' && (firstItem.content || firstItem.question || firstItem.text || firstItem.body)) {
                return obj[key];
            }
        }
        // 3. Recursive search (Go 1 level deeper)
        if (typeof obj[key] === 'object' && obj[key] !== null) {
             const found = findQuestionArray(obj[key]);
             if (found) return found;
        }
    }

    return null;
}

// --- NEW: MARKDOWN PARSER ---
export function parseMarkdownToQuestions(text: string): Question[] {
    const questions: Question[] = [];
    const cleanText = text.replace(/\r\n/g, '\n').trim();

    // Split by "Câu <number>" or "Bài <number>" or "Question <number>"
    // Regex looks for start of line or double newline, followed by keyword and number
    const blocks = cleanText.split(/(?:^|\n+)(?=(?:Câu|Bài|Question)\s+\d+[:.\s])/i).filter(b => b.trim());

    blocks.forEach((block, index) => {
        if (!block.trim()) return;

        // 1. Extract ID/Title and Content
        // Example: "Câu 1: Hàm số nào..." -> Title: "Câu 1", Content: "Hàm số nào..."
        let content = block.trim();
        const titleMatch = block.match(/^(?:Câu|Bài|Question)\s+\d+[:.\s]*/i);
        
        if (titleMatch) {
            // Remove the "Câu 1:" part from content to keep it clean
            content = content.substring(titleMatch[0].length).trim();
        }

        // 2. Extract Options (A. B. C. D.)
        // We look for lines starting with A. B. C. D.
        const options: string[] = [];
        const optionMatches = [...content.matchAll(/(?:^|\n)([A-D])[.։)]\s+([\s\S]*?)(?=(?:\n[A-D][.։)]\s+)|(?:\n(?:Lời giải|Hướng dẫn|Đáp án|Chọn)[:\s])|$)/gi)];
        
        if (optionMatches.length > 0) {
            // Found options, remove them from content to leave just the question text
            const firstOptionIndex = optionMatches[0].index;
            if (firstOptionIndex !== undefined) {
                // Determine cut-off point for content (before the first option)
                // We need to find the relative index in the 'content' string
                // The regex match index is relative to the string passed to matchAll
                // Since we might have sliced content earlier, let's be careful.
                
                // Simpler approach: Split content by the first option pattern
                const splitParts = content.split(/(?:^|\n)[A-D][.։)]\s+/);
                if (splitParts.length > 0) {
                    content = splitParts[0].trim();
                }
            }

            // Normalize options
            optionMatches.forEach(match => {
                const label = match[1].toUpperCase();
                const optContent = match[2].trim();
                options.push(`${label}. ${optContent}`);
            });
        }

        // 3. Extract Correct Answer
        let correctAnswer = '';
        // Look for "Đáp án: A" or "Chọn A" or "Key: A" at the end of block or inside explanation
        const answerMatch = block.match(/(?:Đáp án|Chọn|Key|Ans)[:\s]*([A-D])/i);
        if (answerMatch) {
            correctAnswer = answerMatch[1].toUpperCase();
        }

        // 4. Extract Explanation
        let explanation = '';
        const explMatch = block.match(/(?:Lời giải|Hướng dẫn|Giải thích)[:\s]*([\s\S]*)/i);
        if (explMatch) {
            explanation = explMatch[1].trim();
            // If explanation contains the answer key line, try to remove it to be clean? 
            // Optional, but usually explanation comes after options.
        }

        // 5. Detect Difficulty (basic heuristic)
        let difficulty: Difficulty = 'NB';
        if (block.match(/Vận dụng cao|VDC/i)) difficulty = 'VDC';
        else if (block.match(/Vận dụng|VD/i)) difficulty = 'VD';
        else if (block.match(/Thông hiểu|TH/i)) difficulty = 'TH';

        questions.push({
            id: `md-${Date.now()}-${index}`,
            content: content,
            type: 'MCQ', // Default to MCQ for markdown import
            difficulty: difficulty,
            options: options.length === 4 ? options : options, // Keep whatever we found
            correctAnswer: correctAnswer,
            explanation: explanation,
            grade: 12 // Default
        });
    });

    return questions;
}

export function normalizeQuestions(input: any): Question[] {
  let rawList: any[] = [];
  
  // 1. Try to find the array using deep search
  const foundArray = findQuestionArray(input);
  
  if (foundArray) {
      rawList = foundArray;
  } else if (input && typeof input === 'object') {
     // If input is a single object that looks like a question, wrap it
     if (input.content || input.text || input.question) {
         rawList = [input];
     }
  }

  // If still empty, perhaps logic failed or empty input
  if (!rawList || rawList.length === 0) return [];

  return rawList.map((q, index) => {
    // 1. Difficulty normalization
    const difficulty = normalizeDifficulty(q.difficulty || q.level);

    // 2. Options & Correct Answer normalization
    let options: string[] = [];
    let correctAnswer = '';

    const rawOptions = q.options || q.answers || q.choices;

    if (Array.isArray(rawOptions) && rawOptions.length > 0) {
        // Case A: Options are objects { id: string, content: string }
        if (typeof rawOptions[0] === 'object' && rawOptions[0] !== null) {
            const correctId = q.correctOptionId || q.correct_answer_id;
            let foundIndex = -1;

            options = rawOptions.map((opt: any, idx: number) => {
                // Check if this option ID matches the correctOptionId
                if (correctId !== undefined && (opt.id == correctId || opt.id === q.correctAnswer)) {
                    foundIndex = idx;
                }
                // Convert content to standardized "A. Content" format
                const label = String.fromCharCode(65 + idx); // A, B, C...
                const txt = opt.content || opt.text || opt.value || '';
                return `${label}. ${txt}`;
            });

            // Set correct answer based on the index of the matching ID
            if (foundIndex !== -1) {
                correctAnswer = String.fromCharCode(65 + foundIndex);
            } else {
                // Fallback: Check if correctAnswer field exists directly and matches A, B, C, D
                if (correctId && ['A','B','C','D'].includes(String(correctId))) {
                    correctAnswer = String(correctId);
                } else if (q.correctAnswer) {
                    correctAnswer = String(q.correctAnswer);
                }
            }
        } 
        // Case B: Options are simple strings
        else {
            options = rawOptions.map((opt: string) => String(opt));
            
            // Determine Correct Answer for string arrays
            const correctId = q.correctOptionId || q.correct_answer_id;
            
            if (typeof correctId === 'number') {
                // e.g. 0 -> A
                correctAnswer = String.fromCharCode(65 + correctId);
            } else if (correctId !== undefined && correctId !== null) {
                // e.g. "0" -> A, "A" -> A
                const strId = String(correctId);
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
    const rawExp = q.explanation || q.solution || q.loigiai || q.loi_giai || q.guide || q.huongdan;
    if (rawExp) {
        if (typeof rawExp === 'object') {
             // Support for structured explanation { short: string, full: string }
             explanation = rawExp.full || rawExp.short || JSON.stringify(rawExp);
        } else {
             explanation = String(rawExp);
        }
    }

    // 4. Lesson/Chapter normalization
    const lesson = q.lesson || q.chapter || q.bai || q.chuong || '';
    
    // 5. Content normalization (flexible keys)
    const content = q.content || q.text || q.question || q.body || '';

    return {
      id: q.id ? String(q.id) : `q-${index}`,
      content: content,
      type: (q.type as QuestionType) || 'MCQ',
      difficulty: difficulty,
      options: options,
      correctAnswer: correctAnswer,
      explanation: explanation,
      lesson: lesson,
      topic: q.topic,
      grade: q.grade
    };
  });
}