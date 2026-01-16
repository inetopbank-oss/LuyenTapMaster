import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileJson, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { normalizeQuestions } from '../utils';
import { Question } from '../types';

interface FileUploadProps {
  onDataLoaded: (questions: Question[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError('Vui lòng tải lên file định dạng .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);
        
        const questions = normalizeQuestions(json);
        
        if (questions.length === 0) {
            throw new Error('Không tìm thấy câu hỏi nào trong file (kiểm tra cấu trúc JSON).');
        }
        onDataLoaded(questions);
      } catch (err: any) {
        setError(`Lỗi đọc file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    // Reset input value to allow uploading the same file again if needed
    if (e.target) {
        e.target.value = '';
    }
  };

  const handleZoneClick = () => {
      fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 font-sans selection:bg-indigo-100">
      <div className="max-w-3xl w-full text-center space-y-8 animate-fade-in">
        
        {/* Hero Section */}
        <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm text-indigo-600 font-bold text-sm uppercase tracking-wide animate-slide-up">
                <Sparkles size={16} />
                <span>MathPro Student Practice</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight">
                Ôn luyện <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Toán THPT</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                Nền tảng thi thử trực tuyến tối giản & hiệu quả.
            </p>
        </div>

        {/* Upload Zone */}
        <div
          onClick={handleZoneClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative group border-4 border-dashed rounded-[2.5rem] p-12 md:p-16 transition-all duration-300 ease-out cursor-pointer bg-white
            ${isDragging 
                ? 'border-indigo-500 bg-indigo-50/30 scale-[1.02] shadow-xl' 
                : 'border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1'}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleInputChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-6 pointer-events-none">
            <div className={`
                w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-sm
                ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}
            `}>
                <Upload strokeWidth={1.5} className="w-10 h-10 md:w-12 md:h-12" />
            </div>

            <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-bold text-slate-800">
                    Chọn file đề thi (.json)
                </h3>
                <p className="text-lg text-slate-400 font-medium">
                    Kéo thả hoặc chạm để tải lên
                </p>
            </div>
            
            {/* Visual Button for Mobile Affordance */}
            <div className="mt-2 md:hidden">
                <span className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200">
                    Duyệt file
                </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 text-red-600 bg-red-50 px-6 py-4 rounded-2xl border border-red-100 text-lg font-semibold animate-slide-up mx-auto max-w-lg shadow-sm">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer Note */}
        <div className="pt-8 flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex justify-center gap-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <FileJson size={18} /> Định dạng JSON
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <BookOpen size={18} /> Ma trận chuẩn
                </div>
            </div>
            <div className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                Phiên bản v1.2.0
            </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;