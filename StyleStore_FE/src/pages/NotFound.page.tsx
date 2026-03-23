import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl animate-pulse" />
      </div>

      <div className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-8 md:p-10 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-white/20 border border-white/30 flex items-center justify-center animate-bounce">
          <span className="text-2xl">⚠️</span>
        </div>

        <p className="text-sm font-semibold tracking-wide text-cyan-200 uppercase">Page Not Found</p>
        <h1 className="mt-2 text-6xl md:text-7xl font-extrabold text-white leading-none">404</h1>
        <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-slate-100">Không tìm thấy trang</h2>

        <p className="mt-4 text-slate-200/90 max-w-xl mx-auto">
          Đường dẫn bạn truy cập không tồn tại, có thể đã bị đổi hoặc đã bị xóa.
        </p>

        <div className="mt-4 inline-flex max-w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2">
          <p className="text-xs text-slate-200 break-all">
            Path hiện tại: {location.pathname}
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="#"
            onClick={(event) => {
              event.preventDefault();
              navigate(-1);
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Quay lại
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-white/30 bg-white/10 text-slate-100 font-semibold hover:bg-white/20 transition"
          >
            Đăng nhập lại
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
