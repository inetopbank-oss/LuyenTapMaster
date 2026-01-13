import React, { useState, useEffect } from 'react';
import { Settings, Play, BookOpen, Clock, ListFilter, Check, PieChart, PenTool, GraduationCap, Timer, ArrowLeft, FileJson, Database, AlertTriangle } from 'lucide-react';
import { Question, ExamConfig, Difficulty, QuestionType, DIFFICULTY_LABELS, TYPE_LABELS } from '../types';

interface ExamConfigViewProps {
  totalQuestions: Question[];
  onStart: (config: ExamConfig) => void;
  onBack: () => void;
}

const EXAM_PRESETS = [
    { time: 15, questions: 10, label: '15 Phút' },
    { time: 30, questions: 20, label: '30 Phút' },
    { time: 45, questions: 30, label: '45 Phút' },
    { time: 60, questions: 40, label: '60 Phút' },
    { time: 90, questions: 50, label: '90 Phút' }, // Thi THPT QG
];

const ExamConfigView: React.FC<ExamConfigViewProps> = ({ totalQuestions, onStart, onBack }) => {
  // Mode 'CUSTOM' maps to 'Luyện tập', 'STANDARD' maps to 'Kiểm tra'
  const [mode, setMode] = useState<'CUSTOM' | 'STANDARD'>('STANDARD'); 
  const allQuestionTypes: QuestionType[] = ['MCQ', 'Essay', 'TF', 'SA'];

  const [config, setConfig] = useState<ExamConfig>({
    mode: 'STANDARD',
    difficulty: 'ALL',
    questionTypes: allQuestionTypes,
    limit: 30, // Default 45 mins -> 30 questions
    durationMinutes: 45, 
  });
  
  const [maxPossible, setMaxPossible] = useState(0);
  const [matrixCounts, setMatrixCounts] = useState({ nb: 0, th: 0, vd: 0 });

  // Calculate detailed stats for display
  const detailedStats = React.useMemo(() => {
    return {
      NB: totalQuestions.filter(q => q.difficulty === 'NB').length,
      TH: totalQuestions.filter(q => q.difficulty === 'TH').length,
      VD: totalQuestions.filter(q => q.difficulty === 'VD').length,
      VDC: totalQuestions.filter(q => q.difficulty === 'VDC').length,
      Total: totalQuestions.length
    };
  }, [totalQuestions]);

  // Calculate stats for Standard Mode (VD includes VD and VDC)
  const stats = React.useMemo(() => {
    const nb = detailedStats.NB;
    const th = detailedStats.TH;
    const vd = detailedStats.VD + detailedStats.VDC;
    return { nb, th, vd };
  }, [detailedStats]);

  useEffect(() => {
    setConfig(prev => ({ ...prev, mode }));
  }, [mode]);

  useEffect(() => {
    if (mode === 'CUSTOM') {
        const filtered = totalQuestions.filter(q => {
          const matchDiff = config.difficulty === 'ALL' || q.difficulty === config.difficulty;
          const matchType = config.questionTypes.includes(q.type);
          return matchDiff && matchType;
        });
        setMaxPossible(filtered.length);
        if (config.limit > filtered.length && filtered.length > 0) {
            setConfig(prev => ({ ...prev, limit: filtered.length }));
        } else if (filtered.length > 0 && config.limit === 0) {
            setConfig(prev => ({ ...prev, limit: Math.min(20, filtered.length) }));
        }
    } else {
        // STANDARD MODE: Bottleneck calculation
        // Requirements: 50% NB, 30% TH, 20% VD/VDC
        const maxNB = Math.floor(stats.nb / 0.5);
        const maxTH = Math.floor(stats.th / 0.3);
        const maxVD = Math.floor(stats.vd / 0.2);
        
        const calculatedMax = Math.min(maxNB, maxTH, maxVD);
        setMaxPossible(calculatedMax);
        
        // Note: In standard mode, we don't auto-clamp the limit here immediately to allow the UI to show "Not enough questions" 
        // if the preset requires more than available. Validation happens at submit or visual feedback.
    }
  }, [config.difficulty, config.questionTypes, totalQuestions, mode, stats]);

  // Update matrix display counts
  useEffect(() => {
      if (mode === 'STANDARD') {
          // Whenever limit changes (by preset or clamp), update distribution
          const actualLimit = Math.min(config.limit, maxPossible);
          setMatrixCounts({
              nb: Math.round(actualLimit * 0.5),
              th: Math.round(actualLimit * 0.3),
              vd: actualLimit - Math.round(actualLimit * 0.5) - Math.round(actualLimit * 0.3)
          });
      }
  }, [config.limit, mode, maxPossible]);

  const handlePresetSelect = (preset: typeof EXAM_PRESETS[0]) => {
      setConfig(prev => ({
          ...prev,
          durationMinutes: preset.time,
          limit: preset.questions
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Final clamp before starting
    const finalLimit = Math.min(config.limit, maxPossible);
    onStart({ ...config, limit: finalLimit });
  };

  const isValidToStart = maxPossible > 0 && (mode === 'CUSTOM' || (mode === 'STANDARD' && config.limit <= maxPossible));

  const toggleQuestionType = (type: QuestionType) => {
      setConfig(prev => {
          const current = prev.questionTypes;
          if (current.includes(type)) {
              // Avoid unchecking the last one? Optionally allow it but result is 0 matches.
              return { ...prev, questionTypes: current.filter(t => t !== type) };
          } else {
              return { ...prev, questionTypes: [...current, type] };
          }
      });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 flex justify-center items-center animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col border border-slate-200 overflow-hidden my-auto h-auto max-h-[95vh]">
        
        {/* Header */}
        <div className={`
            p-5 text-white flex items-center justify-between relative overflow-hidden shrink-0 transition-colors duration-500
            ${mode === 'STANDARD' ? 'bg-gradient-to-r from-red-600 to-rose-700' : 'bg-gradient-to-r from-indigo-600 to-blue-700'}
        `}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
          
          <div className="flex items-center gap-4 z-10">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                {mode === 'STANDARD' ? <GraduationCap className="w-6 h-6 text-white" /> : <PenTool className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                    {mode === 'STANDARD' ? 'Chế độ Kiểm tra' : 'Chế độ Luyện tập'}
                </h2>
                <p className="text-white/80 text-sm font-medium">
                    {mode === 'STANDARD' ? 'Thi thử theo cấu trúc ma trận chuẩn' : 'Tùy chỉnh kiến thức cần ôn luyện'}
                </p>
              </div>
          </div>

          <button 
            type="button"
            onClick={onBack}
            className="relative z-10 flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs md:text-sm font-bold transition-colors border border-white/20"
            title="Chọn đề khác"
          >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Chọn đề khác</span>
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 p-2 bg-slate-50 border-b border-slate-200 gap-2 shrink-0">
            <button
                type="button"
                onClick={() => setMode('STANDARD')}
                className={`py-3 px-3 rounded-xl text-sm md:text-base font-bold flex items-center justify-center gap-2 transition-all
                    ${mode === 'STANDARD' 
                        ? 'bg-white text-rose-600 shadow-md ring-1 ring-rose-100' 
                        : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'}`}
            >
                <GraduationCap size={20} /> Kiểm tra
            </button>
            <button
                type="button"
                onClick={() => setMode('CUSTOM')}
                className={`py-3 px-3 rounded-xl text-sm md:text-base font-bold flex items-center justify-center gap-2 transition-all
                    ${mode === 'CUSTOM' 
                        ? 'bg-white text-indigo-600 shadow-md ring-1 ring-indigo-100' 
                        : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'}`}
            >
                <PenTool size={18} /> Luyện tập
            </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6 overflow-y-auto">

          {/* Data Statistics */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm uppercase tracking-wide opacity-80">
                 <Database className="w-4 h-4" /> Thống kê kho dữ liệu
            </div>
            <div className="grid grid-cols-4 gap-2 md:gap-4">
                <div className="flex flex-col items-center p-2 bg-green-50 border border-green-100 rounded-lg shadow-sm">
                    <span className="text-[10px] md:text-xs font-bold text-green-600 uppercase mb-0.5">Nhận biết</span>
                    <span className="text-lg md:text-xl font-black text-green-700">{detailedStats.NB}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-blue-50 border border-blue-100 rounded-lg shadow-sm">
                    <span className="text-[10px] md:text-xs font-bold text-blue-600 uppercase mb-0.5">Thông hiểu</span>
                    <span className="text-lg md:text-xl font-black text-blue-700">{detailedStats.TH}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-orange-50 border border-orange-100 rounded-lg shadow-sm">
                    <span className="text-[10px] md:text-xs font-bold text-orange-600 uppercase mb-0.5">Vận dụng</span>
                    <span className="text-lg md:text-xl font-black text-orange-700">{detailedStats.VD}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-red-50 border border-red-100 rounded-lg shadow-sm">
                    <span className="text-[10px] md:text-xs font-bold text-red-600 uppercase mb-0.5">Vận dụng cao</span>
                    <span className="text-lg md:text-xl font-black text-red-700">{detailedStats.VDC}</span>
                </div>
            </div>
          </div>
          
          <div className="h-px bg-slate-100 w-full"></div>

          {mode === 'CUSTOM' ? (
              <div className="animate-fade-in space-y-6">
                {/* Luyện Tập: Difficulty Selection */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-slate-800 font-bold text-base">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Mức độ khó
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(DIFFICULTY_LABELS) as (Difficulty | 'ALL')[]).map((key) => {
                        const isActive = config.difficulty === key;
                        return (
                            <button
                            key={key}
                            type="button"
                            onClick={() => setConfig({ ...config, difficulty: key })}
                            className={`relative py-2 px-3 rounded-lg border text-sm font-semibold transition-all duration-200 flex items-center justify-between group
                                ${isActive 
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm ring-1 ring-indigo-600' 
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}
                            >
                            <span>{DIFFICULTY_LABELS[key]}</span>
                            {isActive && <div className="bg-indigo-600 text-white p-0.5 rounded-full"><Check size={12} strokeWidth={3} /></div>}
                            </button>
                        );
                    })}
                    </div>
                </div>

                {/* Luyện Tập: Question Type Selection */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-slate-800 font-bold text-base">
                    <ListFilter className="w-5 h-5 text-indigo-600" />
                    Dạng câu hỏi (Chọn nhiều)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allQuestionTypes.map((type) => {
                        const isActive = config.questionTypes.includes(type);
                        return (
                            <button
                            key={type}
                            type="button"
                            onClick={() => toggleQuestionType(type)}
                            className={`relative py-2 px-3 rounded-lg border text-sm font-semibold transition-all duration-200 flex items-center justify-between group
                                ${isActive 
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm ring-1 ring-indigo-600' 
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}
                            >
                            <span>{TYPE_LABELS[type]}</span>
                            {isActive && <div className="bg-indigo-600 text-white p-0.5 rounded-full"><Check size={12} strokeWidth={3} /></div>}
                            </button>
                        );
                    })}
                    </div>
                </div>
              </div>
          ) : (
             <div className="space-y-4">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                     <label className="flex items-center gap-2 text-slate-800 font-bold text-base">
                        <Timer className="w-5 h-5 text-rose-600" />
                        Chọn thời gian kiểm tra
                     </label>
                     <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${maxPossible > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        Kho đề đáp ứng tối đa: {maxPossible} câu chuẩn
                     </span>
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                     {EXAM_PRESETS.map((preset) => {
                         const isActive = config.durationMinutes === preset.time;
                         const isInsufficient = preset.questions > maxPossible;
                         
                         return (
                             <button
                                key={preset.time}
                                type="button"
                                onClick={() => handlePresetSelect(preset)}
                                className={`
                                    relative p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 min-h-[100px]
                                    ${isActive 
                                        ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-md scale-105 z-10' 
                                        : 'border-slate-200 hover:border-rose-200 hover:bg-white'}
                                    ${isInsufficient && !isActive ? 'opacity-60 bg-slate-50 grayscale-[0.5]' : ''}
                                    ${isInsufficient && isActive ? 'bg-red-50 border-red-500 text-red-700' : ''}
                                `}
                             >
                                 <span className={`text-lg font-black ${isActive ? (isInsufficient ? 'text-red-600' : 'text-rose-600') : 'text-slate-700'}`}>
                                    {preset.label}
                                 </span>
                                 
                                 <div className="flex flex-col items-center">
                                     <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm border 
                                        ${isActive 
                                            ? 'bg-white border-slate-100' 
                                            : 'bg-slate-100 border-slate-200 text-slate-500'}
                                     `}>
                                         {preset.questions} câu
                                     </span>
                                     {isInsufficient && (
                                         <span className="text-[10px] font-bold text-red-500 mt-1 bg-red-100 px-1.5 py-0.5 rounded">
                                             Thiếu {preset.questions - maxPossible} câu
                                         </span>
                                     )}
                                 </div>

                                 {isActive && <div className={`absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse ${isInsufficient ? 'bg-red-500' : 'bg-rose-600'}`}></div>}
                             </button>
                         )
                     })}
                 </div>

                 {/* Calculated Info for Standard Mode */}
                 {config.limit > maxPossible ? (
                     <div className="flex items-start gap-3 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium animate-pulse">
                         <div className="bg-white p-1 rounded-full shrink-0"><AlertTriangle size={14} /></div>
                         <span>
                             Bạn chọn đề {config.limit} câu, nhưng kho đề chỉ đủ ma trận chuẩn cho <strong>{maxPossible}</strong> câu. 
                             Hệ thống sẽ tạo đề với {maxPossible} câu.
                         </span>
                     </div>
                 ) : (
                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="text-sm font-bold text-slate-500">Dự kiến phân bổ:</div>
                        <div className="flex gap-2">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg font-bold text-xs">{matrixCounts.nb} NB</span>
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-bold text-xs">{matrixCounts.th} TH</span>
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg font-bold text-xs">{matrixCounts.vd} VD+</span>
                        </div>
                    </div>
                 )}
             </div>
          )}

          <div className="pt-4 border-t border-slate-200">
             <button 
                type="submit"
                disabled={!isValidToStart}
                className={`w-full py-3.5 rounded-xl text-lg font-bold shadow-lg flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5
                    ${isValidToStart 
                        ? (mode === 'STANDARD' 
                            ? (config.limit > maxPossible ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-200' : 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-rose-200')
                            : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-200')
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
             >
                <Play fill="currentColor" className="w-5 h-5" />
                {mode === 'STANDARD' 
                    ? (config.limit > maxPossible ? `Bắt đầu với ${maxPossible} câu` : 'Bắt đầu Thi thử') 
                    : 'Bắt đầu Luyện tập'}
             </button>
             {maxPossible === 0 && (
                 <p className="text-red-500 text-center mt-3 text-sm font-medium bg-red-50 p-2 rounded-lg">
                     {mode === 'STANDARD' ? 'Không đủ câu hỏi để tạo đề chuẩn (Thiếu câu NB, TH hoặc VD).' : 'Không tìm thấy câu hỏi phù hợp.'}
                 </p>
             )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamConfigView;