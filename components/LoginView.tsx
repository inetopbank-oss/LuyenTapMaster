import React, { useState } from 'react';
import { User, School, Sparkles, ArrowRight } from 'lucide-react';
import { UserInfo } from '../types';

interface LoginViewProps {
  onLogin: (info: UserInfo) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập họ và tên');
      return;
    }
    if (!className.trim()) {
      setError('Vui lòng nhập lớp học');
      return;
    }
    setError(null);
    onLogin({ name: name.trim(), class: className.trim() });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 font-sans selection:bg-indigo-100">
      <div className="max-w-md w-full animate-fade-in">
        
        {/* Header Branding */}
        <div className="text-center space-y-4 mb-10">
           <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm text-indigo-600 font-bold text-sm uppercase tracking-wide animate-slide-up">
                <Sparkles size={16} />
                <span>MathPro Student Practice</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Chào mừng bạn!</h1>
            <p className="text-slate-500 font-medium">Nhập thông tin để bắt đầu ôn luyện.</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Name Input */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Họ và Tên</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                            <User size={20} />
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ví dụ: Nguyễn Văn A"
                            className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all font-medium"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Class Input */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Lớp học</label>
                    <div className="relative group">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                            <School size={20} />
                        </div>
                        <input
                            type="text"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            placeholder="Ví dụ: 12A1"
                            className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all font-medium"
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg flex items-center gap-2 animate-fade-in">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
                >
                    <span>Tiếp tục</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </form>
        </div>
        
        <div className="mt-8 text-center">
            <p className="text-slate-300 text-xs font-bold tracking-widest uppercase opacity-80">
                Phiên bản v1.2.0
            </p>
        </div>

      </div>
    </div>
  );
};

export default LoginView;