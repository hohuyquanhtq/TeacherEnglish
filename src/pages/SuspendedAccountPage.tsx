import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, LogOut } from 'lucide-react';
import { ROUTES } from '@/src/config/navigation';
import { useAuth } from '@/src/hooks/authContext';

export const SuspendedAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, accountStatus, logout } = useAuth();

  if (accountStatus === 'approved') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  if (accountStatus === 'pending') {
    return <Navigate to={ROUTES.PENDING_APPROVAL} replace />;
  }
  if (accountStatus === 'rejected') {
    return <Navigate to={ROUTES.REJECTED} replace />;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tài khoản hiện đang tạm khóa</h1>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            Quyền truy cập của tài khoản <span className="font-medium text-slate-900">{profile.email}</span> đã bị Quản trị viên tạm khóa.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
        <p className="font-semibold text-slate-900">Thông tin tạm khóa</p>
        <p className="text-slate-700 leading-relaxed">
          {profile.suspendedReason || 'Tài khoản đang bị tạm khóa theo chính sách quản trị hệ thống.'}
        </p>
        {profile.suspendedAt ? (
          <p className="text-xs text-slate-500 pt-1 tabular-nums">
            Thời điểm khóa: {new Date(profile.suspendedAt).toLocaleString('vi-VN')}
          </p>
        ) : null}
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">
        Vui lòng liên hệ Quản trị viên hệ thống Teacher English để được xem xét mở khóa và khôi phục quyền sử dụng.
      </p>

      <button
        type="button"
        onClick={async () => {
          await logout();
          navigate(ROUTES.LOGIN, { replace: true });
        }}
        className="w-full min-h-11 px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Đăng xuất khỏi phiên hiện tại</span>
      </button>
    </div>
  );
};
