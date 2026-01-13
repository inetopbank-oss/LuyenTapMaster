import React, { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw, Home, Clock, Award, HelpCircle, ChevronDown, ChevronUp, Target, BarChart2, Filter } from 'lucide-react';
import { Question } from '../types';
import { formatTime } from '../utils';
import MathText from './MathText';

interface ResultViewProps {
  questions: Question[];
  userAnswers: Record<string, string>;
  timeSpent: number;
  onRetry: () => void;
  onHome: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ questions, userAnswers, timeSpent, onRetry, onHome }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'INCORRECT'>('ALL');

  // Helper to check correctness
  const checkIsCorrect = (q: Question) => {
      if (q.type === 'MCQ' && q.correctAnswer) {
          const user = (userAnswers[q.id] || '').trim().replace('.', '');
          const correct = q.correctAnswer.trim().replace('.', '');
          return user === correct;
      }
      return true; // Essay or others are treated as neutral/correct for scoring display purposes usually
  };

  // Calculate Score
  let correctCount = 0;
  questions.forEach(q => {
    if (q.type === 'MCQ' && q.correctAnswer) {
        if (checkIsCorrect(q)) correctCount++;
    }
  });

  const score = Math.round((correctCount / questions.length) * 10);
  const percentage = Math.round((correctCount / questions.length) * 100);

  const getStatusColor = () => {
      if (percentage >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      if (percentage >= 50) return 'text-amber-500 bg-amber-50 border-amber-100';
      return 'text-rose-500 bg-rose-50 border-rose-100';
  }

  const toggleExpand = (id: string) => {
      setExpandedId(expandedId === id ? null : id);
  }

  // Filter questions based on mode
  const displayedQuestions = questions.filter(q => {
      if (filterMode === 'ALL') return true;
      if (filterMode === 'INCORRECT') {
          // Show if it is MCQ and Incorrect (or skipped)
          if (q.type === 'MCQ') return !checkIsCorrect(q);
          return false; // Hide essays in incorrect filter for now
      }
      return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-40 animate-fade-in font-sans">
      {/* Header/Summary */}
      <div className="bg-white shadow-lg shadow-slate-200/50 border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
            <h1 className="text-2xl md:text-4xl font-black text-center mb-6 md:mb-10 text-slate-800 tracking-tight">Kết quả bài làm</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Card 1: Score */}
                <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center border-2 border-slate-100 shadow-xl shadow-indigo-100/50 relative overflow-hidden group hover:border-indigo-200 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Target className="w-16 h-16 md:w-24 md:h-24 text-indigo-600" />
                    </div>
                    <div className="text-sm md:text-lg font-bold text-indigo-500 uppercase tracking-widest mb-2 md:mb-3 z-10">Điểm số</div>
                    <div className="text-5xl md:text-7xl font-black text-slate-900 z-10 tabular-nums tracking-tighter">
                        {score}<span className="text-2xl md:text-3xl text-slate-400 font-medium ml-1">/10</span>
                    </div>
                </div>

                {/* Card 2: Correct Count */}
                <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center border-2 border-slate-100 shadow-xl shadow-slate-100/50 hover:border-slate-300 transition-colors">
                     <div className="text-sm md:text-lg font-bold text-slate-400 uppercase tracking-widest mb-2 md:mb-3">Số câu đúng</div>
                    <div className="text-3xl md:text-5xl font-bold flex items-center gap-2 md:gap-3 text-slate-700">
                        <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />
                        {correctCount} <span className="text-xl md:text-2xl font-normal text-slate-300">/ {questions.length}</span>
                    </div>
                </div>

                {/* Card 3: Time */}
                <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center border-2 border-slate-100 shadow-xl shadow-slate-100/50 hover:border-slate-300 transition-colors">
                    <div className="text-sm md:text-lg font-bold text-slate-400 uppercase tracking-widest mb-2 md:mb-3">Thời gian</div>
                    <div className="text-3xl md:text-5xl font-bold flex items-center gap-2 md:gap-3 text-slate-700 tabular-nums">
                        <Clock className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
                        {formatTime(timeSpent)}
                    </div>
                </div>

                {/* Card 4: Status */}
                <div className={`p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center border-2 shadow-xl ${getStatusColor()}`}>
                    <div className="text-sm md:text-lg font-bold opacity-70 uppercase tracking-widest mb-2 md:mb-3">Đánh giá</div>
                    <div className="text-2xl md:text-4xl font-black text-center">
                        {percentage >= 80 ? 'Xuất sắc! 🎉' : percentage >= 50 ? 'Đạt yêu cầu 👍' : 'Cần cố gắng 💪'}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Detail List */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-8 md:mt-12 space-y-4 md:space-y-8">
        
        {/* Controls Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
            <h2 className="text-xl md:text-3xl font-bold text-slate-700 flex items-center gap-2 md:gap-3 px-2">
                <div className="bg-indigo-600 text-white p-1.5 md:p-2 rounded-lg"><BarChart2 className="w-5 h-5 md:w-6 md:h-6" /></div>
                Chi tiết lời giải
            </h2>

            <div className="flex p-1 bg-slate-200 rounded-xl self-start md:self-auto">
                <button 
                    onClick={() => setFilterMode('ALL')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterMode === 'ALL' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Tất cả
                </button>
                <button 
                    onClick={() => setFilterMode('INCORRECT')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${filterMode === 'INCORRECT' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Filter className="w-4 h-4" /> Chỉ câu sai
                </button>
            </div>
        </div>

        {displayedQuestions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <CheckCircle className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
                <p className="text-xl text-slate-400 font-medium">Bạn không có câu trả lời sai nào!</p>
            </div>
        ) : (
            displayedQuestions.map((q, idx) => {
                const userAns = userAnswers[q.id];
                const isCorrect = q.type === 'MCQ' ? checkIsCorrect(q) : true;
                const isSkipped = !userAns;
                const isMCQ = q.type === 'MCQ';

                // Real index in original list (optional, but finding index in full list is O(n))
                // Using q.id logic or mapped index. For simple view let's use the object itself.
                const originalIndex = questions.findIndex(orig => orig.id === q.id) + 1;

                return (
                    <div key={q.id} className="bg-white border border-slate-200 rounded-xl md:rounded-[1.5rem] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div 
                            onClick={() => toggleExpand(q.id)}
                            className="flex items-start md:items-center p-4 md:p-8 cursor-pointer hover:bg-slate-50/80 transition-colors group"
                        >
                            <div className="mr-4 md:mr-8 shrink-0 mt-1 md:mt-0">
                                {isSkipped ? (
                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-slate-200 group-hover:scale-110 transition-transform">
                                        <HelpCircle className="w-6 h-6 md:w-8 md:h-8" />
                                    </div>
                                ) : isCorrect ? (
                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 border-2 border-emerald-200 group-hover:scale-110 transition-transform">
                                        <CheckCircle className="w-6 h-6 md:w-8 md:h-8" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 border-2 border-rose-200 group-hover:scale-110 transition-transform">
                                        <XCircle className="w-6 h-6 md:w-8 md:h-8" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg md:text-2xl text-slate-800 mb-1 md:mb-2 flex flex-wrap items-center gap-2 md:gap-3">
                                    Câu {originalIndex} 
                                    <span className={`text-xs md:text-sm font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full border 
                                        ${q.difficulty === 'NB' ? 'bg-green-50 text-green-700 border-green-200' : 
                                        q.difficulty === 'TH' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                        q.difficulty === 'VD' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}
                                    `}>
                                        {q.difficulty}
                                    </span>
                                </h3>
                                <div className="text-slate-500 text-sm md:text-xl truncate max-w-3xl font-medium">
                                    {q.content.substring(0, 60)}...
                                </div>
                            </div>
                            <div className="text-slate-300 group-hover:text-indigo-500 transition-colors pl-2 md:pl-4 self-center">
                                {expandedId === q.id ? <ChevronUp className="w-6 h-6 md:w-9 md:h-9" /> : <ChevronDown className="w-6 h-6 md:w-9 md:h-9" />}
                            </div>
                        </div>

                        {expandedId === q.id && (
                            <div className="p-4 md:p-10 border-t-2 border-slate-100 bg-slate-50/50 animate-slide-up">
                                <div className="mb-6 md:mb-10 text-xl md:text-3xl text-slate-900 leading-relaxed font-medium">
                                    <MathText content={q.content} block />
                                </div>

                                {isMCQ && q.options && (
                                    <div className="grid gap-3 md:gap-4 mb-6 md:mb-10">
                                        {q.options.map((opt, oIdx) => {
                                            const label = opt.match(/^([A-D])\./)?.[1] || String.fromCharCode(65 + oIdx);
                                            const isSelected = userAns === label;
                                            const isCorrectOpt = q.correctAnswer === label;
                                            
                                            let style = "border-slate-200 bg-white text-slate-500";
                                            if (isCorrectOpt) style = "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500 shadow-lg shadow-emerald-100";
                                            else if (isSelected && !isCorrectOpt) style = "border-rose-300 bg-rose-50 text-rose-900";

                                            return (
                                                <div key={oIdx} className={`p-3 md:p-5 rounded-xl md:rounded-2xl border-2 flex items-start gap-3 md:gap-5 ${style} text-lg md:text-2xl transition-all`}>
                                                    <span className={`font-black min-w-[28px] md:min-w-[36px] flex items-center justify-center rounded-lg h-7 md:h-9 text-base md:text-xl ${isCorrectOpt ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100'}`}>{label}</span>
                                                    <div className="pt-0.5 flex-1 break-words"><MathText content={opt.replace(/^([A-D])\.\s*/, '')} /></div>
                                                    {isSelected && <span className="ml-auto text-xs md:text-sm font-bold uppercase px-2 py-1 md:px-3 md:py-1 bg-black/10 rounded-lg self-center whitespace-nowrap">Bạn chọn</span>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {!isMCQ && (
                                    <div className="mb-6 md:mb-10 p-4 md:p-6 bg-white border-2 border-slate-200 rounded-xl md:rounded-2xl shadow-sm">
                                        <div className="text-sm md:text-lg font-bold text-slate-400 mb-2 uppercase tracking-wide">Câu trả lời của bạn</div>
                                        <div className="text-lg md:text-2xl text-slate-900 font-medium break-words">{userAns || "(Bỏ qua)"}</div>
                                    </div>
                                )}

                                {q.explanation && (
                                    <div className="bg-white border-l-4 md:border-l-8 border-indigo-500 p-4 md:p-8 rounded-r-xl md:rounded-r-2xl shadow-sm">
                                        <h4 className="font-bold text-lg md:text-xl text-indigo-700 mb-3 md:mb-6 flex items-center gap-2 md:gap-3 uppercase tracking-wide">
                                            <Award className="w-5 h-5 md:w-7 md:h-7" /> Lời giải chi tiết
                                        </h4>
                                        <div className="text-slate-800 text-lg md:text-2xl leading-relaxed">
                                            <MathText content={q.explanation} block />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            })
        )}
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 p-4 md:p-6 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] flex items-center justify-center gap-3 md:gap-6 z-30">
          <button 
            onClick={onHome}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors border-2 border-slate-200"
          >
              <Home className="w-5 h-5 md:w-7 md:h-7" /> <span className="hidden sm:inline">Về trang chủ</span><span className="sm:hidden">Trang chủ</span>
          </button>
          <button 
            onClick={onRetry}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-xl text-white bg-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-xl shadow-indigo-200 transition-all"
          >
              <RotateCcw className="w-5 h-5 md:w-7 md:h-7" /> <span className="hidden sm:inline">Làm lại bài này</span><span className="sm:hidden">Làm lại</span>
          </button>
      </div>
    </div>
  );
};

export default ResultView;