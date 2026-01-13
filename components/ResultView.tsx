import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, RotateCcw, Home, Clock, Award, HelpCircle, ChevronDown, Target, Filter, AlertCircle, BookOpen, FileText, PieChart, User, School, History, Calendar } from 'lucide-react';
import { Question, UserInfo, ExamResultLog } from '../types';
import { formatTime } from '../utils';
import MathText from './MathText';

interface ResultViewProps {
  questions: Question[];
  userAnswers: Record<string, string>;
  timeSpent: number;
  userInfo: UserInfo | null;
  history: ExamResultLog[];
  onRetry: () => void;
  onHome: () => void;
}

// Simple Circular Progress Component
const ScoreCircle = ({ score, max, size = 120 }: { score: number; max: number; size?: number }) => {
    const percentage = (score / max) * 100;
    const radius = 50;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    let colorClass = "text-rose-500";
    if (percentage >= 80) colorClass = "text-emerald-500";
    else if (percentage >= 50) colorClass = "text-amber-500";

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
             <svg height={size} width={size} className="transform -rotate-90">
                <circle
                    stroke="currentColor"
                    className="text-slate-100"
                    strokeWidth={stroke}
                    fill="transparent"
                    r={normalizedRadius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke="currentColor"
                    className={`${colorClass} transition-all duration-1000 ease-out`}
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black text-slate-800 tracking-tighter">
                    {score}<span className="text-xl text-slate-400 font-medium">/{max}</span>
                </span>
            </div>
        </div>
    )
}

const ResultView: React.FC<ResultViewProps> = ({ questions, userAnswers, timeSpent, userInfo, history, onRetry, onHome }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REVIEW' | 'HISTORY'>('OVERVIEW');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'INCORRECT'>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to top when tab changes
  useEffect(() => {
    if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  // Helper to normalize answer strings for comparison
  const normalizeAnswer = (val: string | undefined | null) => {
      return String(val || '').trim().replace('.', '').toUpperCase();
  };

  // Helper to check correctness
  const checkIsCorrect = (q: Question) => {
      if (q.type === 'MCQ' && q.correctAnswer) {
          const user = normalizeAnswer(userAnswers[q.id]);
          const correct = normalizeAnswer(q.correctAnswer);
          return user === correct;
      }
      return true;
  };

  // Calculate Stats
  let correctCount = 0;
  let incorrectCount = 0;

  questions.forEach(q => {
    if (q.type === 'MCQ' && q.correctAnswer) {
        if (checkIsCorrect(q)) {
            correctCount++;
        } else {
            incorrectCount++;
        }
    }
  });

  const displayScore = Math.round((correctCount / questions.length) * 10);
  const percentage = Math.round((correctCount / questions.length) * 100);

  const toggleExpand = (id: string) => {
      setExpandedId(expandedId === id ? null : id);
  }

  // Filter questions based on mode
  const displayedQuestions = questions.filter(q => {
      if (filterMode === 'ALL') return true;
      if (filterMode === 'INCORRECT') {
          if (q.type === 'MCQ') return !checkIsCorrect(q);
          return false; 
      }
      return true;
  });

  const formatDate = (ts: number) => {
      return new Date(ts).toLocaleString('vi-VN', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
      });
  }

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 overflow-y-auto bg-slate-50 pb-32 animate-fade-in font-sans relative">
      
      {/* Sticky Header with Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 pt-4">
             <div className="flex flex-col lg:flex-row items-center justify-between mb-4 gap-4">
                <div className="flex flex-col text-center lg:text-left">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Kết quả bài làm</h1>
                    {userInfo && (
                        <div className="flex items-center justify-center lg:justify-start gap-4 text-xs font-medium text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><User size={12}/> {userInfo.name}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="flex items-center gap-1"><School size={12}/> {userInfo.class}</span>
                        </div>
                    )}
                </div>
                
                {/* Tab Switcher */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center font-bold text-sm shrink-0 overflow-x-auto max-w-full">
                    <button 
                        onClick={() => setActiveTab('OVERVIEW')}
                        className={`px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'OVERVIEW' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <PieChart size={16} /> <span className="hidden sm:inline">Tổng quan</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('REVIEW')}
                        className={`px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'REVIEW' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText size={16} /> <span className="hidden sm:inline">Xem lại đề</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('HISTORY')}
                        className={`px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'HISTORY' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <History size={16} /> <span className="hidden sm:inline">Lịch sử</span>
                    </button>
                </div>
             </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'OVERVIEW' && (
      <div className="animate-fade-in">
        {/* Dashboard Cards */}
        <div className="bg-white border-b border-slate-200 py-8 px-4 mb-8">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Score Card */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Điểm số</h3>
                        <ScoreCircle score={displayScore} max={10} size={140} />
                        <div className="mt-4 text-center">
                            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
                                percentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                percentage >= 50 ? 'bg-amber-100 text-amber-700' :
                                'bg-rose-100 text-rose-700'
                            }`}>
                                {percentage >= 80 ? 'Xuất sắc' : percentage >= 50 ? 'Đạt' : 'Cần cố gắng'}
                            </span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="md:col-span-2 grid grid-cols-2 gap-4 md:gap-6">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center items-start pl-8 relative group hover:border-emerald-200 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
                                <CheckCircle size={24} strokeWidth={2.5} />
                            </div>
                            <div className="text-4xl font-black text-slate-800 mb-1">
                                {correctCount}<span className="text-lg text-slate-400 font-medium">/{questions.length}</span>
                            </div>
                            <div className="text-sm font-bold text-slate-400 uppercase">Số câu đúng</div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center items-start pl-8 relative group hover:border-blue-200 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                                <Clock size={24} strokeWidth={2.5} />
                            </div>
                            <div className="text-4xl font-black text-slate-800 mb-1 tabular-nums">
                                {formatTime(timeSpent)}
                            </div>
                            <div className="text-sm font-bold text-slate-400 uppercase">Thời gian làm bài</div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center items-start pl-8 relative group hover:border-indigo-200 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                                <Target size={24} strokeWidth={2.5} />
                            </div>
                            <div className="text-4xl font-black text-slate-800 mb-1">
                                {Math.round((Object.keys(userAnswers).length / questions.length) * 100)}%
                            </div>
                            <div className="text-sm font-bold text-slate-400 uppercase">Tỷ lệ hoàn thành</div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center items-start pl-8 relative group hover:border-purple-200 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-3 group-hover:scale-110 transition-transform">
                                <Award size={24} strokeWidth={2.5} />
                            </div>
                            <div className="text-xl font-bold text-slate-800 mb-1 leading-tight">
                                {percentage >= 90 ? 'Tuyệt vời!' : percentage >= 70 ? 'Khá tốt!' : percentage >= 50 ? 'Trung bình' : 'Cố lên nhé!'}
                            </div>
                            <div className="text-sm font-bold text-slate-400 uppercase">Đánh giá chung</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Interactive List */}
        <div className="max-w-5xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <BookOpen className="text-indigo-600" size={28} />
                    Danh sách câu hỏi
                </h2>

                <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex">
                    <button 
                        onClick={() => setFilterMode('ALL')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${filterMode === 'ALL' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <span>Tất cả</span>
                        <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md text-[10px] min-w-[20px]">{questions.length}</span>
                    </button>
                    <div className="w-px bg-slate-200 my-1 mx-1"></div>
                    <button 
                        onClick={() => setFilterMode('INCORRECT')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${filterMode === 'INCORRECT' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <AlertCircle size={16} />
                        <span>Chỉ câu sai</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] min-w-[20px] ${filterMode === 'INCORRECT' ? 'bg-rose-200 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                            {incorrectCount}
                        </span>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {displayedQuestions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                         <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Award size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">
                            {filterMode === 'INCORRECT' ? 'Không có câu sai!' : 'Không có dữ liệu'}
                        </h3>
                    </div>
                ) : (
                    displayedQuestions.map((q) => {
                        const userAns = userAnswers[q.id];
                        const isCorrect = q.type === 'MCQ' ? checkIsCorrect(q) : true;
                        const isSkipped = !userAns;
                        const originalIndex = questions.findIndex(orig => orig.id === q.id) + 1;
                        const isExpanded = expandedId === q.id;

                        return (
                            <div key={q.id} className={`bg-white border transition-all duration-300 overflow-hidden ${isExpanded ? 'rounded-2xl border-indigo-200 shadow-lg ring-1 ring-indigo-50 my-6' : 'rounded-xl border-slate-200 shadow-sm hover:border-indigo-300'}`}>
                                <div onClick={() => toggleExpand(q.id)} className={`flex items-stretch cursor-pointer min-h-[5rem] ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                                    <div className={`w-1.5 md:w-2 ${isCorrect ? 'bg-emerald-500' : isSkipped ? 'bg-slate-300' : 'bg-rose-500'}`}></div>
                                    <div className="flex-1 p-4 md:p-5 flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 ${isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : isSkipped ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
                                            {isCorrect ? <CheckCircle size={20} strokeWidth={3} /> : isSkipped ? <HelpCircle size={20} strokeWidth={3} /> : <XCircle size={20} strokeWidth={3} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Câu {originalIndex}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${q.difficulty === 'NB' ? 'bg-green-50 text-green-700 border-green-200' : q.difficulty === 'TH' ? 'bg-blue-50 text-blue-700 border-blue-200' : q.difficulty === 'VD' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{q.difficulty}</span>
                                            </div>
                                            <div className={`text-slate-800 font-medium truncate pr-4 ${isExpanded ? 'opacity-0 h-0' : 'opacity-100'}`}>{q.content.replace(/<[^>]+>/g, '')}</div>
                                        </div>
                                        <div className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><ChevronDown size={24} /></div>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="px-5 pb-8 animate-fade-in border-t border-slate-100">
                                        <div className="mt-6 mb-6 prose prose-slate max-w-none prose-lg"><MathText content={q.content} block /></div>
                                        {/* Simplified view for overview, full details are in Review tab */}
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-400 uppercase">Bạn chọn</span>
                                                    <span className={`font-bold text-lg ${checkIsCorrect(q) ? 'text-emerald-600' : 'text-rose-600'}`}>{userAns || '---'}</span>
                                                </div>
                                                {q.type === 'MCQ' && q.correctAnswer && !checkIsCorrect(q) && (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-400 uppercase">Đáp án đúng</span>
                                                        <span className="font-bold text-lg text-emerald-600">{q.correctAnswer}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => setActiveTab('REVIEW')}
                                                className="text-indigo-600 font-bold text-sm hover:underline self-start"
                                            >
                                                Xem chi tiết lời giải trong tab Xem lại bài thi &rarr;
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
      </div>
      )}

      {/* TAB 2: REVIEW EXAM PAPER */}
      {activeTab === 'REVIEW' && (
          <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8 flex items-start gap-4">
                  <BookOpen className="text-indigo-600 shrink-0 mt-1" size={24} />
                  <div>
                      <h3 className="font-bold text-indigo-900 text-lg mb-1">Chế độ xem lại</h3>
                      <p className="text-indigo-700/80 text-sm">Xem toàn bộ đề thi kèm lời giải chi tiết. Các câu hỏi được hiển thị đầy đủ để bạn dễ dàng ôn tập.</p>
                  </div>
              </div>

              <div className="space-y-12">
                  {questions.map((q, idx) => {
                      const userAns = userAnswers[q.id];
                      const isCorrect = q.type === 'MCQ' ? checkIsCorrect(q) : true;
                      const isSkipped = !userAns;
                      const isMCQ = q.type === 'MCQ';

                      return (
                          <div key={q.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                              {/* Header */}
                              <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                      <span className="bg-slate-800 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                                          {idx + 1}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${q.difficulty === 'NB' ? 'bg-green-50 text-green-700 border-green-200' : q.difficulty === 'TH' ? 'bg-blue-50 text-blue-700 border-blue-200' : q.difficulty === 'VD' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                          {q.difficulty}
                                      </span>
                                  </div>
                                  <div>
                                      {isCorrect ? (
                                          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                              <CheckCircle size={14} /> Chính xác
                                          </div>
                                      ) : isSkipped ? (
                                           <div className="flex items-center gap-2 text-slate-500 font-bold text-sm bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                                              <HelpCircle size={14} /> Bỏ qua
                                          </div>
                                      ) : (
                                          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                                              <XCircle size={14} /> Sai
                                          </div>
                                      )}
                                  </div>
                              </div>

                              {/* Content */}
                              <div className="p-6 md:p-8">
                                  <div className="prose prose-slate max-w-none prose-lg mb-8">
                                      <MathText content={q.content} block />
                                  </div>

                                  {/* Options */}
                                  {isMCQ && q.options && (
                                    <div className="grid gap-3 mb-8">
                                        {q.options.map((opt, oIdx) => {
                                            const label = opt.match(/^([A-D])\./)?.[1] || String.fromCharCode(65 + oIdx);
                                            const correctVal = normalizeAnswer(q.correctAnswer);
                                            const userVal = normalizeAnswer(userAns);
                                            const labelVal = normalizeAnswer(label);
                                            const isCorrectOpt = correctVal === labelVal;
                                            const isSelected = userVal === labelVal;

                                            let style = "border-slate-200 bg-white text-slate-600";
                                            if (isCorrectOpt) style = "border-emerald-500 bg-emerald-50 text-emerald-900 font-medium ring-1 ring-emerald-500";
                                            else if (isSelected) style = "border-rose-400 bg-rose-50 text-rose-900 ring-1 ring-rose-400";

                                            return (
                                                <div key={oIdx} className={`p-3 rounded-xl border flex items-start gap-3 ${style}`}>
                                                    <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${isCorrectOpt ? 'bg-emerald-200 text-emerald-800' : isSelected ? 'bg-rose-200 text-rose-800' : 'bg-slate-100 text-slate-500'}`}>
                                                        {label}
                                                    </span>
                                                    <div className="flex-1 break-words"><MathText content={opt.replace(/^([A-D])\.\s*/, '')} /></div>
                                                    {isCorrectOpt && <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-1" />}
                                                    {isSelected && !isCorrectOpt && <XCircle size={16} className="text-rose-600 shrink-0 mt-1" />}
                                                </div>
                                            )
                                        })}
                                    </div>
                                  )}

                                  {/* Solution */}
                                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                      <h4 className="font-bold text-indigo-700 mb-4 flex items-center gap-2 uppercase tracking-wide text-xs">
                                          <Award size={16} /> Lời giải chi tiết
                                      </h4>
                                      {q.explanation ? (
                                          <div className="prose prose-slate max-w-none">
                                              <MathText content={q.explanation} block />
                                          </div>
                                      ) : (
                                          <div className="text-slate-400 italic text-sm">Không có lời giải chi tiết.</div>
                                      )}
                                  </div>
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === 'HISTORY' && (
          <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-8 flex items-start gap-4">
                  <History className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                      <h3 className="font-bold text-emerald-900 text-lg mb-1">Lịch sử ôn luyện</h3>
                      <p className="text-emerald-700/80 text-sm">Theo dõi tiến độ và kết quả các bài thi bạn đã hoàn thành.</p>
                  </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400">
                            <tr>
                                <th className="px-6 py-4">Thời gian</th>
                                <th className="px-6 py-4">Điểm số</th>
                                <th className="px-6 py-4">Kết quả</th>
                                <th className="px-6 py-4">Thời lượng</th>
                                <th className="px-6 py-4">Chế độ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        Chưa có lịch sử làm bài. Hãy hoàn thành bài thi đầu tiên!
                                    </td>
                                </tr>
                            ) : (
                                history.map((log) => {
                                    const percent = Math.round((log.score / log.totalQuestions) * 100);
                                    let gradeColor = "text-rose-600 bg-rose-50 border-rose-100";
                                    let gradeLabel = "Cần cố gắng";
                                    if (percent >= 80) { gradeColor = "text-emerald-600 bg-emerald-50 border-emerald-100"; gradeLabel = "Xuất sắc"; }
                                    else if (percent >= 50) { gradeColor = "text-amber-600 bg-amber-50 border-amber-100"; gradeLabel = "Đạt"; }

                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2 whitespace-nowrap">
                                                <Calendar size={16} className="text-slate-400" />
                                                {formatDate(log.timestamp)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-lg font-black text-slate-800">{Math.round((log.score / log.totalQuestions) * 10)}</span>
                                                    <span className="text-xs text-slate-400">/ 10</span>
                                                </div>
                                                <div className="text-xs text-slate-400">{log.score}/{log.totalQuestions} câu</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold border ${gradeColor}`}>
                                                    {gradeLabel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-500">
                                                {formatTime(log.timeSpent)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-bold ${log.mode === 'STANDARD' ? 'text-indigo-600' : 'text-slate-500'}`}>
                                                    {log.mode === 'STANDARD' ? 'Thi thử' : 'Luyện tập'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                  </div>
              </div>
          </div>
      )}

      {/* Floating Footer */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-slate-200 z-50 ring-1 ring-slate-900/5">
        <button 
            onClick={onHome}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
        >
            <Home size={20} /> <span className="hidden sm:inline">Trang chủ</span>
        </button>
        <div className="w-px h-8 bg-slate-200"></div>
        <button 
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
        >
            <RotateCcw size={20} /> <span className="hidden sm:inline">Làm lại bài</span><span className="sm:hidden">Làm lại</span>
        </button>
      </div>

    </div>
  );
};

export default ResultView;