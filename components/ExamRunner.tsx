import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Menu, X, ArrowLeft, ArrowRight, CheckCircle, Flag, ChevronRight } from 'lucide-react';
import { Question } from '../types';
import { formatTime } from '../utils';
import MathText from './MathText';

interface ExamRunnerProps {
  questions: Question[];
  durationMinutes: number;
  onComplete: (answers: Record<string, string>, timeSpent: number) => void;
}

const ExamRunner: React.FC<ExamRunnerProps> = ({ questions, durationMinutes, onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

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
    setAnswers(prev => ({ ...prev, [questions[currentIdx].id]: optionKey }));
  };

  const toggleFlag = (id: string) => {
      const newFlagged = new Set(flagged);
      if(newFlagged.has(id)) newFlagged.delete(id);
      else newFlagged.add(id);
      setFlagged(newFlagged);
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

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Glass Header */}
      <header className="glass shadow-sm z-30 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shrink-0 absolute top-0 w-full lg:static">
        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 md:p-3 hover:bg-slate-100 rounded-xl lg:hidden text-slate-700 active:bg-slate-200 transition-colors"
          >
            <Menu className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <div className="font-black text-xl md:text-3xl text-indigo-600 hidden sm:flex items-center gap-2">
            MathPro <span className="text-slate-300 font-light">|</span>
          </div>
          <div className="text-slate-700 font-bold text-lg md:text-2xl bg-slate-100 px-3 py-1 md:px-4 md:py-1.5 rounded-lg border border-slate-200">
             Câu <span className="text-indigo-600">{currentIdx + 1}</span> <span className="text-slate-400">/</span> {questions.length}
          </div>
        </div>

        <div className={`flex items-center gap-2 md:gap-3 px-3 py-1 md:px-6 md:py-2 rounded-xl font-mono text-xl md:text-3xl font-bold border-2 shadow-sm transition-colors
            ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-indigo-700 border-indigo-100'}`}>
          <Clock className="w-5 h-5 md:w-8 md:h-8" strokeWidth={2.5} />
          {formatTime(timeLeft)}
        </div>

        <button 
          onClick={handleSubmit}
          className="hidden sm:block px-6 md:px-8 py-2 md:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg md:text-xl transition-all shadow-lg hover:shadow-indigo-200 active:scale-95"
        >
          Nộp bài
        </button>
        <button 
          onClick={handleSubmit}
          className="sm:hidden px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm"
        >
          Nộp
        </button>
      </header>

      {/* Progress Bar */}
      <div className="h-1.5 md:h-2 bg-slate-200 w-full z-20 mt-[70px] md:mt-[88px] lg:mt-0">
        <div 
          className="h-full bg-indigo-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`
            absolute lg:relative inset-y-0 left-0 z-20 w-80 lg:w-96 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center lg:hidden bg-slate-50">
            <h3 className="font-bold text-xl md:text-2xl text-slate-700">Danh sách câu hỏi</h3>
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-white rounded-lg"><X className="w-6 h-6 md:w-8 md:h-8" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-5 md:grid-cols-4 gap-2 md:gap-3 content-start bg-slate-50/50">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = currentIdx === idx;
              const isFlagged = flagged.has(q.id);
              
              return (
                <button
                  key={q.id}
                  onClick={() => { setCurrentIdx(idx); setSidebarOpen(false); }}
                  className={`
                    aspect-square rounded-xl md:rounded-2xl text-lg md:text-xl font-bold flex items-center justify-center relative shadow-sm transition-all duration-200
                    ${isCurrent 
                        ? 'bg-indigo-600 text-white ring-2 md:ring-4 ring-indigo-200 scale-105 z-10' 
                        : isAnswered 
                            ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200 hover:bg-indigo-200' 
                            : 'bg-white text-slate-500 border-2 border-slate-200 hover:bg-white hover:border-slate-300'}
                  `}
                >
                  {idx + 1}
                  {isFlagged && <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-orange-500 rounded-full border-2 border-white shadow-sm"></div>}
                </button>
              );
            })}
          </div>
          
          <div className="p-4 md:p-6 border-t border-slate-200 bg-white text-xs md:text-sm font-bold text-slate-600 space-y-2 md:space-y-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 md:w-5 md:h-5 bg-indigo-600 rounded-md shadow-sm"></div> Đang làm
            </div>
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 md:w-5 md:h-5 bg-indigo-100 border-2 border-indigo-200 rounded-md"></div> Đã trả lời
            </div>
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 md:w-5 md:h-5 bg-white border-2 border-slate-200 rounded-md"></div> Chưa trả lời
            </div>
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-3 md:p-6 lg:p-10 pb-24 md:pb-32 scroll-smooth">
          <div className="max-w-6xl mx-auto space-y-4 md:space-y-8 animate-fade-in">
            
            {/* Question Card */}
            <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-xl border border-white overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-white px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 flex justify-between items-center">
                <span className="font-extrabold text-slate-700 text-xl md:text-3xl tracking-tight">Câu hỏi {currentIdx + 1}</span>
                <button 
                    onClick={() => toggleFlag(currentQ.id)}
                    className={`flex items-center gap-2 md:gap-3 px-3 py-1.5 md:px-6 md:py-2.5 rounded-full text-sm md:text-lg font-bold transition-all
                    ${flagged.has(currentQ.id) 
                        ? 'bg-orange-50 text-orange-600 ring-2 ring-orange-200 shadow-sm' 
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                >
                    <Flag className="w-4 h-4 md:w-6 md:h-6" fill={flagged.has(currentQ.id) ? "currentColor" : "none"} />
                    {flagged.has(currentQ.id) ? <span className="hidden md:inline">Đã đánh dấu</span> : <span className="hidden md:inline">Đánh dấu</span>}
                </button>
              </div>
              
              <div className="p-5 md:p-8 lg:p-12">
                 {/* Responsive Prose: Base on mobile, 2XL on large screens */}
                 <div className="prose prose-base md:prose-xl lg:prose-2xl max-w-none text-slate-800 mb-6 md:mb-12 leading-relaxed font-medium">
                   <MathText content={currentQ.content} block />
                 </div>

                 {currentQ.type === 'MCQ' && currentQ.options && (
                   <div className="grid grid-cols-1 gap-3 md:gap-5">
                     {currentQ.options.map((opt, optIdx) => {
                       const label = getOptionLabel(opt, optIdx);
                       const content = getOptionContent(opt);
                       const isSelected = answers[currentQ.id] === label;

                       return (
                         <label 
                            key={optIdx} 
                            className={`
                                relative flex items-start md:items-center gap-4 md:gap-6 p-4 md:p-6 rounded-xl md:rounded-2xl border-2 cursor-pointer transition-all duration-200 group
                                ${isSelected 
                                    ? 'border-indigo-600 bg-indigo-50/50 shadow-lg scale-[1.01] z-10' 
                                    : 'border-slate-200 hover:border-indigo-300 hover:bg-white hover:shadow-md'}
                            `}
                         >
                           <input 
                              type="radio" 
                              name={`q-${currentQ.id}`}
                              value={label}
                              checked={isSelected}
                              onChange={() => handleSelectAnswer(label)}
                              className="sr-only"
                           />
                           {/* Label Circle */}
                           <div className={`
                                w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg md:text-2xl shrink-0 transition-all border-2 mt-1 md:mt-0
                                ${isSelected 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                    : 'bg-slate-50 text-slate-500 border-slate-200 group-hover:bg-indigo-100 group-hover:text-indigo-600 group-hover:border-indigo-200'}
                           `}>
                               {label}
                           </div>
                           
                           {/* Content */}
                           <div className="flex-1 text-lg md:text-3xl text-slate-800 leading-snug group-hover:text-indigo-900 transition-colors pt-1.5 md:pt-0">
                               <MathText content={content} />
                           </div>

                           {/* Check Icon */}
                           <div className={`
                                hidden md:flex w-8 h-8 rounded-full border-2 items-center justify-center transition-all shrink-0
                                ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-transparent group-hover:border-indigo-300'}
                           `}>
                               <CheckCircle size={20} fill="currentColor" className="text-white" />
                           </div>
                         </label>
                       );
                     })}
                   </div>
                 )}

                 {currentQ.type !== 'MCQ' && (
                     <div className="mt-4 md:mt-8">
                         <textarea 
                            placeholder="Nhập câu trả lời của bạn..."
                            className="w-full h-40 md:h-56 p-4 md:p-6 text-lg md:text-2xl border-2 border-slate-300 rounded-2xl md:rounded-3xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all resize-none shadow-inner"
                            value={answers[currentQ.id] || ''}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                         ></textarea>
                     </div>
                 )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-2 md:pt-4 gap-4">
               <button 
                 onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                 disabled={currentIdx === 0}
                 className="flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 bg-white border border-slate-200 text-slate-600 rounded-xl md:rounded-2xl text-base md:text-xl font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-transform active:scale-95"
               >
                 <ArrowLeft className="w-5 h-5 md:w-7 md:h-7" /> <span className="hidden sm:inline">Trước</span>
               </button>
               
               {currentIdx < questions.length - 1 ? (
                   <button 
                    onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                    className="flex-1 md:flex-none group flex items-center justify-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl text-base md:text-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:pr-6 md:hover:pr-8"
                  >
                    Tiếp theo <ArrowRight className="w-5 h-5 md:w-7 md:h-7 group-hover:translate-x-1 transition-transform" />
                  </button>
               ) : (
                   <button 
                    onClick={handleSubmit}
                    className="flex-1 md:flex-none group flex items-center justify-center gap-2 md:gap-3 px-6 md:px-12 py-3 md:py-4 bg-emerald-600 text-white rounded-xl md:rounded-2xl text-lg md:text-2xl font-bold hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all hover:-translate-y-1"
                  >
                    Hoàn thành <CheckCircle className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
                  </button>
               )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExamRunner;