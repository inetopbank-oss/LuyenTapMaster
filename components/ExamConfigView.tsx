import React, { useState, useEffect } from 'react';
import { Settings, Play, BookOpen, Clock, ListFilter, Check, PieChart, PenTool, GraduationCap, Timer, ArrowLeft, FileJson, Database, AlertTriangle, ChevronRight, BarChart3, Zap, Layers } from 'lucide-react';
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
    { time: 90, questions: 50, label: '90 Phút' },
];

const ExamConfigView: React.FC<ExamConfigViewProps> = ({ totalQuestions, onStart, onBack }) => {
  const [mode, setMode] = useState<'CUSTOM' | 'STANDARD'>('STANDARD'); 
  const allQuestionTypes: QuestionType[] = ['MCQ', 'Essay', 'TF', 'SA'];

  const [config, setConfig] = useState<ExamConfig>({
    mode: 'STANDARD',
    difficulty: 'ALL',
    questionTypes: allQuestionTypes,
    limit: 30,
    durationMinutes: 45, 
  });
  
  const [maxPossible, setMaxPossible] = useState(0);
  const [matrixCounts, setMatrixCounts] = useState({ nb: 0, th: 0, vd: 0 });

  const detailedStats = React.useMemo(() => {
    return {
      NB: totalQuestions.filter(q => q.difficulty === 'NB').length,
      TH: totalQuestions.filter(q => q.difficulty === 'TH').length,
      VD: totalQuestions.filter(q => q.difficulty === 'VD').length,
      VDC: totalQuestions.filter(q => q.difficulty === 'VDC').length,
      Total: totalQuestions.length
    };
  }, [totalQuestions]);

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
        const maxNB = Math.floor(stats.nb / 0.5);
        const maxTH = Math.floor(stats.th / 0.3);
        const maxVD = Math.floor(stats.vd / 0.2);
        const calculatedMax = Math.min(maxNB, maxTH, maxVD);
        setMaxPossible(calculatedMax);
    }
  }, [config.difficulty, config.questionTypes, totalQuestions, mode, stats]);

  useEffect(() => {
      if (mode === 'STANDARD') {
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
    const finalLimit = Math.min(config.limit, maxPossible);
    onStart({ ...config, limit: finalLimit });
  };

  const isValidToStart = maxPossible > 0 && (mode === 'CUSTOM' || (mode === 'STANDARD' && config.limit <= maxPossible));

  const toggleQuestionType = (type: QuestionType) => {
      setConfig(prev => {
          const current = prev.questionTypes;
          if (current.includes(type)) {
              return { ...prev, questionTypes: current.filter(t => t !== type) };
          } else {
              return { ...prev, questionTypes: [...current, type] };
          }
      });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-start md:items-center p-3 md:p-0 font-sans animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col md:flex-row md:overflow-hidden h-auto md:h-[520px] border border-slate-200 my-8 md:my-0">

        {/* LEFT SIDEBAR: Context & Mode & Stats */}
        <div className="w-full md:w-64 bg-slate-50 p-4 md:p-5 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 md:overflow-y-auto">
            {/* Header */}
            <div className="mb-5">
                <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 text-xs font-bold mb-3 transition-colors">
                    <ArrowLeft size={14} /> Quay lại
                </button>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">Thiết lập đề</h1>
                <div className="flex items-center gap-1.5 mt-1 text-slate-500 font-medium text-xs">
                    <Database size={12} />
                    <span>Kho: <strong className="text-slate-800">{detailedStats.Total}</strong> câu</span>
                </div>
            </div>

            {/* Mode Selection */}
            <div className="space-y-2 mb-6">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chế độ</label>
                <button
                    onClick={() => setMode('STANDARD')}
                    className={`w-full p-2.5 rounded-lg flex items-center gap-2.5 transition-all text-left group border
                        ${mode === 'STANDARD' 
                            ? 'bg-white border-rose-200 shadow-sm' 
                            : 'bg-slate-100 border-transparent hover:bg-white hover:border-slate-200'}`}
                >
                    <div className={`p-1.5 rounded-md shrink-0 ${mode === 'STANDARD' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500 group-hover:bg-rose-50 group-hover:text-rose-500'}`}>
                        <GraduationCap size={16} />
                    </div>
                    <div>
                        <div className={`font-bold text-sm leading-tight ${mode === 'STANDARD' ? 'text-slate-800' : 'text-slate-600'}`}>Kiểm tra</div>
                        <div className="text-[10px] text-slate-400">Chuẩn ma trận</div>
                    </div>
                </button>

                <button
                    onClick={() => setMode('CUSTOM')}
                    className={`w-full p-2.5 rounded-lg flex items-center gap-2.5 transition-all text-left group border
                        ${mode === 'CUSTOM' 
                            ? 'bg-white border-indigo-200 shadow-sm' 
                            : 'bg-slate-100 border-transparent hover:bg-white hover:border-slate-200'}`}
                >
                     <div className={`p-1.5 rounded-md shrink-0 ${mode === 'CUSTOM' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                        <PenTool size={16} />
                    </div>
                    <div>
                        <div className={`font-bold text-sm leading-tight ${mode === 'CUSTOM' ? 'text-slate-800' : 'text-slate-600'}`}>Luyện tập</div>
                        <div className="text-[10px] text-slate-400">Tùy chỉnh</div>
                    </div>
                </button>
            </div>

            {/* Mini Stats Grid */}
            <div className="mt-auto hidden md:block">
                 <div className="grid grid-cols-2 gap-1.5">
                    {[
                        { l: 'NB', v: detailedStats.NB, c: 'text-green-700 bg-green-50' },
                        { l: 'TH', v: detailedStats.TH, c: 'text-blue-700 bg-blue-50' },
                        { l: 'VD', v: detailedStats.VD, c: 'text-orange-700 bg-orange-50' },
                        { l: 'VDC', v: detailedStats.VDC, c: 'text-red-700 bg-red-50' }
                    ].map((item, i) => (
                        <div key={i} className={`px-2 py-1.5 rounded-md border border-slate-100/50 shadow-sm ${item.c}`}>
                            <div className="text-[9px] font-bold uppercase opacity-70">{item.l}</div>
                            <div className="text-sm font-black leading-tight">{item.v}</div>
                        </div>
                    ))}
                 </div>
            </div>
        </div>

        {/* RIGHT MAIN: Configuration Form */}
        <div className="flex-1 flex flex-col bg-white md:overflow-hidden relative">
             <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full">
                 <div className="flex-1 md:overflow-y-auto p-5 md:p-6 space-y-5">
                    {mode === 'STANDARD' ? (
                        <div className="space-y-5 animate-fade-in">
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                    <Clock size={14} /> Thời gian & Số lượng câu
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                    {EXAM_PRESETS.map((preset) => {
                                        const isActive = config.durationMinutes === preset.time;
                                        const isInsufficient = preset.questions > maxPossible;
                                        return (
                                            <button
                                                key={preset.time}
                                                type="button"
                                                onClick={() => handlePresetSelect(preset)}
                                                className={`
                                                    relative p-2.5 rounded-lg border flex flex-col items-start gap-0.5 text-left transition-all
                                                    ${isActive 
                                                        ? 'bg-rose-50 border-rose-500 ring-1 ring-rose-500 z-10' 
                                                        : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50'}
                                                    ${isInsufficient && !isActive ? 'opacity-60 grayscale' : ''}
                                                `}
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <span className={`font-bold text-sm ${isActive ? 'text-rose-700' : 'text-slate-700'}`}>{preset.label}</span>
                                                    {isActive && <Check size={14} className="text-rose-600" />}
                                                </div>
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isActive ? 'bg-white text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {preset.questions} câu
                                                </span>
                                                {isInsufficient && (
                                                    <div className="absolute top-2 right-2 text-red-500" title="Thiếu câu hỏi">
                                                        <AlertTriangle size={12} />
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            
                            {/* Feedback Box */}
                             {config.limit > maxPossible ? (
                                <div className="p-3 bg-orange-50 text-orange-800 rounded-lg border border-orange-100 text-sm flex gap-2.5 items-start">
                                     <AlertTriangle className="shrink-0 text-orange-500 mt-0.5" size={16} />
                                     <div>
                                         <span className="font-bold block text-xs uppercase mb-0.5">Không đủ câu hỏi</span>
                                         <span className="text-xs">Chỉ đủ <strong>{maxPossible}</strong> câu chuẩn (5:3:2). Hệ thống sẽ tự động giảm.</span>
                                     </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-slate-50 text-slate-600 rounded-lg border border-slate-100 flex flex-col gap-2">
                                    <span className="font-bold text-xs uppercase flex items-center gap-1.5"><PieChart size={14} /> Phân bổ ma trận:</span>
                                    <div className="flex gap-2 text-[10px] md:text-xs font-bold">
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded flex-1 text-center border border-green-200">{matrixCounts.nb} NB</span>
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded flex-1 text-center border border-blue-200">{matrixCounts.th} TH</span>
                                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded flex-1 text-center border border-orange-200">{matrixCounts.vd} VD+</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Difficulty */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                        <BookOpen size={14} /> Mức độ
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(Object.keys(DIFFICULTY_LABELS) as (Difficulty | 'ALL')[]).map((key) => {
                                            const isActive = config.difficulty === key;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setConfig({ ...config, difficulty: key })}
                                                    className={`px-2.5 py-1.5 rounded-md text-xs font-bold border transition-all
                                                        ${isActive 
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                                        : 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 bg-white'}`}
                                                >
                                                    {DIFFICULTY_LABELS[key]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Question Type */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                        <ListFilter size={14} /> Dạng câu
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {allQuestionTypes.map((type) => {
                                            const isActive = config.questionTypes.includes(type);
                                            return (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => toggleQuestionType(type)}
                                                    className={`px-2.5 py-1.5 rounded-md text-xs font-bold border transition-all flex items-center gap-1.5
                                                        ${isActive 
                                                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700' 
                                                        : 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 bg-white'}`}
                                                >
                                                    {isActive && <Check size={12} strokeWidth={3} />}
                                                    {TYPE_LABELS[type]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Range Inputs */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-700">Số lượng: <span className="text-indigo-600 text-base">{config.limit}</span></span>
                                        <span className="text-[10px] text-slate-400">Tối đa: {maxPossible}</span>
                                    </div>
                                    <input 
                                        type="range" min="5" max={Math.max(5, maxPossible)} step="1"
                                        value={config.limit}
                                        onChange={(e) => setConfig({...config, limit: parseInt(e.target.value)})}
                                        disabled={maxPossible === 0}
                                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200 accent-indigo-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                     <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-700">Thời gian: <span className="text-indigo-600 text-base">{config.durationMinutes}p</span></span>
                                    </div>
                                    <input 
                                        type="range" min="5" max="180" step="5"
                                        value={config.durationMinutes}
                                        onChange={(e) => setConfig({...config, durationMinutes: parseInt(e.target.value)})}
                                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200 accent-indigo-600"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                 </div>

                 {/* Footer Action */}
                 <div className="p-4 md:p-5 border-t border-slate-100 bg-slate-50/50 mt-auto">
                     <button 
                        type="submit"
                        disabled={!isValidToStart}
                        className={`w-full py-3 rounded-xl text-base font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5
                            ${isValidToStart 
                                ? (mode === 'STANDARD' 
                                    ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:shadow-rose-100 text-white'
                                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-indigo-100 text-white')
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                     >
                        <Zap fill="currentColor" size={18} />
                        {mode === 'STANDARD' 
                            ? (config.limit > maxPossible ? `Thi thử (${maxPossible} câu)` : 'Bắt đầu Thi thử') 
                            : 'Bắt đầu Luyện tập'}
                     </button>
                     {maxPossible === 0 && (
                         <p className="text-red-500 text-center mt-2 text-[10px] font-bold">
                             * Không tìm thấy câu hỏi phù hợp.
                         </p>
                     )}
                 </div>
             </form>
        </div>

      </div>
    </div>
  );
};

export default ExamConfigView;