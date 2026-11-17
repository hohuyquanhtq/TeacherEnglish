import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { ROUTES } from '@/src/config/navigation';
import { useAuth } from '@/src/hooks/authContext';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, accountStatus } = useAuth();
  const isApproved = isAuthenticated && accountStatus === 'approved';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between">
        <Link
          to={isApproved ? ROUTES.DASHBOARD : ROUTES.LOGIN}
          className="flex items-center gap-2.5 text-slate-900"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-bold text-base tracking-tight whitespace-nowrap">
            Teacher English
          </span>
        </Link>

        {isApproved ? (
          <Link
            to={ROUTES.DASHBOARD}
            className="inline-flex items-center gap-2 min-h-10 px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang Tổng quan</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center min-h-10 px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              Đăng nhập
            </Link>
            <Link
              to={ROUTES.REGISTER}
              className="inline-flex items-center min-h-10 px-3.5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
