import React, { useCallback, useState } from 'react';
import { Upload, FileJson, AlertCircle, Sparkles } from 'lucide-react';
import { normalizeQuestions } from '../utils';
import { Question } from '../types';

interface FileUploadProps {
  onDataLoaded: (questions: Question[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-6 lg:p-8 animate-fade-in bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-8 md:mb-14 space-y-3 md:space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-indigo-50 rounded-full text-indigo-700 font-bold text-xs md:text-sm mb-2 md:mb-4 animate-slide-up">
                <Sparkles size={16} />
                <span>MathPro Student Practice</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 mb-2 md:mb-4 tracking-tight pb-2">
                Ôn luyện Toán THPT
            </h1>
            <p className="text-slate-500 text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium max-w-2xl mx-auto leading-relaxed px-4">
                Nền tảng thi thử trực tuyến hiện đại, tối ưu cho mọi thiết bị.
            </p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative group border-2 md:border-4 border-dashed rounded-2xl md:rounded-[2rem] p-8 md:p-20 transition-all duration-300 ease-out flex flex-col items-center justify-center cursor-pointer bg-white/50 backdrop-blur-sm
            ${isDragging 
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02] shadow-2xl shadow-indigo-100' 
                : 'border-slate-300 hover:border-indigo-400 hover:bg-white hover:shadow-2xl hover:shadow-indigo-100/50 shadow-xl'}
          `}
        >
          <input
            type="file"
            accept=".json"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          
          <div className={`
            w-20 h-20 md:w-36 md:h-36 rounded-full flex items-center justify-center mb-6 md:mb-10 transition-transform duration-300
            ${isDragging ? 'bg-indigo-100 scale-110' : 'bg-indigo-50 group-hover:scale-110 group-hover:bg-indigo-100'}
          `}>
             {isDragging ? <Upload className="w-10 h-10 md:w-16 md:h-16 text-indigo-600" /> : <FileJson className="w-10 h-10 md:w-16 md:h-16 text-indigo-600" />}
          </div>

          <h3 className="text-xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 md:mb-4">
            Thả file đề thi vào đây
          </h3>
          <p className="text-slate-500 text-base md:text-xl lg:text-2xl font-medium">
            Hoặc nhấp để chọn file JSON từ thiết bị
          </p>
        </div>

        {error && (
          <div className="mt-6 md:mt-8 flex items-center justify-center gap-2 md:gap-3 text-red-600 bg-red-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-red-200 text-sm md:text-xl font-semibold shadow-sm animate-slide-up">
            <AlertCircle className="w-5 h-5 md:w-8 md:h-8" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;