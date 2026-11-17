import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/src/config/navigation';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-lg mx-auto my-8">
      <p className="text-sm font-semibold text-blue-700 tabular-nums">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Không tìm thấy trang</h1>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
        Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi trong hệ thống Teacher English.
      </p>
      <Link
        to={ROUTES.DASHBOARD}
        className="mt-6 inline-flex items-center gap-2 min-h-10 px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay về Tổng quan</span>
      </Link>
    </div>
  );
};
