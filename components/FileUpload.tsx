import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileJson, AlertCircle, Sparkles, BookOpen, Link as LinkIcon, Loader2, HelpCircle, FileText } from 'lucide-react';
import { normalizeQuestions, parseMarkdownToQuestions, cleanJsonString } from '../utils';
import { Question } from '../types';

interface FileUploadProps {
  onDataLoaded: (questions: Question[]) => void;
  onGuide: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onGuide }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processContent = (rawContent: string, fileName?: string) => {
      try {
        // Pre-clean the content
        const content = cleanJsonString(rawContent);

        // 1. Try JSON First
        try {
            const json = JSON.parse(content);
            const questions = normalizeQuestions(json);
            if (questions.length === 0) {
                 // If valid JSON but logic found 0 questions, throw to fallback to MD
                 throw new Error('Valid JSON but no questions found via normalize');
            }
            onDataLoaded(questions);
            return; // Success with JSON
        } catch (jsonErr) {
            // Check if HTML (often happens with bad links)
            if (content.trim().toLowerCase().startsWith('<!doctype html') || content.trim().toLowerCase().startsWith('<html')) {
                 throw new Error('Link trả về trang HTML thay vì dữ liệu. Vui lòng kiểm tra quyền truy cập link.');
            }
            
            // 2. Try Markdown/Text Parsing
            // We proceed if the file extension suggests MD/TXT or if JSON parse failed
            const questions = parseMarkdownToQuestions(content);
            if (questions.length > 0) {
                 onDataLoaded(questions);
                 return; // Success with Markdown
            } else {
                 throw new Error('Không nhận diện được dữ liệu. Hãy đảm bảo file đúng định dạng JSON hoặc Markdown (Câu 1: ...).');
            }
        }
      } catch (err: any) {
         setError(`Lỗi đọc dữ liệu: ${err.message}`);
      }
  };

  const processFile = (file: File) => {
    setError(null);
    
    // Relaxed Validation: Allow more types, we will trust the content parsing more
    const isLikelyValid = file.type === 'application/json' || 
                    file.type === 'text/plain' ||
                    file.type === 'text/markdown' ||
                    file.name.match(/\.(json|txt|md|js|ts)$/i);

    // If strictly image or binary, reject
    if (file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        setError('Không hỗ trợ file hình ảnh/âm thanh. Vui lòng tải file văn bản (JSON, MD, TXT).');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
          processContent(e.target.result as string, file.name);
      }
    };
    reader.onerror = () => {
        setError("Không thể đọc file.");
    }
    reader.readAsText(file);
  };

  const handleUrlImport = async () => {
      if (!url.trim()) return;
      setError(null);
      setIsLoading(true);

      let fetchUrl = url.trim();
      
      // Logic xử lý link Google Drive: Chuyển từ View Link sang Direct Download Link
      // Regex bắt ID: /d/ID/ hoặc id=ID
      const gDriveIdRegex = /\/d\/([-_\w]+)|\?id=([-_\w]+)/;
      const match = fetchUrl.match(gDriveIdRegex);
      const id = match ? (match[1] || match[2]) : null;

      if (id && fetchUrl.includes('google.com')) {
          // Tạo link tải trực tiếp
          fetchUrl = `https://drive.google.com/uc?export=download&id=${id}`;
      }

      try {
          const response = await fetch(fetchUrl);
          if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
          }
          const text = await response.text();
          processContent(text);
      } catch (err: any) {
          let msg = err.message;
          if (msg.includes('Failed to fetch')) {
              msg = 'Lỗi kết nối (CORS). Google Drive chặn tải trực tiếp từ trình duyệt. Hãy thử tải file về máy rồi upload lên đây.';
          }
          setError(`Không thể tải từ Link: ${msg}`);
      } finally {
          setIsLoading(false);
      }
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
    if (e.target) {
        e.target.value = '';
    }
  };

  const handleZoneClick = () => {
      fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 font-sans selection:bg-indigo-100 relative">
      
      {/* Top Right Help Button */}
      <button 
          onClick={onGuide}
          className="absolute top-6 right-6 flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm bg-white p-2 px-4 rounded-full shadow-sm border border-slate-200 transition-all hover:border-indigo-200"
      >
          <HelpCircle size={18} /> Hướng dẫn
      </button>

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
            relative group border-4 border-dashed rounded-[2.5rem] p-10 md:p-12 transition-all duration-300 ease-out cursor-pointer bg-white
            ${isDragging 
                ? 'border-indigo-500 bg-indigo-50/30 scale-[1.02] shadow-xl' 
                : 'border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1'}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            // Accept almost anything text-based to let the parser decide
            accept=".json,application/json,.txt,text/plain,.md,text/markdown,.js,.ts"
            onChange={handleInputChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-6 pointer-events-none">
            <div className={`
                w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-sm
                ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}
            `}>
                <Upload strokeWidth={1.5} className="w-10 h-10" />
            </div>

            <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-bold text-slate-800">
                    Chọn file đề thi
                </h3>
                <p className="text-lg text-slate-400 font-medium">
                    Hỗ trợ JSON, Markdown hoặc Text (Copy từ ChatGPT)
                </p>
            </div>
            
            <div className="mt-2 md:hidden">
                <span className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200">
                    Duyệt file
                </span>
            </div>
          </div>
        </div>
        
        {/* URL Import Section */}
        <div className="space-y-4 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center w-full max-w-lg mx-auto gap-4">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Hoặc nhập Link</span>
                <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <div className="flex w-full max-w-lg mx-auto gap-2">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <LinkIcon size={18} />
                    </div>
                    <input 
                        type="text" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
                        placeholder="Dán Link Google Drive hoặc JSON..." 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm placeholder-slate-400 text-slate-700"
                    />
                </div>
                <button 
                    onClick={handleUrlImport}
                    disabled={isLoading || !url.trim()}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
                >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Nhập'}
                </button>
            </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 text-red-600 bg-red-50 px-6 py-4 rounded-2xl border border-red-100 text-sm font-semibold animate-slide-up mx-auto max-w-xl shadow-sm text-left">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer Note */}
        <div className="pt-8 flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex justify-center gap-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <FileJson size={18} /> JSON
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <FileText size={18} /> Markdown / TXT
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <BookOpen size={18} /> Ma trận chuẩn
                </div>
            </div>
            <div className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                Phiên bản v1.3.1
            </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;