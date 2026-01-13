import React, { useState, useEffect } from 'react';
import { Settings, Play, BookOpen, Clock, ListFilter, Check, PieChart, Sliders } from 'lucide-react';
import { Question, ExamConfig, Difficulty, QuestionType, DIFFICULTY_LABELS, TYPE_LABELS } from '../types';

interface ExamConfigViewProps {
  totalQuestions: Question[];
  onStart: (config: ExamConfig) => void;
}

const ExamConfigView: React.FC<ExamConfigViewProps> = ({ totalQuestions, onStart }) => {
  const [mode, setMode] = useState<'CUSTOM' | 'STANDARD'>('CUSTOM');
  const [config, setConfig] = useState<ExamConfig>({
    mode: 'CUSTOM',
    difficulty: 'ALL',
    questionType: 'ALL',
    limit: 20,
    durationMinutes: 30,
  });
  
  const [maxPossible, setMaxPossible] = useState(0);
  const [matrixCounts, setMatrixCounts] = useState({ nb: 0, th: 0, vd: 0 });

  // Calculate stats for Standard Mode
  const stats = React.useMemo(() => {
    const nb = totalQuestions.filter(q => q.difficulty === 'NB').length;
    const th = totalQuestions.filter(q => q.difficulty === 'TH').length;
    const vd = totalQuestions.filter(q => ['VD', 'VDC'].includes(q.difficulty)).length;
    return { nb, th, vd };
  }, [totalQuestions]);

  useEffect(() => {
    setConfig(prev => ({ ...prev, mode }));
  }, [mode]);

  useEffect(() => {
    if (mode === 'CUSTOM') {
        const filtered = totalQuestions.filter(q => {
          const matchDiff = config.difficulty === 'ALL' || q.difficulty === config.difficulty;
          const matchType = config.questionType === 'ALL' || q.type === config.questionType;
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

        // Auto adjust limit if current limit exceeds max
        if (config.limit > calculatedMax) {
             setConfig(prev => ({ ...prev, limit: calculatedMax }));
        }
    }
  }, [config.difficulty, config.questionType, totalQuestions, mode, stats]);

  // Update matrix display counts
  useEffect(() => {
      if (mode === 'STANDARD') {
          setMatrixCounts({
              nb: Math.round(config.limit * 0.5),
              th: Math.round(config.limit * 0.3),
              vd: config.limit - Math.round(config.limit * 0.5) - Math.round(config.limit * 0.3)
          });
      }
  }, [config.limit, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(config);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 flex justify-center items-center animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col border border-slate-200 overflow-hidden my-auto h-auto max-h-[90vh]">
        
        {/* Header - Compact */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-5 text-white flex items-center gap-4 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
          <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Cấu hình bài thi</h2>
            <p className="text-indigo-100 text-sm font-medium">Tùy chỉnh thông số bài luyện tập</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex p-2 bg-slate-50 border-b border-slate-200 gap-2 shrink-0">
            <button
                type="button"
                onClick={() => setMode('CUSTOM')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all
                    ${mode === 'CUSTOM' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                <Sliders size={16} /> Tùy chỉnh
            </button>
            <button
                type="button"
                onClick={() => setMode('STANDARD')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all
                    ${mode === 'STANDARD' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                <PieChart size={16} /> Ma trận chuẩn
            </button>
        </div>

        {/* Form - Compact */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6 overflow-y-auto">
          
          {mode === 'CUSTOM' ? (
              <>
                {/* Difficulty Selection */}
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

                {/* Question Type Selection */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-slate-800 font-bold text-base">
                    <ListFilter className="w-5 h-5 text-indigo-600" />
                    Dạng câu hỏi
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(TYPE_LABELS) as (QuestionType | 'ALL')[]).map((key) => {
                        const isActive = config.questionType === key;
                        return (
                            <button
                            key={key}
                            type="button"
                            onClick={() => setConfig({ ...config, questionType: key })}
                            className={`relative py-2 px-3 rounded-lg border text-sm font-semibold transition-all duration-200 flex items-center justify-between group
                                ${isActive 
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm ring-1 ring-indigo-600' 
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}
                            >
                            <span>{TYPE_LABELS[key]}</span>
                            {isActive && <div className="bg-indigo-600 text-white p-0.5 rounded-full"><Check size={12} strokeWidth={3} /></div>}
                            </button>
                        );
                    })}
                    </div>
                </div>
              </>
          ) : (
              /* Standard Mode Info */
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
                  <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                      <PieChart size={18} /> Cấu trúc đề thi (50-30-20)
                  </h3>
                  <p className="text-sm text-indigo-600 leading-relaxed">
                      Hệ thống sẽ tự động chọn câu hỏi theo tỷ lệ chuẩn:
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-sm">
                          <div className="text-xl font-black text-indigo-600">50%</div>
                          <div className="text-xs font-bold text-slate-500">Nhận biết</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-sm">
                          <div className="text-xl font-black text-indigo-600">30%</div>
                          <div className="text-xs font-bold text-slate-500">Thông hiểu</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-sm">
                          <div className="text-xl font-black text-indigo-600">20%</div>
                          <div className="text-xs font-bold text-slate-500">Vận dụng</div>
                      </div>
                  </div>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Question Count */}
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <label className="flex items-center gap-2 text-slate-800 font-bold text-base">
                        <ListFilter className="w-5 h-5 text-indigo-600" />
                        Số lượng
                    </label>
                    <span className="text-xl font-black text-indigo-600 tabular-nums">{config.limit}</span>
                </div>
                <div className="relative pt-1">
                    <input 
                        type="range" 
                        min="5" 
                        max={Math.max(5, maxPossible)} 
                        step="1" // Use step 10 for standard mode to easier grouping? No, keep it granular.
                        value={config.limit}
                        onChange={(e) => setConfig({...config, limit: parseInt(e.target.value)})}
                        disabled={maxPossible === 0}
                        className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <div className="flex justify-between mt-1 text-slate-400 font-medium text-xs">
                        <span>5</span>
                        <span>{maxPossible}</span>
                    </div>
                </div>
                {mode === 'STANDARD' && maxPossible > 0 && (
                     <div className="text-xs flex gap-2 mt-2">
                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">{matrixCounts.nb} NB</span>
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{matrixCounts.th} TH</span>
                        <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">{matrixCounts.vd} VD+</span>
                     </div>
                )}
                 {mode === 'CUSTOM' && (
                    <p className="text-xs text-slate-500 font-medium bg-slate-100 inline-block px-2 py-1 rounded">
                        Có <span className="font-bold text-slate-800">{maxPossible}</span> câu phù hợp.
                    </p>
                 )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <label className="flex items-center gap-2 text-slate-800 font-bold text-base">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        Thời gian
                    </label>
                    <span className="text-xl font-black text-indigo-600 tabular-nums">{config.durationMinutes}<span className="text-sm text-slate-400 ml-1 font-bold">phút</span></span>
                </div>
                <div className="relative pt-1">
                    <input 
                        type="range" 
                        min="5" 
                        max="180" 
                        step="5"
                        value={config.durationMinutes}
                        onChange={(e) => setConfig({...config, durationMinutes: parseInt(e.target.value)})}
                        className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <div className="flex justify-between mt-1 text-slate-400 font-medium text-xs">
                        <span>5p</span>
                        <span>180p</span>
                    </div>
                </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
             <button 
                type="submit"
                disabled={maxPossible === 0}
                className={`w-full py-3 rounded-xl text-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5
                    ${maxPossible > 0 
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-200' 
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
             >
                <Play fill="currentColor" className="w-5 h-5" />
                Bắt đầu làm bài
             </button>
             {maxPossible === 0 && (
                 <p className="text-red-500 text-center mt-3 text-sm font-medium">
                     {mode === 'STANDARD' ? 'Không đủ dữ liệu để tạo đề chuẩn (Thiếu câu hỏi NB, TH hoặc VD).' : 'Không tìm thấy câu hỏi phù hợp.'}
                 </p>
             )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamConfigView;