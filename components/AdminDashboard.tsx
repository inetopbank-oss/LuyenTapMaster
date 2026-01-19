import React, { useState, useEffect } from 'react';
import { Database, FileDown, LogOut, PieChart, AlertTriangle, Check, Layers, Settings, FileJson, Plus, Trash2, PenTool, BookOpen, Save, RefreshCw, Clock } from 'lucide-react';
import { Question, Difficulty } from '../types';
import { shuffleArray } from '../utils';
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ questionBank, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'GENERATE' | 'MANAGE'>('GENERATE');
  
  // --- STATE FOR GENERATOR ---
  const [examTitle, setExamTitle] = useState('Đề kiểm tra Toán 12');
  const [duration, setDuration] = useState(15);
  const [totalQuestions, setTotalQuestions] = useState(15);
  const [matrix, setMatrix] = useState<MatrixConfig>({ NB: 8, TH: 6, VD: 4, VDC: 2 });
  const [genError, setGenError] = useState<string | null>(null);

  // --- STATE FOR MANAGER (Creator) ---
  // Initialize managed bank with loaded questions
  const [managedBank, setManagedBank] = useState<Question[]>(questionBank);
  const [formLesson, setFormLesson] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formDiff, setFormDiff] = useState<Difficulty>('NB');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formCorrect, setFormCorrect] = useState('A');
  const [formExplanation, setFormExplanation] = useState('');
  const [manageSuccess, setManageSuccess] = useState<string | null>(null);

  // Analyze Managed Bank (Dynamic)
  const stats = React.useMemo(() => {
    return {
      NB: managedBank.filter(q => q.difficulty === 'NB').length,
      TH: managedBank.filter(q => q.difficulty === 'TH').length,
      VD: managedBank.filter(q => q.difficulty === 'VD').length,
      VDC: managedBank.filter(q => q.difficulty === 'VDC').length,
      Total: managedBank.length
    };
  }, [managedBank]);

  // --- GENERATOR LOGIC ---
  
  // Helper to get ratios based on duration
  const getRatios = (mins: number) => {
    if (mins <= 15) return { NB: 0.60, TH: 0.40, VD: 0.00, VDC: 0.00 };
    if (mins <= 30) return { NB: 0.50, TH: 0.35, VD: 0.15, VDC: 0.00 };
    if (mins <= 45) return { NB: 0.40, TH: 0.35, VD: 0.20, VDC: 0.05 };
    if (mins <= 60) return { NB: 0.35, TH: 0.35, VD: 0.25, VDC: 0.05 };
    return { NB: 0.30, TH: 0.35, VD: 0.30, VDC: 0.05 }; // >= 90 mins
  };

  // Auto-distribute when total or duration changes
  useEffect(() => {
    const r = getRatios(duration);
    const nb = Math.round(totalQuestions * r.NB);
    const th = Math.round(totalQuestions * r.TH);
    const vd = Math.round(totalQuestions * r.VD);
    // VDC takes the remainder to ensure sum equals totalQuestions exactly
    const vdc = Math.max(0, totalQuestions - nb - th - vd);
    
    setMatrix({ NB: nb, TH: th, VD: vd, VDC: vdc });
  }, [totalQuestions, duration]);

  const handleMatrixChange = (key: keyof MatrixConfig, val: number) => {
    const newVal = Math.max(0, val);
    const newMatrix = { ...matrix, [key]: newVal };
    setMatrix(newMatrix);
    
    // Update total automatically
    const newTotal = newMatrix.NB + newMatrix.TH + newMatrix.VD + newMatrix.VDC;
    setTotalQuestions(newTotal);
  };

  const handlePresetDuration = (mins: number) => {
      setDuration(mins);
      // Auto adjust question count recommendation based on duration
      let recommendedQ = 20;
      if (mins === 15) recommendedQ = 15;
      else if (mins === 30) recommendedQ = 20;
      else if (mins === 45) recommendedQ = 30;
      else if (mins === 60) recommendedQ = 40;
      else if (mins === 90) recommendedQ = 50;
      
      setTotalQuestions(recommendedQ);
  };

  const handleExportExam = () => {
    setGenError(null);
    
    // 1. Validation
    if (matrix.NB > stats.NB) return setGenError(`Không đủ câu Nhận biết (Cần ${matrix.NB}, Có ${stats.NB})`);
    if (matrix.TH > stats.TH) return setGenError(`Không đủ câu Thông hiểu (Cần ${matrix.TH}, Có ${stats.TH})`);
    if (matrix.VD > stats.VD) return setGenError(`Không đủ câu Vận dụng (Cần ${matrix.VD}, Có ${stats.VD})`);
    if (matrix.VDC > stats.VDC) return setGenError(`Không đủ câu VD Cao (Cần ${matrix.VDC}, Có ${stats.VDC})`);

    // 2. Generation (Use managedBank instead of initial questionBank prop)
    const nbList = shuffleArray(managedBank.filter(q => q.difficulty === 'NB')).slice(0, matrix.NB);
    const thList = shuffleArray(managedBank.filter(q => q.difficulty === 'TH')).slice(0, matrix.TH);
    const vdList = shuffleArray(managedBank.filter(q => q.difficulty === 'VD')).slice(0, matrix.VD);
    const vdcList = shuffleArray(managedBank.filter(q => q.difficulty === 'VDC')).slice(0, matrix.VDC);

    let finalQuestions = [...nbList, ...thList, ...vdList, ...vdcList];
    
    // Sort logic for Exam: NB -> TH -> VD -> VDC
    const difficultyRank: Record<string, number> = { 'NB': 1, 'TH': 2, 'VD': 3, 'VDC': 4 };
    finalQuestions.sort((a: Question, b: Question) => (difficultyRank[a.difficulty] || 5) - (difficultyRank[b.difficulty] || 5));

    const examData = {
      title: `${examTitle} (${duration} phút)`,
      duration: duration,
      createdAt: new Date().toISOString(),
      questionCount: finalQuestions.length,
      questions: finalQuestions
    };

    // Filename logic: De_kiem_tra_[Duration]p_[Title].json
    const safeTitle = examTitle.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_');
    const filename = `De_KT_${duration}p_${safeTitle}.json`;

    downloadJSON(examData, filename);
  };

  // --- MANAGER LOGIC ---
  const handleAddQuestion = () => {
      if (!formContent.trim()) return alert("Vui lòng nhập nội dung câu hỏi");
      if (formOptions.some(o => !o.trim())) return alert("Vui lòng nhập đủ 4 phương án");
      if (!formLesson.trim()) return alert("Vui lòng nhập tên bài học/chương");

      const newQ: Question = {
          id: `new-${Date.now()}`,
          type: 'MCQ',
          content: formContent,
          difficulty: formDiff,
          lesson: formLesson,
          options: formOptions.map((opt, idx) => `${String.fromCharCode(65+idx)}. ${opt}`),
          correctAnswer: formCorrect,
          explanation: formExplanation
      };

      setManagedBank(prev => [newQ, ...prev]);
      
      // Reset critical fields, keep Lesson for convenience
      setFormContent('');
      setFormOptions(['', '', '', '']);
      setFormExplanation('');
      setManageSuccess('Đã thêm câu hỏi mới!');
      setTimeout(() => setManageSuccess(null), 2000);
  };

  const handleDeleteQuestion = (id: string) => {
      if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
          setManagedBank(prev => prev.filter(q => q.id !== id));
      }
  };

  const handleExportBank = () => {
      const bankData = {
          title: "Ngân hàng câu hỏi MathPro",
          exportedAt: new Date().toISOString(),
          questionCount: managedBank.length,
          questions: managedBank
      };
      downloadJSON(bankData, `MathPro_Bank_${new Date().toISOString().slice(0,10)}.json`);
  };

  const downloadJSON = (data: any, filename: string) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleOptionChange = (idx: number, val: string) => {
      const newOpts = [...formOptions];
      newOpts[idx] = val;
      setFormOptions(newOpts);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="bg-indigo-500 p-2 rounded-lg shrink-0">
                <Settings size={20} className="text-white" />
             </div>
             <div>
                <h1 className="font-bold text-lg leading-tight">Khu vực Giáo viên</h1>
                <p className="text-slate-400 text-xs">Quản lý & Thiết lập đề kiểm tra</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-800 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
              <button 
                onClick={() => setActiveTab('GENERATE')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'GENERATE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                  <Layers size={16} /> Tạo đề thi
              </button>
              <button 
                onClick={() => setActiveTab('MANAGE')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'MANAGE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                  <PenTool size={16} /> Soạn câu hỏi
              </button>
          </div>

          <button 
            onClick={onLogout}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors border border-slate-700 whitespace-nowrap"
          >
            <LogOut size={16} /> Thoát
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 animate-fade-in">
        
        {/* VIEW 1: GENERATOR */}
        {activeTab === 'GENERATE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Bank Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 uppercase tracking-wider text-sm">
                    <Database size={18} className="text-indigo-600" /> Thống kê Kho hiện tại
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-600 text-sm">Tổng số câu</span>
                        <span className="font-black text-indigo-600 text-lg">{stats.Total}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                            <div className="text-xs font-bold text-green-700 uppercase opacity-70 mb-1">Nhận biết</div>
                            <div className="font-black text-green-800 text-xl">{stats.NB}</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="text-xs font-bold text-blue-700 uppercase opacity-70 mb-1">Thông hiểu</div>
                            <div className="font-black text-blue-800 text-xl">{stats.TH}</div>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                            <div className="text-xs font-bold text-orange-700 uppercase opacity-70 mb-1">Vận dụng</div>
                            <div className="font-black text-orange-800 text-xl">{stats.VD}</div>
                        </div>
                        <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                            <div className="text-xs font-bold text-red-700 uppercase opacity-70 mb-1">VDC</div>
                            <div className="font-black text-red-800 text-xl">{stats.VDC}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                <FileJson className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 rotate-12" />
                <h3 className="font-bold text-lg mb-2">Hướng dẫn Giáo viên</h3>
                <ul className="text-indigo-100 text-sm space-y-2 list-disc pl-4 relative z-10">
                    <li>Bước 1: Import ngân hàng câu hỏi (tab Soạn câu hỏi hoặc upload ban đầu).</li>
                    <li>Bước 2: Chọn thời gian kiểm tra (15-90p).</li>
                    <li>Bước 3: Xuất file JSON và gửi cho học sinh làm bài.</li>
                </ul>
            </div>
          </div>

          {/* Right Column: Configuration */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Layers className="text-indigo-600" /> Thiết lập Đề kiểm tra
                    </h2>
                </div>
                
                <div className="p-6 md:p-8 space-y-8">
                    {/* General Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên đề thi</label>
                            <input 
                                type="text" 
                                value={examTitle}
                                onChange={(e) => setExamTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={14} /> Thời gian làm bài
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[15, 30, 45, 60, 90].map(mins => (
                                    <button
                                        key={mins}
                                        onClick={() => handlePresetDuration(mins)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${
                                            duration === mins 
                                            ? 'bg-indigo-600 text-white border-indigo-600' 
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                                        }`}
                                    >
                                        {mins}p
                                    </button>
                                ))}
                            </div>
                            <input 
                                type="number" 
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all mt-1"
                            />
                        </div>
                    </div>

                    {/* Matrix Settings */}
                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <PieChart size={16} /> Ma trận câu hỏi
                            </label>
                            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                Tổng: {totalQuestions} câu
                            </span>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { k: 'NB', l: 'Nhận biết', c: 'green', max: stats.NB },
                                { k: 'TH', l: 'Thông hiểu', c: 'blue', max: stats.TH },
                                { k: 'VD', l: 'Vận dụng', c: 'orange', max: stats.VD },
                                { k: 'VDC', l: 'Vận dụng cao', c: 'red', max: stats.VDC },
                            ].map((item) => (
                                <div key={item.k} className="flex items-center gap-4 group">
                                    <div className={`w-24 text-xs font-bold uppercase py-1 px-2 rounded bg-${item.c}-50 text-${item.c}-700 border border-${item.c}-100 text-center shrink-0`}>
                                        {item.l}
                                    </div>
                                    <div className="flex-1 relative h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                        <div 
                                            className={`absolute top-0 left-0 h-full bg-${item.c}-500/20 transition-all`} 
                                            style={{ width: `${(matrix[item.k as keyof MatrixConfig] / (item.max || 1)) * 100}%` }}
                                        ></div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max={item.max} 
                                            value={matrix[item.k as keyof MatrixConfig]}
                                            onChange={(e) => handleMatrixChange(item.k as keyof MatrixConfig, parseInt(e.target.value))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="absolute inset-0 flex items-center px-4 justify-between pointer-events-none">
                                            <span className="text-xs font-bold text-slate-500">Kéo để chỉnh</span>
                                            <span className="text-sm font-black text-slate-800">
                                                {matrix[item.k as keyof MatrixConfig]} <span className="text-slate-400 font-normal">/ {item.max}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <input 
                                        type="number"
                                        min="0"
                                        max={item.max}
                                        value={matrix[item.k as keyof MatrixConfig]}
                                        onChange={(e) => handleMatrixChange(item.k as keyof MatrixConfig, parseInt(e.target.value))}
                                        className="w-16 p-2 text-center font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="pt-6 border-t border-slate-100">
                        {genError && (
                            <div className="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 font-bold animate-fade-in">
                                <AlertTriangle size={20} /> {genError}
                            </div>
                        )}
                        <button
                            onClick={handleExportExam}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-indigo-200 transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
                        >
                            <FileDown size={24} />
                            Xuất file đề kiểm tra (JSON)
                        </button>
                        <p className="text-center text-xs text-slate-400 mt-2">File xuất ra sẽ được định dạng: De_KT_{duration}p_[Tên đề].json</p>
                    </div>

                </div>
            </div>
          </div>
        </div>
        )}

        {/* VIEW 2: MANAGER (CREATOR) */}
        {activeTab === 'MANAGE' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Input (Left/Top) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Plus className="text-indigo-600" /> Thêm câu hỏi mới
                            </h2>
                            {manageSuccess && (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 animate-fade-in">
                                    {manageSuccess}
                                </span>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Lesson & Difficulty */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Mức độ</label>
                                    <select 
                                        value={formDiff}
                                        onChange={(e) => setFormDiff(e.target.value as Difficulty)}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm text-slate-800 outline-none focus:border-indigo-500"
                                    >
                                        <option value="NB">Nhận biết</option>
                                        <option value="TH">Thông hiểu</option>
                                        <option value="VD">Vận dụng</option>
                                        <option value="VDC">Vận dụng cao</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Bài học SGK</label>
                                    <input 
                                        type="text"
                                        placeholder="VD: Bài 1 - Hàm số"
                                        value={formLesson}
                                        onChange={(e) => setFormLesson(e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm text-slate-800 outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Content */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Nội dung câu hỏi (Hỗ trợ LaTeX)</label>
                                <textarea 
                                    rows={3}
                                    placeholder="Nhập đề bài..."
                                    value={formContent}
                                    onChange={(e) => setFormContent(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-indigo-500 resize-none font-medium"
                                ></textarea>
                                {formContent && (
                                    <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded text-sm text-slate-600">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Preview:</span>
                                        <MathText content={formContent} />
                                    </div>
                                )}
                            </div>

                            {/* Options */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block">Phương án</label>
                                {['A', 'B', 'C', 'D'].map((label, idx) => (
                                    <div key={label} className="flex gap-2 items-center">
                                        <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 ${formCorrect === label ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            {label}
                                        </span>
                                        <input 
                                            type="text"
                                            placeholder={`Đáp án ${label}`}
                                            value={formOptions[idx]}
                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-indigo-500"
                                        />
                                        <input 
                                            type="radio"
                                            name="correctOption"
                                            checked={formCorrect === label}
                                            onChange={() => setFormCorrect(label)}
                                            className="accent-indigo-600 w-4 h-4 cursor-pointer"
                                            title="Chọn làm đáp án đúng"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Explanation */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Lời giải chi tiết</label>
                                <textarea 
                                    rows={2}
                                    placeholder="Hướng dẫn giải..."
                                    value={formExplanation}
                                    onChange={(e) => setFormExplanation(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-indigo-500 resize-none"
                                ></textarea>
                            </div>

                            <button 
                                onClick={handleAddQuestion}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> Thêm vào Ngân hàng
                            </button>
                        </div>
                    </div>
                </div>

                {/* List View (Right/Bottom) */}
                <div className="lg:col-span-7 space-y-6">
                     <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                         <div>
                            <h3 className="font-bold text-slate-800 text-lg">Ngân hàng câu hỏi</h3>
                            <p className="text-slate-500 text-xs">Tổng số: <strong>{managedBank.length}</strong> câu</p>
                         </div>
                         <button 
                            onClick={handleExportBank}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
                         >
                             <Save size={16} /> Lưu file Ngân hàng (JSON)
                         </button>
                     </div>

                     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                         {managedBank.length === 0 ? (
                             <div className="p-12 text-center text-slate-400">
                                 <Database size={48} className="mx-auto mb-4 opacity-20" />
                                 <p>Ngân hàng chưa có câu hỏi nào.</p>
                             </div>
                         ) : (
                             <div className="divide-y divide-slate-100 max-h-[800px] overflow-y-auto">
                                 {managedBank.map((q, idx) => (
                                     <div key={q.id} className="p-4 hover:bg-slate-50 transition-colors group">
                                         <div className="flex justify-between items-start gap-4 mb-2">
                                             <div className="flex gap-2">
                                                 <span className="bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{idx + 1}</span>
                                                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                                     q.difficulty === 'NB' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                     q.difficulty === 'TH' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                                     q.difficulty === 'VD' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                                     'bg-red-50 text-red-700 border-red-200'
                                                 }`}>{q.difficulty}</span>
                                                 {q.lesson && (
                                                     <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-200 flex items-center gap-1">
                                                         <BookOpen size={10} /> {q.lesson}
                                                     </span>
                                                 )}
                                             </div>
                                             <button 
                                                onClick={() => handleDeleteQuestion(q.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                title="Xóa câu hỏi"
                                             >
                                                 <Trash2 size={16} />
                                             </button>
                                         </div>
                                         <div className="text-sm text-slate-800 font-medium mb-2 pl-8">
                                             <MathText content={q.content} />
                                         </div>
                                         <div className="pl-8 text-xs text-slate-500 grid grid-cols-2 gap-x-4 gap-y-1">
                                             {q.options?.map((opt, oIdx) => {
                                                  // Check if this option corresponds to correct answer
                                                  const label = String.fromCharCode(65 + oIdx);
                                                  const isCorrect = q.correctAnswer === label;
                                                  return (
                                                    <span key={oIdx} className={`${isCorrect ? 'text-emerald-600 font-bold' : ''}`}>
                                                        {opt} {isCorrect && <Check size={12} className="inline ml-1"/>}
                                                    </span>
                                                  )
                                             })}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;