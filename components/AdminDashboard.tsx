import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Database, FileDown, LogOut, Layers, Settings, Trash2, BookOpen, Save, Bot, Sparkles, BrainCircuit, ArrowRight, Loader2, Filter, CheckCircle, Check, AlertTriangle, Square, CopyMinus, Wrench, Eye } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Question, Difficulty, QuestionType } from '../types';
import { shuffleArray, normalizeQuestions } from '../utils';
import MathText from './MathText';

interface AdminDashboardProps {
  questionBank: Question[];
  onLogout: () => void;
}

interface MatrixConfig {
  NB: number;
  TH: number;
  VD: number;
  VDC: number;
}

// AI Generator Types
interface AIConfig {
    grade: number; // 10, 11, 12
    topic: string;
    selectedMathTypes: string[];
    difficulty: Difficulty[];
    questionTypes: QuestionType[];
    count: number;
}

// Latex Error Interface
interface LatexErrorItem {
    question: Question;
    errors: string[]; // List of specific errors found
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ questionBank, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'GENERATE' | 'MANAGE' | 'AI_CREATOR'>('AI_CREATOR');
  
  // --- STATE FOR MANAGER (Creator) ---
  const [managedBank, setManagedBank] = useState<Question[]>(questionBank);
  
  // Filters for Manager
  const [filterGrade, setFilterGrade] = useState<number | 'ALL'>('ALL');
  const [filterTopic, setFilterTopic] = useState('');

  // --- NEW: DUPLICATE MANAGEMENT STATE ---
  const [duplicateMode, setDuplicateMode] = useState(false);
  const [duplicatesFound, setDuplicatesFound] = useState<Question[]>([]);
  
  // --- NEW: LATEX ERROR MANAGEMENT STATE ---
  const [fixLatexMode, setFixLatexMode] = useState(false);
  const [latexErrorItems, setLatexErrorItems] = useState<LatexErrorItem[]>([]);
  const [currentFixIndex, setCurrentFixIndex] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [scanMessage, setScanMessage] = useState<{type: 'success' | 'info' | 'error', text: string} | null>(null);
  
  // --- STATE FOR EXAM GENERATOR ---
  const [examTitle, setExamTitle] = useState('Đề kiểm tra Toán');
  const [duration, setDuration] = useState(45);
  const [matrix, setMatrix] = useState<MatrixConfig>({ NB: 12, TH: 10, VD: 6, VDC: 2 });
  const [genError, setGenError] = useState<string | null>(null);

  // --- STATE FOR AI CREATOR ---
  const [aiStep, setAiStep] = useState<1 | 2 | 3 | 4>(1); // 1: Context, 2: Analyze, 3: Config, 4: Review
  const [aiConfig, setAiConfig] = useState<AIConfig>({
      grade: 12,
      topic: '',
      selectedMathTypes: [],
      difficulty: ['NB', 'TH', 'VD', 'VDC'],
      questionTypes: ['MCQ'],
      count: 10
  });
  const [suggestedTypes, setSuggestedTypes] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState<{current: number, total: number} | null>(null);

  const shouldStopRef = useRef(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  // Clear scan message after 3 seconds
  useEffect(() => {
      if (scanMessage) {
          const timer = setTimeout(() => setScanMessage(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [scanMessage]);

  // Sync editingQuestion when index changes or list changes
  useEffect(() => {
      if (fixLatexMode && latexErrorItems.length > 0) {
          // Deep copy to allow editing without mutating state immediately
          setEditingQuestion(JSON.parse(JSON.stringify(latexErrorItems[currentFixIndex].question)));
      } else {
          setEditingQuestion(null);
      }
  }, [currentFixIndex, fixLatexMode, latexErrorItems]);

  // Analyze Managed Bank (Dynamic)
  const stats = useMemo(() => {
    return {
      NB: managedBank.filter(q => q.difficulty === 'NB').length,
      TH: managedBank.filter(q => q.difficulty === 'TH').length,
      VD: managedBank.filter(q => q.difficulty === 'VD').length,
      VDC: managedBank.filter(q => q.difficulty === 'VDC').length,
      Total: managedBank.length
    };
  }, [managedBank]);

  // --- HELPER FUNCTIONS ---
  const downloadJSON = (data: any, filename: string) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const cleanJsonString = (str: string) => {
      let cleaned = str.replace(/```json\n?|```\n?/g, '');
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
      return cleaned.trim();
  };

  // --- LATEX VALIDATION LOGIC ---
  const checkLatexString = (str: string, label: string): string[] => {
      if (!str) return [];
      const errors: string[] = [];

      // 1. Check balanced dollar signs $
      const dollarCount = (str.match(/\$/g) || []).length;
      if (dollarCount % 2 !== 0) {
          errors.push(`${label}: Số lượng dấu $ lẻ (có thể chưa đóng Math Mode).`);
      }

      // 2. Check balanced curly braces {}
      let braceBalance = 0;
      for (let i = 0; i < str.length; i++) {
          if (str[i] === '{' && str[i-1] !== '\\') braceBalance++; 
          if (str[i] === '}' && str[i-1] !== '\\') braceBalance--;
          if (braceBalance < 0) {
              errors.push(`${label}: Dư dấu đóng ngoặc } ở vị trí ${i}.`);
              break; 
          }
      }
      if (braceBalance > 0) {
          errors.push(`${label}: Thiếu ${braceBalance} dấu đóng ngoặc }.`);
      }
      
      return errors;
  };

  const handleScanLatex = () => {
      const errorItems: LatexErrorItem[] = [];

      managedBank.forEach(q => {
          let qErrors: string[] = [];
          
          qErrors = [...qErrors, ...checkLatexString(q.content, 'Nội dung')];
          
          q.options?.forEach((opt, idx) => {
              qErrors = [...qErrors, ...checkLatexString(opt, `Đáp án ${idx + 1}`)];
          });

          if (q.explanation) {
              qErrors = [...qErrors, ...checkLatexString(q.explanation, 'Lời giải')];
          }

          if (qErrors.length > 0) {
              errorItems.push({ question: q, errors: qErrors });
          }
      });

      if (errorItems.length > 0) {
          setLatexErrorItems(errorItems);
          setFixLatexMode(true);
          setCurrentFixIndex(0);
          setScanMessage({ type: 'info', text: `Tìm thấy ${errorItems.length} câu hỏi có lỗi cú pháp LaTeX.` });
      } else {
          setScanMessage({ type: 'success', text: 'Tuyệt vời! Không tìm thấy lỗi cú pháp LaTeX nào.' });
      }
  };

  const handleSaveFixedQuestion = () => {
      if (!editingQuestion) return;

      setManagedBank(prev => prev.map(q => q.id === editingQuestion.id ? editingQuestion : q));
      
      const newErrors = [...latexErrorItems];
      newErrors.splice(currentFixIndex, 1);
      
      setLatexErrorItems(newErrors);
      
      if (currentFixIndex >= newErrors.length) {
          setCurrentFixIndex(Math.max(0, newErrors.length - 1));
      }

      if (newErrors.length === 0) {
          setFixLatexMode(false);
          setScanMessage({ type: 'success', text: "Đã sửa hết các lỗi LaTeX!" });
      } else {
          setScanMessage({ type: 'success', text: "Đã lưu sửa đổi." });
      }
  };

  const handleIgnoreError = () => {
       const newErrors = [...latexErrorItems];
       newErrors.splice(currentFixIndex, 1);
       setLatexErrorItems(newErrors);
       
       if (currentFixIndex >= newErrors.length) {
           setCurrentFixIndex(Math.max(0, newErrors.length - 1));
       }

       if (newErrors.length === 0) {
           setFixLatexMode(false);
       }
  };


  // --- AI LOGIC (Unchanged) ---
  const handleAnalyzeTopic = async () => {
      if (!aiConfig.topic.trim()) {
          setAiError("Vui lòng nhập chủ đề bài học.");
          return;
      }
      setIsAnalyzing(true);
      setAiError(null);

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const model = ai.models;
          
          const prompt = `
            Đóng vai trò là Giáo viên Toán THPT Việt Nam.
            Hãy phân tích bài học: "${aiConfig.topic}" thuộc chương trình Toán Lớp ${aiConfig.grade} (Sách Kết nối tri thức).
            Liệt kê các "Dạng toán" (Math Types) cụ thể, chi tiết thường gặp trong bài này để ôn luyện hoặc kiểm tra.
            Trả về kết quả dưới dạng JSON object với key "types" là mảng các chuỗi.
            Ví dụ: { "types": ["Tìm tập xác định", "Tính đạo hàm", "Xét tính đơn điệu"] }
          `;

          const result = await model.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
              config: { responseMimeType: 'application/json' }
          });

          const responseText = result.text;
          if (!responseText) throw new Error("AI không phản hồi.");

          const cleanedText = cleanJsonString(responseText);
          const json = JSON.parse(cleanedText);
          
          if (json.types && Array.isArray(json.types)) {
              setSuggestedTypes(json.types);
              setAiStep(2);
          } else {
              throw new Error("Invalid format from AI");
          }

      } catch (err: any) {
          console.error(err);
          setAiError("Lỗi phân tích AI: " + (err.message || "Không phản hồi đúng định dạng."));
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleStopGeneration = () => {
      shouldStopRef.current = true;
  };

  const handleGenerateQuestions = async () => {
      setIsGenerating(true);
      setAiError(null);
      setGeneratedQuestions([]);
      shouldStopRef.current = false;

      const totalNeeded = aiConfig.count;
      setGenProgress({ current: 0, total: totalNeeded });

      const BATCH_SIZE = 5;
      let currentCount = 0;
      let allNewQuestions: Question[] = [];

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const model = ai.models;

          const mathTypesStr = aiConfig.selectedMathTypes.length > 0 
            ? aiConfig.selectedMathTypes.join(", ") 
            : "Tổng hợp các dạng cơ bản";

          while (currentCount < totalNeeded) {
              if (shouldStopRef.current) break;

              const currentBatchSize = Math.min(BATCH_SIZE, totalNeeded - currentCount);
              
              const prompt = `
                Tạo ${currentBatchSize} câu hỏi Toán Lớp ${aiConfig.grade}.
                Chủ đề: ${aiConfig.topic}.
                Các dạng toán cần tập trung: ${mathTypesStr}.
                Mức độ phân hóa: ${aiConfig.difficulty.join(", ")}.
                Loại câu hỏi: ${aiConfig.questionTypes.join(", ")}.
                
                Yêu cầu:
                1. Nội dung tuân thủ chương trình SGK mới (Kết nối tri thức).
                2. Trả về JSON Array các object câu hỏi.
                3. Cấu trúc mỗi object (Question Interface):
                   - id: string (random unique)
                   - content: string (Nội dung câu hỏi, dùng LaTeX cho công thức toán, ví dụ $x^2$)
                   - type: "MCQ" | "Essay" | "TF" | "SA"
                   - difficulty: "NB" | "TH" | "VD" | "VDC"
                   - options: string[] (Nếu là MCQ, bắt buộc 4 đáp án dạng ["A. Nội dung", "B. ..."])
                   - correctAnswer: string (Ví dụ "A", "B" hoặc đáp án text)
                   - explanation: string (Lời giải chi tiết, dùng LaTeX)
                   - lesson: string ("${aiConfig.topic}")
                   - grade: number (${aiConfig.grade})
                   - mathType: string (Ghi rõ dạng toán của câu này)
                4. QUAN TRỌNG: Tất cả dấu gạch chéo ngược (\\) trong LaTeX phải được escape đôi (\\\\) để đảm bảo đúng định dạng JSON.
              `;

              const result = await model.generateContent({
                  model: 'gemini-3-pro-preview',
                  contents: prompt,
                  config: { responseMimeType: 'application/json' }
              });

              const responseText = result.text;
              if (!responseText) throw new Error("AI không phản hồi.");

              const cleanedText = cleanJsonString(responseText);
              
              let json;
              try {
                  json = JSON.parse(cleanedText);
              } catch (e) {
                  console.warn("Initial JSON parse failed, attempting robust regex fix...");
                  let fixedText = cleanedText.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1');
                  fixedText = fixedText.replace(/\\u(?![0-9a-fA-F]{4})/g, '\\\\u');
                  fixedText = fixedText.replace(/\\(beta|frac|nu|rho|right|text|tan|theta|tau|times)/g, '\\\\$1');
                  try {
                      json = JSON.parse(fixedText);
                  } catch (e2) {
                      throw new Error("Không thể đọc dữ liệu JSON từ AI (Lỗi định dạng LaTeX). Vui lòng thử lại.");
                  }
              }
              
              const batchQuestions = normalizeQuestions(json) as Question[];

              const processedBatch: Question[] = batchQuestions.map((q: Question, idx: number) => ({
                  ...q,
                  id: `ai-${Date.now()}-${currentCount + idx}`,
                  options: q.options?.map((o: string) => /^[A-D]\./.test(o) ? o : `• ${o}`) || [],
                  grade: aiConfig.grade,
                  topic: aiConfig.topic
              }));

              allNewQuestions = [...allNewQuestions, ...processedBatch];
              currentCount += processedBatch.length; 

              setGenProgress({ current: currentCount, total: totalNeeded });
              setGeneratedQuestions([...allNewQuestions]);
              
              if (currentCount < totalNeeded) await new Promise(r => setTimeout(r, 500));
          }

          if (allNewQuestions.length > 0) {
              setAiStep(4);
          } else {
             setAiError("Đã dừng quá trình trước khi tạo được câu hỏi nào.");
          }

      } catch (err: any) {
          console.error(err);
          setAiError("Lỗi sinh câu hỏi: " + err.message);
      } finally {
          setIsGenerating(false);
          setGenProgress(null);
          shouldStopRef.current = false;
      }
  };

  const handleSaveToBank = () => {
      setManagedBank(prev => [...generatedQuestions, ...prev]);
      setGeneratedQuestions([]);
      setAiStep(1); 
      setActiveTab('MANAGE'); 
  };

  const handleDeleteGenerated = (idx: number) => {
      const newQs = [...generatedQuestions];
      newQs.splice(idx, 1);
      setGeneratedQuestions(newQs);
  };

  // --- DUPLICATE MANAGEMENT LOGIC ---

  const handleScanDuplicates = () => {
    const uniqueMap = new Map<string, Question>();
    const duplicates: Question[] = [];

    managedBank.forEach((q) => {
        const cleanContent = q.content.replace(/\s+/g, '').toLowerCase();
        let optionSig = '';
        if (q.options && q.options.length > 0) {
            const sortedOpts = [...q.options].sort().map(o => o.replace(/\s+/g, '').toLowerCase());
            optionSig = sortedOpts.join('|');
        }
        const signature = `${cleanContent}::${optionSig}`;

        if (uniqueMap.has(signature)) {
            duplicates.push(q); 
        } else {
            uniqueMap.set(signature, q);
        }
    });

    if (duplicates.length > 0) {
        setDuplicatesFound(duplicates);
        setDuplicateMode(true);
    } else {
        setScanMessage({ type: 'success', text: 'Tuyệt vời! Không tìm thấy câu hỏi nào bị trùng lặp.' });
    }
  };

  const handleConfirmDeduplicate = () => {
      const idsToRemove = new Set(duplicatesFound.map(d => d.id));
      setManagedBank(prev => prev.filter(q => !idsToRemove.has(q.id)));
      
      setScanMessage({ type: 'success', text: `Đã xóa thành công ${duplicatesFound.length} câu hỏi trùng lặp.` });
      setDuplicateMode(false);
      setDuplicatesFound([]);
  };

  const handleCancelDeduplicate = () => {
      setDuplicateMode(false);
      setDuplicatesFound([]);
  };

  // --- EXAM EXPORT LOGIC ---
  const handleExportExam = () => {
      const nbPool = managedBank.filter(q => q.difficulty === 'NB');
      const thPool = managedBank.filter(q => q.difficulty === 'TH');
      const vdPool = managedBank.filter(q => q.difficulty === 'VD');
      const vdcPool = managedBank.filter(q => q.difficulty === 'VDC');

      if (nbPool.length < matrix.NB) return setGenError(`Thiếu câu NB (Có ${nbPool.length}/${matrix.NB})`);
      if (thPool.length < matrix.TH) return setGenError(`Thiếu câu TH (Có ${thPool.length}/${matrix.TH})`);
      if (vdPool.length < matrix.VD) return setGenError(`Thiếu câu VD (Có ${vdPool.length}/${matrix.VD})`);
      if (vdcPool.length < matrix.VDC) return setGenError(`Thiếu câu VDC (Có ${vdcPool.length}/${matrix.VDC})`);

      const finalQs: Question[] = [
          ...shuffleArray(nbPool).slice(0, matrix.NB),
          ...shuffleArray(thPool).slice(0, matrix.TH),
          ...shuffleArray(vdPool).slice(0, matrix.VD),
          ...shuffleArray(vdcPool).slice(0, matrix.VDC),
      ];
      
      const diffOrder: Record<string, number> = { NB: 1, TH: 2, VD: 3, VDC: 4 };
      finalQs.sort((a,b) => (diffOrder[a.difficulty as string] || 0) - (diffOrder[b.difficulty as string] || 0));

      downloadJSON({
          title: examTitle,
          duration,
          questionCount: finalQs.length,
          questions: finalQs
      }, `De_KT_${Date.now()}.json`);
  };

  // --- RENDERERS ---

  const renderAICreator = () => (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
          {isGenerating && genProgress && (
              <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center animate-fade-in">
                  <div className="w-64 space-y-6 text-center">
                      <div className="relative w-24 h-24 mx-auto">
                          <svg className="w-full h-full transform -rotate-90">
                              <circle cx="48" cy="48" r="42" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                              <circle 
                                cx="48" cy="48" r="42" stroke="#4f46e5" strokeWidth="8" fill="none" 
                                strokeDasharray={264} 
                                strokeDashoffset={264 - (264 * (genProgress.current / genProgress.total))} 
                                className="transition-all duration-500"
                              />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-600 text-xl">
                               {Math.round((genProgress.current / genProgress.total) * 100)}%
                          </div>
                      </div>
                      <div>
                          <h3 className="text-xl font-black text-slate-800 mb-1">Đang soạn thảo...</h3>
                          <p className="text-lg font-bold text-indigo-600">
                             {genProgress.current} / {genProgress.total} câu
                          </p>
                          <p className="text-sm text-slate-400 mt-2">Đang sử dụng Gemini 3 Pro...</p>
                      </div>
                      <button 
                        onClick={handleStopGeneration}
                        className="px-6 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-full font-bold text-sm transition-colors flex items-center gap-2 mx-auto"
                      >
                          <Square size={14} fill="currentColor" /> Dừng lại
                      </button>
                  </div>
              </div>
          )}

          <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Sparkles className="text-indigo-600" /> Quy trình AI
                  </h3>
                  <div className="space-y-4 relative">
                      {[
                          { s: 1, label: "Chọn bài học" },
                          { s: 2, label: "Phân tích dạng toán" },
                          { s: 3, label: "Cấu hình" },
                          { s: 4, label: "Sinh câu hỏi & Duyệt" }
                      ].map((step, idx) => (
                          <div key={step.s} className={`flex items-center gap-3 relative z-10 ${aiStep >= step.s ? 'opacity-100' : 'opacity-40'}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${aiStep === step.s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : aiStep > step.s ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                  {aiStep > step.s ? <Check size={16} /> : step.s}
                              </div>
                              <span className={`font-bold text-sm ${aiStep === step.s ? 'text-indigo-700' : 'text-slate-600'}`}>{step.label}</span>
                          </div>
                      ))}
                      <div className="absolute top-4 left-4 w-px h-[calc(100%-2rem)] bg-slate-200 -z-0"></div>
                  </div>
              </div>

              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                  <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2"><Bot size={18}/> Trợ lý MathPro</h4>
                  <p className="text-indigo-700/80 text-sm">
                      {aiStep === 1 && "Hãy nhập tên bài học trong SGK, tôi sẽ giúp thầy/cô phân loại dạng toán."}
                      {aiStep === 2 && "Tôi tìm thấy các dạng toán sau. Hãy chọn những dạng cần ra đề."}
                      {aiStep === 3 && "Cấu hình độ khó và số lượng câu hỏi để tôi biên soạn."}
                      {aiStep === 4 && "Đã xong! Hãy kiểm tra kỹ nội dung trước khi lưu vào kho."}
                  </p>
              </div>
          </div>

          <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 min-h-[500px]">
                  {aiStep === 1 && (
                      <div className="space-y-6 animate-fade-in">
                          <h2 className="text-2xl font-black text-slate-800">Thông tin bài học</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Khối lớp</label>
                                  <div className="flex gap-2">
                                      {[10, 11, 12].map(g => (
                                          <button 
                                            key={g} 
                                            onClick={() => setAiConfig({...aiConfig, grade: g})}
                                            className={`flex-1 py-3 rounded-xl font-bold border transition-all ${aiConfig.grade === g ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                                          >
                                              Lớp {g}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chủ đề / Bài học (SGK)</label>
                                  <input 
                                    type="text"
                                    value={aiConfig.topic}
                                    onChange={(e) => setAiConfig({...aiConfig, topic: e.target.value})}
                                    placeholder="VD: Hàm số mũ, Tích phân,..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                                  />
                              </div>
                          </div>
                          <div className="pt-4">
                              <button 
                                onClick={handleAnalyzeTopic}
                                disabled={isAnalyzing || !aiConfig.topic}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                              >
                                  {isAnalyzing ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                                  {isAnalyzing ? 'Đang phân tích...' : 'AI Phân tích Dạng toán'}
                              </button>
                          </div>
                          {aiError && (
                              <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-bold animate-fade-in">
                                  <AlertTriangle size={18} /> {aiError}
                              </div>
                          )}
                      </div>
                  )}

                  {aiStep === 2 && (
                      <div className="space-y-6 animate-fade-in">
                           <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black text-slate-800">Chọn dạng toán</h2>
                                <button onClick={() => setAiStep(1)} className="text-sm font-bold text-slate-400 hover:text-slate-600">Quay lại</button>
                           </div>
                           <p className="text-slate-500">AI đề xuất các dạng toán sau cho chủ đề <strong>{aiConfig.topic}</strong>:</p>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
                               {suggestedTypes.map((type, idx) => {
                                   const isSelected = aiConfig.selectedMathTypes.includes(type);
                                   return (
                                       <button 
                                        key={idx}
                                        onClick={() => {
                                            const newTypes = isSelected 
                                                ? aiConfig.selectedMathTypes.filter(t => t !== type)
                                                : [...aiConfig.selectedMathTypes, type];
                                            setAiConfig({...aiConfig, selectedMathTypes: newTypes});
                                        }}
                                        className={`p-4 rounded-xl text-left border transition-all flex items-start gap-3 ${isSelected ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                                       >
                                           <div className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                                               {isSelected && <Check size={12} />}
                                           </div>
                                           <span className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{type}</span>
                                       </button>
                                   )
                               })}
                           </div>

                           <div className="pt-4 flex gap-4">
                               <button 
                                onClick={() => setAiConfig({...aiConfig, selectedMathTypes: []})}
                                className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                               >
                                   Bỏ chọn
                               </button>
                               <button 
                                onClick={() => setAiStep(3)}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                               >
                                   Tiếp tục <ArrowRight size={18} />
                               </button>
                           </div>
                      </div>
                  )}

                  {aiStep === 3 && (
                      <div className="space-y-8 animate-fade-in">
                          <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black text-slate-800">Cấu hình câu hỏi</h2>
                                <button onClick={() => setAiStep(2)} className="text-sm font-bold text-slate-400 hover:text-slate-600">Quay lại</button>
                           </div>

                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Mức độ nhận thức</label>
                               <div className="flex flex-wrap gap-3">
                                   {(['NB', 'TH', 'VD', 'VDC'] as Difficulty[]).map(d => {
                                       const isSel = aiConfig.difficulty.includes(d);
                                       return (
                                           <button
                                            key={d}
                                            onClick={() => {
                                                const newDiff = isSel ? aiConfig.difficulty.filter(x => x !== d) : [...aiConfig.difficulty, d];
                                                setAiConfig({...aiConfig, difficulty: newDiff});
                                            }}
                                            className={`px-4 py-2 rounded-lg font-bold border transition-all ${isSel ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                           >
                                               {d}
                                           </button>
                                       )
                                   })}
                               </div>
                           </div>

                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Loại câu hỏi</label>
                               <div className="flex flex-wrap gap-3">
                                   {[
                                       {v: 'MCQ', l: 'Trắc nghiệm (4 đáp án)'}, 
                                       {v: 'TF', l: 'Đúng/Sai'}, 
                                       {v: 'SA', l: 'Điền đáp số'},
                                       {v: 'Essay', l: 'Tự luận'}
                                    ].map(t => {
                                       const isSel = aiConfig.questionTypes.includes(t.v as QuestionType);
                                       return (
                                           <button
                                            key={t.v}
                                            onClick={() => {
                                                const newQt = isSel ? aiConfig.questionTypes.filter(x => x !== t.v) : [...aiConfig.questionTypes, t.v as QuestionType];
                                                setAiConfig({...aiConfig, questionTypes: newQt});
                                            }}
                                            className={`px-4 py-2 rounded-lg font-bold border transition-all ${isSel ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                           >
                                               {t.l}
                                           </button>
                                       )
                                   })}
                               </div>
                           </div>

                           <div>
                               <div className="flex justify-between mb-2">
                                   <label className="text-xs font-bold text-slate-500 uppercase">Số lượng câu hỏi</label>
                                   <span className="font-black text-indigo-600 text-lg">{aiConfig.count}</span>
                               </div>
                               <input 
                                type="range" min="1" max="100"
                                value={aiConfig.count}
                                onChange={(e) => setAiConfig({...aiConfig, count: parseInt(e.target.value)})}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                               />
                               <div className="flex justify-between text-xs text-slate-400 mt-1 font-bold">
                                   <span>1 câu</span>
                                   <span>100 câu (Max)</span>
                               </div>
                           </div>

                           <div className="pt-4">
                              {isGenerating ? (
                                  <button 
                                    onClick={handleStopGeneration}
                                    className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-xl shadow-rose-200 transition-all flex items-center justify-center gap-2"
                                  >
                                      <Square size={18} fill="currentColor" /> Dừng lại
                                  </button>
                              ) : (
                                  <button 
                                    onClick={handleGenerateQuestions}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                  >
                                      <Bot /> Tạo {aiConfig.count} câu hỏi
                                  </button>
                              )}
                          </div>
                      </div>
                  )}

                  {aiStep === 4 && (
                      <div className="h-full flex flex-col">
                           <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                        <CheckCircle className="text-emerald-500" /> Kết quả
                                    </h2>
                                    <p className="text-slate-500 text-sm">Đã tạo {generatedQuestions.length} câu hỏi.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setAiStep(3)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Cấu hình lại</button>
                                    <button 
                                        onClick={handleSaveToBank}
                                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md flex items-center gap-2"
                                    >
                                        <Save size={18} /> Lưu vào Kho
                                    </button>
                                </div>
                           </div>
                           
                           <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[600px] border border-slate-100 rounded-xl bg-slate-50 p-4">
                               {generatedQuestions.map((q, idx) => (
                                   <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm group">
                                       <div className="flex justify-between items-start mb-2">
                                           <div className="flex gap-2 items-center">
                                                <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded">#{idx + 1}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${q.difficulty === 'NB' ? 'bg-green-50 text-green-700 border-green-200' : q.difficulty === 'TH' ? 'bg-blue-50 text-blue-700 border-blue-200' : q.difficulty === 'VD' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{q.difficulty}</span>
                                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold border border-indigo-100">{q.mathType || 'Tổng hợp'}</span>
                                           </div>
                                           <button onClick={() => handleDeleteGenerated(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                       </div>
                                       <div className="text-sm font-medium text-slate-800 mb-3"><MathText content={q.content} /></div>
                                       {q.type === 'MCQ' && (
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                {q.options?.map((o, i) => (
                                                    <div key={i} className={`text-xs p-2 rounded border ${o.startsWith(q.correctAnswer || '###') ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                                        <MathText content={o} />
                                                    </div>
                                                ))}
                                            </div>
                                       )}
                                       {q.explanation && (
                                           <div className="text-xs bg-slate-50 p-3 rounded-lg text-slate-600 border border-slate-100">
                                               <strong className="text-slate-400 uppercase text-[10px] block mb-1">Lời giải:</strong>
                                               <MathText content={q.explanation} />
                                           </div>
                                       )}
                                   </div>
                               ))}
                           </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );

  const renderDuplicateReview = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                      <CopyMinus size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-orange-900 text-lg">Phát hiện {duplicatesFound.length} câu trùng lặp</h3>
                      <p className="text-orange-800/80 text-sm">
                          Dưới đây là danh sách các bản sao sẽ bị xóa. Hệ thống sẽ giữ lại bản gốc đầu tiên.
                          Vui lòng kiểm tra kỹ trước khi xác nhận.
                      </p>
                  </div>
              </div>
              <div className="flex gap-3 shrink-0 w-full md:w-auto">
                  <button 
                      onClick={handleCancelDeduplicate}
                      className="flex-1 md:flex-none px-6 py-3 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl transition-colors"
                  >
                      Hủy bỏ
                  </button>
                  <button 
                      onClick={handleConfirmDeduplicate}
                      className="flex-1 md:flex-none px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                      <Trash2 size={18} /> Xác nhận xóa
                  </button>
              </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-500 text-xs uppercase">
                  Danh sách câu hỏi cần xóa
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {duplicatesFound.map((q, idx) => (
                      <div key={q.id} className="p-5 hover:bg-slate-50 transition-colors opacity-75 hover:opacity-100">
                          <div className="flex gap-2 items-center mb-2">
                                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded">Sẽ xóa</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${q.difficulty === 'NB' ? 'bg-green-50 text-green-700 border-green-200' : q.difficulty === 'TH' ? 'bg-blue-50 text-blue-700 border-blue-200' : q.difficulty === 'VD' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{q.difficulty}</span>
                          </div>
                          <div className="text-sm text-slate-800 font-medium mb-2">
                                <MathText content={q.content} />
                          </div>
                          <div className="text-xs text-slate-400 font-mono">{q.id}</div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  const renderLatexFixer = () => {
      const errorItem = latexErrorItems[currentFixIndex];
      const question = editingQuestion || errorItem.question;

      return (
          <div className="space-y-6 animate-fade-in">
              {/* Header Fixer */}
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                      <div className="flex items-start gap-4">
                          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                              <Wrench size={24} />
                          </div>
                          <div>
                              <h3 className="font-bold text-amber-900 text-lg">Sửa lỗi LaTeX ({currentFixIndex + 1}/{latexErrorItems.length})</h3>
                              <p className="text-amber-800/80 text-sm mt-1">
                                  Phát hiện lỗi cú pháp. Vui lòng sửa trực tiếp bên dưới và xem trước kết quả.
                              </p>
                              {errorItem.errors.length > 0 && (
                                  <div className="mt-2 text-xs font-mono bg-white/50 text-rose-600 p-2 rounded border border-rose-100">
                                      {errorItem.errors.map((e, i) => <div key={i}>• {e}</div>)}
                                  </div>
                              )}
                          </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                          <button 
                              onClick={handleIgnoreError}
                              className="px-4 py-2 bg-white text-slate-500 hover:text-slate-700 font-bold rounded-lg border border-slate-200 text-sm"
                          >
                              Bỏ qua
                          </button>
                          <button 
                              onClick={handleSaveFixedQuestion}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md text-sm flex items-center gap-2"
                          >
                              <Save size={16} /> Lưu sửa đổi
                          </button>
                      </div>
                  </div>
              </div>

              {/* Editor Split View */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Editor */}
                  <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Nội dung câu hỏi (LaTeX)</label>
                          <textarea 
                              className="w-full h-40 p-3 font-mono text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-400 bg-slate-50"
                              value={question.content}
                              onChange={(e) => setEditingQuestion({...question, content: e.target.value})}
                          ></textarea>
                      </div>
                      
                      {question.options && (
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Đáp án (LaTeX)</label>
                              {question.options.map((opt, idx) => (
                                  <div key={idx} className="flex gap-2">
                                      <span className="shrink-0 w-8 h-10 flex items-center justify-center bg-slate-100 text-slate-500 font-bold text-xs rounded border border-slate-200">
                                          {String.fromCharCode(65 + idx)}
                                      </span>
                                      <input 
                                          className="flex-1 px-3 font-mono text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-400 bg-slate-50"
                                          value={opt}
                                          onChange={(e) => {
                                              const newOpts = [...(question.options || [])];
                                              newOpts[idx] = e.target.value;
                                              setEditingQuestion({...question, options: newOpts});
                                          }}
                                      />
                                  </div>
                              ))}
                          </div>
                      )}

                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Lời giải chi tiết (LaTeX)</label>
                          <textarea 
                              className="w-full h-32 p-3 font-mono text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-400 bg-slate-50"
                              value={question.explanation || ''}
                              onChange={(e) => setEditingQuestion({...question, explanation: e.target.value})}
                          ></textarea>
                      </div>
                  </div>

                  {/* Right: Preview */}
                  <div className="space-y-4">
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col">
                           <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                               <Eye size={20} className="text-indigo-600" />
                               <h4 className="font-bold text-slate-800">Xem trước hiển thị</h4>
                           </div>
                           
                           <div className="space-y-6">
                               <div>
                                   <div className="text-slate-400 text-xs font-bold uppercase mb-2">Câu hỏi</div>
                                   <div className="text-slate-800 font-medium text-lg leading-relaxed">
                                       <MathText content={question.content} block />
                                   </div>
                               </div>

                               {question.options && (
                                   <div className="grid grid-cols-1 gap-3">
                                       {question.options.map((opt, idx) => (
                                           <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
                                               <span className="font-bold text-slate-500 text-sm mt-0.5">{String.fromCharCode(65 + idx)}.</span>
                                               <div className="text-sm font-medium text-slate-700">
                                                   <MathText content={opt.replace(/^[A-D]\.\s*/, '')} />
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                               )}

                               {question.explanation && (
                                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                       <div className="text-slate-400 text-xs font-bold uppercase mb-2">Lời giải</div>
                                       <div className="text-slate-600 text-sm">
                                           <MathText content={question.explanation} block />
                                       </div>
                                   </div>
                               )}
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  const renderManager = () => {
      // Return Duplicate Review UI if active
      if (duplicateMode) {
          return renderDuplicateReview();
      }

      // Return Latex Fixer UI if active
      if (fixLatexMode) {
          return renderLatexFixer();
      }

      // Filter Logic
      const filteredQuestions = managedBank.filter(q => {
          const matchGrade = filterGrade === 'ALL' || q.grade === filterGrade;
          const matchTopic = !filterTopic || (q.topic?.toLowerCase().includes(filterTopic.toLowerCase()) || q.lesson?.toLowerCase().includes(filterTopic.toLowerCase()));
          return matchGrade && matchTopic;
      });

      return (
          <div className="space-y-6">
              {/* Toolbar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center relative">
                  
                  {/* Inline Scan Message (Instead of Alert) */}
                  {scanMessage && (
                      <div className={`absolute top-0 left-0 right-0 -mt-12 mx-auto w-fit px-6 py-2 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 animate-slide-up 
                        ${scanMessage.type === 'success' ? 'bg-emerald-600 text-white' : scanMessage.type === 'error' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'}`}>
                          {scanMessage.type === 'success' && <CheckCircle size={16} />}
                          {scanMessage.type === 'error' && <AlertTriangle size={16} />}
                          {scanMessage.type === 'info' && <Bot size={16} />}
                          {scanMessage.text}
                      </div>
                  )}

                  <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
                          <Filter size={18} className="text-slate-400" />
                          <select 
                            value={filterGrade} 
                            onChange={(e) => setFilterGrade(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                            className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 rounded-lg p-2 focus:outline-none"
                          >
                              <option value="ALL">Tất cả</option>
                              <option value="10">Lớp 10</option>
                              <option value="11">Lớp 11</option>
                              <option value="12">Lớp 12</option>
                          </select>
                      </div>
                      <div className="flex items-center gap-2 flex-1 w-full">
                          <div className="relative flex-1 group">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                  <Filter size={18} />
                              </div>
                              <input 
                                  type="text" 
                                  value={filterTopic}
                                  onChange={(e) => setFilterTopic(e.target.value)}
                                  placeholder="Tìm theo chủ đề, nội dung..."
                                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                              />
                          </div>
                      </div>
                      
                      <div className="flex gap-2 w-full md:w-auto">
                          <button 
                              onClick={handleScanLatex}
                              className="px-4 py-2 bg-white text-slate-600 hover:text-amber-600 border border-slate-200 hover:border-amber-300 font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
                              title="Kiểm tra lỗi cú pháp LaTeX"
                          >
                              <Wrench size={16} /> <span className="hidden md:inline">Check LaTeX</span>
                          </button>
                           <button 
                              onClick={handleScanDuplicates}
                              className="px-4 py-2 bg-white text-slate-600 hover:text-orange-600 border border-slate-200 hover:border-orange-300 font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
                              title="Quét câu hỏi trùng lặp"
                          >
                              <CopyMinus size={16} /> <span className="hidden md:inline">Check Trùng</span>
                          </button>
                      </div>
                  </div>

                  {/* Question List */}
              </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                          <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                              <Database size={14} /> Ngân hàng câu hỏi ({filteredQuestions.length})
                          </div>
                          <div className="flex gap-1">
                               {/* Difficulty Badges Summary */}
                               {['NB', 'TH', 'VD', 'VDC'].map(d => {
                                   const count = filteredQuestions.filter(q => q.difficulty === d).length;
                                   return count > 0 && (
                                       <span key={d} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                                           {d}: {count}
                                       </span>
                                   );
                               })}
                          </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {filteredQuestions.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                  <Filter size={48} className="mb-4 opacity-20" />
                                  <p>Không tìm thấy câu hỏi phù hợp bộ lọc.</p>
                              </div>
                          ) : (
                              filteredQuestions.slice(0, 50).map((q, idx) => ( // Pagination limit for performance
                                  <div key={q.id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all bg-white group">
                                      <div className="flex justify-between items-start mb-2">
                                           <div className="flex gap-2 items-center flex-wrap">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${q.difficulty === 'NB' ? 'bg-green-50 text-green-700 border-green-200' : q.difficulty === 'TH' ? 'bg-blue-50 text-blue-700 border-blue-200' : q.difficulty === 'VD' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{q.difficulty}</span>
                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold border border-slate-200">Lớp {q.grade}</span>
                                                {q.mathType && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold border border-indigo-100">{q.mathType}</span>}
                                                <span className="text-[10px] text-slate-400 font-mono ml-2">ID: {q.id}</span>
                                           </div>
                                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                               {/* Ideally Edit Logic Here - For now just Delete */}
                                                <button 
                                                    onClick={() => {
                                                        if(confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
                                                            setManagedBank(prev => prev.filter(item => item.id !== q.id));
                                                        }
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                           </div>
                                      </div>
                                      <div className="text-sm font-medium text-slate-800 line-clamp-3 mb-2">
                                           <MathText content={q.content} />
                                      </div>
                                      <div className="text-xs text-slate-500 italic">
                                          {q.topic || 'Chưa có chủ đề'}
                                      </div>
                                  </div>
                              ))
                          )}
                          {filteredQuestions.length > 50 && (
                              <div className="text-center text-xs text-slate-400 py-4">
                                  Đang hiển thị 50 / {filteredQuestions.length} câu hỏi. Hãy dùng bộ lọc để tìm kiếm chi tiết.
                              </div>
                          )}
                      </div>
                  </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
       {/* Top Bar */}
       <header className="bg-white border-b border-slate-200 sticky top-0 z-40 h-16 flex items-center px-6 justify-between shadow-sm">
           <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                   <Settings size={20} />
               </div>
               <span className="font-black text-slate-800 text-lg tracking-tight">Admin Dashboard</span>
               <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold rounded ml-2">v1.3.1</span>
           </div>

           <div className="flex items-center gap-4">
               <div className="hidden md:flex items-center gap-4 text-sm font-bold text-slate-500 mr-4">
                   <div className="flex items-center gap-1.5">
                       <Database size={16} />
                       <span>{stats.Total} câu</span>
                   </div>
               </div>
               <button 
                   onClick={onLogout}
                   className="flex items-center gap-2 text-slate-500 hover:text-rose-600 text-sm font-bold transition-colors"
               >
                   <LogOut size={18} /> <span className="hidden md:inline">Đăng xuất</span>
               </button>
           </div>
       </header>

       <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
           {/* Sidebar Navigation */}
           <div className="lg:col-span-2 flex flex-col gap-2">
               <button 
                   onClick={() => setActiveTab('AI_CREATOR')}
                   className={`p-3 rounded-xl font-bold text-sm text-left flex items-center gap-3 transition-all ${activeTab === 'AI_CREATOR' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
               >
                   <Bot size={18} /> Soạn đề AI
               </button>
               <button 
                   onClick={() => setActiveTab('MANAGE')}
                   className={`p-3 rounded-xl font-bold text-sm text-left flex items-center gap-3 transition-all ${activeTab === 'MANAGE' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
               >
                   <Layers size={18} /> Quản lý kho
               </button>
               <button 
                   onClick={() => setActiveTab('GENERATE')}
                   className={`p-3 rounded-xl font-bold text-sm text-left flex items-center gap-3 transition-all ${activeTab === 'GENERATE' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
               >
                   <FileDown size={18} /> Xuất đề thi
               </button>
           </div>

           {/* Main Content Area */}
           <div className="lg:col-span-10">
               {activeTab === 'AI_CREATOR' && renderAICreator()}
               {activeTab === 'MANAGE' && renderManager()}
               {activeTab === 'GENERATE' && (
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
                       <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                           <FileDown className="text-indigo-600" /> Xuất đề thi (Ma trận)
                       </h2>
                       
                       <div className="max-w-2xl space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tên đề thi</label>
                                    <input 
                                        type="text" 
                                        value={examTitle}
                                        onChange={(e) => setExamTitle(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Thời gian (phút)</label>
                                    <input 
                                        type="number" 
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value))}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-4">Cấu trúc ma trận (Số câu)</label>
                                <div className="grid grid-cols-4 gap-4">
                                    {(['NB', 'TH', 'VD', 'VDC'] as (keyof MatrixConfig)[]).map(key => (
                                        <div key={key}>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{key}</label>
                                            <input 
                                                type="number"
                                                value={matrix[key]}
                                                onChange={(e) => setMatrix({...matrix, [key]: parseInt(e.target.value) || 0})}
                                                className="w-full px-3 py-2 rounded border border-slate-200 focus:border-indigo-500 text-center font-bold text-slate-700"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 text-right text-sm font-bold text-indigo-600">
                                    Tổng: {matrix.NB + matrix.TH + matrix.VD + matrix.VDC} câu
                                </div>
                            </div>

                            {genError && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <AlertTriangle size={16} /> {genError}
                                </div>
                            )}

                            <button 
                                onClick={handleExportExam}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                            >
                                <FileDown /> Xuất file JSON
                            </button>
                       </div>
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};

export default AdminDashboard;