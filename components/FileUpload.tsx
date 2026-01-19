import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileJson, AlertCircle, Sparkles, BookOpen, Link as LinkIcon, Loader2 } from 'lucide-react';
import { normalizeQuestions } from '../utils';
import { Question } from '../types';

interface FileUploadProps {
  onDataLoaded: (questions: Question[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processContent = (content: string) => {
      try {
        const json = JSON.parse(content);
        const questions = normalizeQuestions(json);
        
        if (questions.length === 0) {
            throw new Error('Không tìm thấy câu hỏi nào trong file (kiểm tra cấu trúc JSON).');
        }
        onDataLoaded(questions);
      } catch (err: any) {
        if (content.trim().toLowerCase().startsWith('<!doctype html') || content.trim().toLowerCase().startsWith('<html')) {
             setError('Link trả về trang HTML thay vì JSON. Vui lòng đảm bảo Link Google Drive ở chế độ "Bất kỳ ai có đường liên kết" (Public) hoặc sử dụng link tải trực tiếp.');
        } else {
             setError(`Lỗi đọc dữ liệu: ${err.message}`);
        }
      }
  };

  const processFile = (file: File) => {
    setError(null);
    const isValid = file.type === 'application/json' || 
                    file.type === 'text/plain' ||
                    file.name.endsWith('.json') || 
                    file.name.endsWith('.txt');

    if (!isValid) {
      setError('Vui lòng tải lên file định dạng .json hoặc .txt');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
          processContent(e.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleUrlImport = async () => {
      if (!url.trim()) return;
      setError(null);
      setIsLoading(true);

      let fetchUrl = url.trim();
      
      // Auto-convert Google Drive View Links to Download Links
      // Regex matches /file/d/ID/ or id=ID
      const gDriveIdRegex = /\/d\/([-_\w]+)|\?id=([-_\w]+)/;
      const match = fetchUrl.match(gDriveIdRegex);
      const id = match ? (match[1] || match[2]) : null;

      if (id && fetchUrl.includes('google.com')) {
          // Construct direct download URL
          // Note: This relies on Google Drive allowing CORS for this specific endpoint or the browser handling the redirect transparently.
          // Often this fails in strict CORS environments without a proxy, but we attempt it.
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
              msg = 'Lỗi CORS hoặc Mạng. Google Drive có thể chặn tải trực tiếp từ trình duyệt. Hãy thử tải file về máy rồi upload lên đây.';
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
            relative group border-4 border-dashed rounded-[2.5rem] p-10 md:p-12 transition-all duration-300 ease-out cursor-pointer bg-white
            ${isDragging 
                ? 'border-indigo-500 bg-indigo-50/30 scale-[1.02] shadow-xl' 
                : 'border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1'}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json,.txt,text/plain"
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
                    Chọn file đề thi (.json)
                </h3>
                <p className="text-lg text-slate-400 font-medium">
                    Kéo thả hoặc chạm để tải lên
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
                        placeholder="Link Google Drive / JSON..." 
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
                    <FileJson size={18} /> Định dạng JSON
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <BookOpen size={18} /> Ma trận chuẩn
                </div>
            </div>
            <div className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                Phiên bản v1.3.0
            </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;