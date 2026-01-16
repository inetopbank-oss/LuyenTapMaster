import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Menu, X, ArrowLeft, ArrowRight, CheckCircle, Flag, Award, AlertCircle, Type, Minus, Plus } from 'lucide-react';
import { Question } from '../types';
import { formatTime } from '../utils';
import MathText from './MathText';

interface ExamRunnerProps {
  questions: Question[];
  durationMinutes: number;
  onComplete: (answers: Record<string, string>, timeSpent: number) => void;
  mode: 'CUSTOM' | 'STANDARD';
}

const ExamRunner: React.FC<ExamRunnerProps> = ({ questions, durationMinutes, onComplete, mode }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  
  // Font Size State (Default 18px)
  const [fontSize, setFontSize] = useState<number>(18);

  // Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = useCallback(() => {
    onComplete(answers, (durationMinutes * 60) - timeLeft);
  }, [answers, durationMinutes, timeLeft, onComplete]);

  const handleSelectAnswer = (optionKey: string) => {
    // In Custom/Practice mode, prevent changing answer once selected
    if (mode === 'CUSTOM' && answers[questions[currentIdx].id]) {
        return;
    }
    setAnswers(prev => ({ ...prev, [questions[currentIdx].id]: optionKey }));
  };

  const toggleFlag = (id: string) => {
      const newFlagged = new Set(flagged);
      if(newFlagged.has(id)) newFlagged.delete(id);
      else newFlagged.add(id);
      setFlagged(newFlagged);
  }

  const changeFontSize = (delta: number) => {
      setFontSize(prev => {
          const newState = prev + delta;
          return Math.max(14, Math.min(32, newState)); // Limit between 14px and 32px
      });
  }

  const currentQ = questions[currentIdx];
  const progress = (Object.keys(answers).length / questions.length) * 100;

  const getOptionLabel = (opt: string, idx: number) => {
      const match = opt.match(/^([A-D])\./);
      if (match) return match[1];
      return String.fromCharCode(65 + idx);
  };
  
  const getOptionContent = (opt: string) => {
       return opt.replace(/^([A-D])\.\s*/, '');
  };

  const normalizeAnswer = (val: string | undefined | null) => {
      return String(val || '').trim().replace('.', '').toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white font-sans overflow-hidden">
      {/* 1. Header - Ultra Compact */}
      <header className="h-12 md:h-14 shrink-0 flex items-center justify-between px-3 md:px-4 border-b border-slate-200 bg-white z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-slate-100 rounded-md lg:hidden text-slate-500 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="font-black text-indigo-600 text-lg tracking-tight hidden sm:block">MathPro</span>
            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-baseline gap-1 text-sm font-bold text-slate-600">
               <span>Câu {currentIdx + 1}</span>
               <span className="text-slate-300 font-normal">/</span>
               <span className="text-slate-400 font-normal">{questions.length}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
            {/* Font Size Control - Hidden on very small screens if needed, but useful */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                <button 
                    onClick={() => changeFontSize(-2)} 
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all disabled:opacity-30"
                    disabled={fontSize <= 14}
                    title="Giảm cỡ chữ"
                >
                    <Minus size={14} strokeWidth={3} />
                </button>
                <div className="flex items-center justify-center w-8 text-[10px] font-bold text-slate-600 select-none">
                    <Type size={12} className="mr-0.5" />
                    {fontSize}
                </div>
                <button 
                    onClick={() => changeFontSize(2)} 
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all disabled:opacity-30"
                    disabled={fontSize >= 32}
                    title="Tăng cỡ chữ"
                >
                    <Plus size={14} strokeWidth={3} />
                </button>
            </div>

            {/* Timer */}
            <div className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-base font-bold transition-colors hidden sm:flex
                ${timeLeft < 300 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-700'}
            `}>
                <Clock className="w-4 h-4 opacity-50" />
                {formatTime(timeLeft)}
            </div>

            <button 
            onClick={handleSubmit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md font-bold text-sm transition-all shadow-sm"
            >
            Nộp bài
            </button>
        </div>
      </header>

      {/* Progress Line */}
      <div className="h-0.5 w-full bg-slate-100 z-30">
        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* 2. Sidebar - Narrow & Clean */}
        <aside className={`
            absolute lg:relative inset-y-0 left-0 z-30 w-64 bg-slate-50 border-r border-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-3 border-b border-slate-200 flex justify-between items-center lg:hidden">
            <span className="font-bold text-sm text-slate-500 uppercase tracking-wider">Danh sách câu</span>
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-400"><X className="w-4 h-4" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            <div className="grid grid-cols-5 gap-1.5">
                {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = currentIdx === idx;
                const isFlagged = flagged.has(q.id);
                
                // In Practice mode, show correct/incorrect status in sidebar if answered
                let statusColor = "";
                if (mode === 'CUSTOM' && isAnswered) {
                     const userAns = normalizeAnswer(answers[q.id]);
                     const correctAns = normalizeAnswer(q.correctAnswer);
                     statusColor = userAns === correctAns ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";
                }

                return (
                    <button
                    key={q.id}
                    onClick={() => { setCurrentIdx(idx); setSidebarOpen(false); }}
                    className={`
                        h-9 rounded-md text-xs font-bold flex items-center justify-center relative transition-all
                        ${isCurrent 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : isAnswered 
                                ? (mode === 'CUSTOM' ? statusColor : 'bg-indigo-100 text-indigo-700') 
                                : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}
                    `}
                    >
                    {idx + 1}
                    {isFlagged && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-orange-500 rounded-full"></div>}
                    </button>
                );
                })}
            </div>
          </div>
          
          <div className="p-3 border-t border-slate-200 bg-slate-100/50 flex justify-between gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-indigo-600 rounded-sm"></div>Đang xem</div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-indigo-100 rounded-sm"></div>Đã làm</div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-white border border-slate-300 rounded-sm"></div>Chưa làm</div>
          </div>
        </aside>

        {/* 3. Main Content - Seamless & Focused */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-20 max-w-4xl mx-auto w-full">
            
            {/* Question Header Row */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="text-base font-bold text-slate-400 uppercase tracking-wider mb-1">Câu hỏi {currentIdx + 1}</h2>
                    <div className="flex gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide
                            ${currentQ.difficulty === 'NB' ? 'bg-green-50 text-green-700 border-green-200' : 
                              currentQ.difficulty === 'TH' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                              currentQ.difficulty === 'VD' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}
                        `}>
                            {currentQ.difficulty}
                        </span>
                        {flagged.has(currentQ.id) && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                                <Flag size={10} fill="currentColor" /> Đã đánh dấu
                            </span>
                        )}
                    </div>
                </div>
                <button 
                    onClick={() => toggleFlag(currentQ.id)}
                    className={`p-2 rounded-full transition-colors ${flagged.has(currentQ.id) ? 'text-orange-500 bg-orange-50' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
                    title="Đánh dấu câu hỏi"
                >
                    <Flag className="w-5 h-5" fill={flagged.has(currentQ.id) ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Question Text - Dynamic Font Size */}
            <div 
                className="prose prose-slate max-w-none text-slate-800 mb-8 font-medium leading-relaxed"
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
            >
                <MathText content={currentQ.content} block />
            </div>

            {/* Answer Options - Refined Layout "Gọn Đẹp" */}
            {currentQ.type === 'MCQ' && currentQ.options && (
                <div className="space-y-3">
                    {currentQ.options.map((opt, optIdx) => {
                    const label = getOptionLabel(opt, optIdx);
                    const content = getOptionContent(opt);
                    
                    const isSelected = answers[currentQ.id] === label;
                    
                    // Practice Mode Logic
                    const isPractice = mode === 'CUSTOM';
                    const hasAnswered = !!answers[currentQ.id];
                    const isCorrectOption = normalizeAnswer(label) === normalizeAnswer(currentQ.correctAnswer);
                    
                    // Default State
                    let containerStyle = 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 text-slate-700';
                    let labelStyle = 'bg-slate-100 text-slate-500 border-slate-200';
                    let statusIndicator = null;

                    if (isPractice && hasAnswered) {
                         if (isSelected && isCorrectOption) {
                             // User chose Correct
                             containerStyle = 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500 z-10';
                             labelStyle = 'bg-emerald-500 text-white border-emerald-500';
                             statusIndicator = <CheckCircle size={fontSize + 2} className="text-emerald-500" />;
                         } else if (isSelected && !isCorrectOption) {
                             // User chose Wrong
                             containerStyle = 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-500 z-10';
                             labelStyle = 'bg-rose-500 text-white border-rose-500';
                             // statusIndicator = <XCircle size={18} className="text-rose-500" />;
                         } else if (!isSelected && isCorrectOption) {
                             // The Actual Correct Option (User missed)
                             containerStyle = 'border-emerald-500 bg-emerald-50/30 border-dashed';
                             labelStyle = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                             statusIndicator = <CheckCircle size={fontSize + 2} className="text-emerald-500 opacity-60" />;
                         } else {
                             // Other inactive options
                             containerStyle = 'border-slate-100 bg-slate-50 opacity-40 grayscale';
                         }
                    } else if (isSelected) {
                        // Standard Mode selection
                        containerStyle = 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 z-10';
                        labelStyle = 'bg-indigo-600 text-white border-indigo-600';
                    }

                    return (
                        <label 
                        key={optIdx} 
                        className={`
                            group relative flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                            ${containerStyle}
                        `}
                        >
                            <input 
                                type="radio" 
                                name={`q-${currentQ.id}`}
                                value={label}
                                checked={isSelected}
                                onChange={() => handleSelectAnswer(label)}
                                disabled={isPractice && hasAnswered}
                                className="sr-only"
                            />
                            
                            {/* Letter Box (A, B, C...) - Fixed size for alignment */}
                            <div className={`
                                w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors mt-0.5 border
                                ${labelStyle}
                            `}>
                                {label}
                            </div>
                            
                            {/* Option Content - Dynamic Font Size */}
                            <div className="flex-1 min-w-0 pt-1" style={{ fontSize: `${fontSize}px` }}>
                                <MathText content={content} />
                            </div>

                            {/* Status Indicator */}
                            {statusIndicator && (
                                <div className="shrink-0 mt-1.5 animate-fade-in">
                                    {statusIndicator}
                                </div>
                            )}
                        </label>
                    );
                    })}
                </div>
            )}
            
            {/* Practice Mode: Immediate Explanation */}
            {mode === 'CUSTOM' && answers[currentQ.id] && (
                <div className="mt-8 animate-fade-in">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <h4 className="font-bold text-indigo-700 uppercase tracking-wide text-xs flex items-center gap-2">
                                <Award size={16} /> Lời giải chi tiết
                            </h4>
                            {currentQ.correctAnswer && (
                                <span className="text-xs font-bold text-white bg-indigo-600 px-2 py-0.5 rounded ml-auto">
                                    Đáp án đúng: {currentQ.correctAnswer}
                                </span>
                            )}
                        </div>
                        
                        {currentQ.explanation ? (
                            <div className="prose prose-slate max-w-none" style={{ fontSize: `${fontSize}px` }}>
                                <MathText content={currentQ.explanation} block />
                            </div>
                        ) : (
                            <div className="text-slate-400 italic text-sm flex items-center gap-2">
                                <AlertCircle size={16} /> Chưa có lời giải chi tiết cho câu hỏi này.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {currentQ.type !== 'MCQ' && (
                <textarea 
                    placeholder="Nhập câu trả lời của bạn..."
                    className="w-full h-40 p-4 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all resize-none bg-slate-50 focus:bg-white"
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                    style={{ fontSize: `${fontSize}px` }}
                ></textarea>
            )}
          </div>

          {/* 4. Bottom Navigation - Sticky Footer inside Main */}
          <div className="border-t border-slate-100 bg-white/95 backdrop-blur-sm p-3 md:px-8 absolute bottom-0 left-0 right-0 z-20 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
               <button 
                 onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                 disabled={currentIdx === 0}
                 className="flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
               >
                 <ArrowLeft size={16} /> <span className="hidden sm:inline">Câu trước</span>
               </button>
               
               {currentIdx < questions.length - 1 ? (
                   <button 
                    onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                    className="flex items-center gap-2 px-5 py-2 rounded-md font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:translate-x-0.5 transition-all"
                  >
                    <span>Câu tiếp theo</span> <ArrowRight size={16} />
                  </button>
               ) : (
                   <button 
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-5 py-2 rounded-md font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:-translate-y-0.5 transition-all"
                  >
                    <span>Hoàn thành</span> <CheckCircle size={16} />
                  </button>
               )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExamRunner;