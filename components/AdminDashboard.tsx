import React, { useState, useEffect } from 'react';
import { Database, FileDown, LogOut, PieChart, AlertTriangle, Check, Layers, Settings, FileJson } from 'lucide-react';
import { Question, Difficulty } from '../types';
import { shuffleArray } from '../utils';

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
  const [examTitle, setExamTitle] = useState('Đề kiểm tra Toán 12');
  const [duration, setDuration] = useState(45);
  const [totalQuestions, setTotalQuestions] = useState(20);
  
  // Matrix state
  const [matrix, setMatrix] = useState<MatrixConfig>({ NB: 8, TH: 6, VD: 4, VDC: 2 });
  const [error, setError] = useState<string | null>(null);

  // Analyze Question Bank
  const stats = React.useMemo(() => {
    return {
      NB: questionBank.filter(q => q.difficulty === 'NB').length,
      TH: questionBank.filter(q => q.difficulty === 'TH').length,
      VD: questionBank.filter(q => q.difficulty === 'VD').length,
      VDC: questionBank.filter(q => q.difficulty === 'VDC').length,
      Total: questionBank.length
    };
  }, [questionBank]);

  // Auto-distribute when total changes (5-3-1-1 ratio approx)
  useEffect(() => {
    const nb = Math.round(totalQuestions * 0.4);
    const th = Math.round(totalQuestions * 0.3);
    const vd = Math.round(totalQuestions * 0.2);
    const vdc = totalQuestions - nb - th - vd;
    setMatrix({ NB: nb, TH: th, VD: vd, VDC: vdc });
  }, [totalQuestions]);

  const handleMatrixChange = (key: keyof MatrixConfig, val: number) => {
    const newVal = Math.max(0, val);
    const newMatrix = { ...matrix, [key]: newVal };
    setMatrix(newMatrix);
    
    // Update total automatically
    const newTotal = newMatrix.NB + newMatrix.TH + newMatrix.VD + newMatrix.VDC;
    setTotalQuestions(newTotal);
  };

  const handleExport = () => {
    setError(null);
    
    // 1. Validation
    if (matrix.NB > stats.NB) return setError(`Không đủ câu Nhận biết (Cần ${matrix.NB}, Có ${stats.NB})`);
    if (matrix.TH > stats.TH) return setError(`Không đủ câu Thông hiểu (Cần ${matrix.TH}, Có ${stats.TH})`);
    if (matrix.VD > stats.VD) return setError(`Không đủ câu Vận dụng (Cần ${matrix.VD}, Có ${stats.VD})`);
    if (matrix.VDC > stats.VDC) return setError(`Không đủ câu VD Cao (Cần ${matrix.VDC}, Có ${stats.VDC})`);

    // 2. Generation
    const nbList = shuffleArray(questionBank.filter(q => q.difficulty === 'NB')).slice(0, matrix.NB);
    const thList = shuffleArray(questionBank.filter(q => q.difficulty === 'TH')).slice(0, matrix.TH);
    const vdList = shuffleArray(questionBank.filter(q => q.difficulty === 'VD')).slice(0, matrix.VD);
    const vdcList = shuffleArray(questionBank.filter(q => q.difficulty === 'VDC')).slice(0, matrix.VDC);

    let finalQuestions = [...nbList, ...thList, ...vdList, ...vdcList];
    
    // Renumber IDs to avoid conflicts if needed, or keep original. Let's keep original content but ensure structure.
    
    const examData = {
      title: examTitle,
      duration: duration,
      createdAt: new Date().toISOString(),
      questionCount: finalQuestions.length,
      questions: finalQuestions
    };

    // 3. Download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(examData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${examTitle.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-500 p-2 rounded-lg">
                <Settings size={20} className="text-white" />
             </div>
             <div>
                <h1 className="font-bold text-lg leading-tight">Admin Dashboard</h1>
                <p className="text-slate-400 text-xs">Trình tạo đề thi từ ngân hàng câu hỏi</p>
             </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors border border-slate-700"
          >
            <LogOut size={16} /> Thoát
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Bank Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 uppercase tracking-wider text-sm">
                    <Database size={18} className="text-indigo-600" /> Thống kê Kho dữ liệu
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
                <h3 className="font-bold text-lg mb-2">Hướng dẫn</h3>
                <ul className="text-indigo-100 text-sm space-y-2 list-disc pl-4 relative z-10">
                    <li>Điều chỉnh ma trận đề thi ở bảng bên phải.</li>
                    <li>Hệ thống sẽ chọn ngẫu nhiên các câu hỏi từ kho theo số lượng bạn yêu cầu.</li>
                    <li>Tải xuống file JSON và gửi cho học sinh để làm bài.</li>
                </ul>
            </div>
          </div>

          {/* Right Column: Configuration */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Layers className="text-indigo-600" /> Thiết lập Đề thi mới
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
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian (phút)</label>
                            <input 
                                type="number" 
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                        {error && (
                            <div className="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 font-bold animate-fade-in">
                                <AlertTriangle size={20} /> {error}
                            </div>
                        )}
                        <button
                            onClick={handleExport}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-indigo-200 transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
                        >
                            <FileDown size={24} />
                            Xuất file đề thi JSON
                        </button>
                    </div>

                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;