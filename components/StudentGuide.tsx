import React from 'react';
import { ArrowLeft, Upload, Settings, Play, BookOpen, CheckCircle, HelpCircle, FileJson, Link as LinkIcon, User } from 'lucide-react';

interface StudentGuideProps {
  onBack: () => void;
}

const StudentGuide: React.FC<StudentGuideProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans animate-fade-in pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="text-indigo-600" /> Hướng dẫn sử dụng
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-12">
        
        {/* Intro */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black text-slate-800">Chào mừng đến với MathPro</h2>
          <p className="text-lg text-slate-600">
            Ứng dụng ôn luyện Toán THPT trực tuyến giúp bạn làm quen với cấu trúc đề thi, 
            quản lý thời gian và xem lại lời giải chi tiết.
          </p>
        </div>

        {/* Step 1: Login */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 bg-indigo-600 text-white font-bold text-xs px-3 py-1 rounded-br-xl">Bước 1</div>
           <div className="flex flex-col md:flex-row gap-6 items-start mt-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                  <User size={24} />
              </div>
              <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-800">Đăng nhập hệ thống</h3>
                  <p className="text-slate-600">
                      Nhập <strong>Họ tên</strong> và <strong>Lớp</strong> của bạn để hệ thống ghi nhận kết quả.
                      Thông tin này giúp giáo viên theo dõi tiến độ học tập của bạn.
                  </p>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-500 italic">
                      * Lưu ý: Không cần mật khẩu, chỉ cần nhập đúng thông tin định danh.
                  </div>
              </div>
           </div>
        </div>

        {/* Step 2: Import Data */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 bg-indigo-600 text-white font-bold text-xs px-3 py-1 rounded-br-xl">Bước 2</div>
           <div className="flex flex-col md:flex-row gap-6 items-start mt-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                  <Upload size={24} />
              </div>
              <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-800">Tải đề thi</h3>
                  <p className="text-slate-600">
                      Bạn cần có dữ liệu câu hỏi để bắt đầu. MathPro hỗ trợ 2 cách:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                          <div className="flex items-center gap-2 font-bold text-slate-700 mb-2">
                              <FileJson size={16} /> File JSON/TXT
                          </div>
                          <p className="text-sm text-slate-500">
                              Kéo thả hoặc chọn file đề thi (đuôi <code>.json</code>) từ máy tính của bạn.
                          </p>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                          <div className="flex items-center gap-2 font-bold text-slate-700 mb-2">
                              <LinkIcon size={16} /> Link Google Drive
                          </div>
                          <p className="text-sm text-slate-500">
                              Dán đường link Google Drive chứa file đề thi (Cần để chế độ chia sẻ <strong>Công khai/Bất kỳ ai</strong>).
                          </p>
                      </div>
                  </div>
              </div>
           </div>
        </div>

        {/* Step 3: Config */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 bg-indigo-600 text-white font-bold text-xs px-3 py-1 rounded-br-xl">Bước 3</div>
           <div className="flex flex-col md:flex-row gap-6 items-start mt-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 shrink-0">
                  <Settings size={24} />
              </div>
              <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-800">Thiết lập bài làm</h3>
                  <p className="text-slate-600">Chọn chế độ phù hợp với mục tiêu của bạn:</p>
                  
                  <ul className="space-y-3">
                      <li className="flex gap-3">
                          <div className="bg-rose-100 text-rose-600 px-2 py-1 rounded text-xs font-bold h-fit shrink-0">Thi thử</div>
                          <div className="text-sm text-slate-600">
                              Mô phỏng kỳ thi thật. Hệ thống tự động chọn câu hỏi theo <strong>Ma trận chuẩn</strong> (NB-TH-VD-VDC) dựa trên thời gian bạn chọn (15p - 90p).
                          </div>
                      </li>
                      <li className="flex gap-3">
                          <div className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded text-xs font-bold h-fit shrink-0">Luyện tập</div>
                          <div className="text-sm text-slate-600">
                              Tùy chỉnh tự do. Bạn có thể chọn cụ thể mức độ (VD: Chỉ làm câu Vận dụng cao), loại câu hỏi và số lượng. <strong>Đáp án & Lời giải hiện ngay sau khi chọn.</strong>
                          </div>
                      </li>
                  </ul>
              </div>
           </div>
        </div>

        {/* Step 4: Doing Exam */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 bg-indigo-600 text-white font-bold text-xs px-3 py-1 rounded-br-xl">Bước 4</div>
           <div className="flex flex-col md:flex-row gap-6 items-start mt-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                  <Play size={24} />
              </div>
              <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-800">Làm bài</h3>
                  <ul className="space-y-2 text-slate-600 list-disc pl-5">
                      <li>Đồng hồ đếm ngược sẽ chạy (nếu là chế độ Thi thử).</li>
                      <li>Sử dụng menu bên trái để chuyển nhanh giữa các câu hỏi.</li>
                      <li>Có thể đánh dấu (<span className="inline-block align-middle"><HelpCircle size={14} /></span>) các câu chưa chắc chắn để xem lại sau.</li>
                      <li>Bấm <strong>Nộp bài</strong> khi hoàn thành. Hệ thống sẽ tự nộp khi hết giờ.</li>
                  </ul>
              </div>
           </div>
        </div>

        {/* Step 5: Result */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 bg-indigo-600 text-white font-bold text-xs px-3 py-1 rounded-br-xl">Bước 5</div>
           <div className="flex flex-col md:flex-row gap-6 items-start mt-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                  <CheckCircle size={24} />
              </div>
              <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-800">Xem kết quả & Lời giải</h3>
                  <p className="text-slate-600">
                      Sau khi nộp bài, bạn sẽ thấy điểm số và thống kê chi tiết.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <strong className="block text-indigo-700 text-sm mb-1">Tab Tổng quan</strong>
                          <span className="text-xs text-slate-500">Xem điểm số, số câu đúng/sai, thời gian làm bài.</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <strong className="block text-indigo-700 text-sm mb-1">Tab Xem lại đề</strong>
                          <span className="text-xs text-slate-500">Xem lại toàn bộ đề thi kèm đáp án đúng và <strong>lời giải chi tiết</strong> (nếu có).</span>
                      </div>
                  </div>
              </div>
           </div>
        </div>

        {/* Footer Action */}
        <div className="flex justify-center pt-8">
            <button 
                onClick={onBack}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-indigo-200 transition-all hover:-translate-y-1 flex items-center gap-2"
            >
                Đã hiểu, quay lại <ArrowLeft size={20} />
            </button>
        </div>

      </div>
    </div>
  );
};

export default StudentGuide;