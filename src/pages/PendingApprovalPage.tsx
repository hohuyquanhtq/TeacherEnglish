import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { ROUTES } from '@/src/config/navigation';
import { useAuth } from '@/src/hooks/authContext';
import { getSubjectLabel } from '@/src/utils/formatters';

export const PendingApprovalPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, accountStatus, refreshProfile, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState('');

  if (accountStatus === 'approved') {
    const dest =
      profile.systemRole === 'admin'
        ? ROUTES.ADMIN
        : profile.systemRole === 'editor'
        ? ROUTES.EDITOR
        : ROUTES.DASHBOARD;
    return <Navigate to={dest} replace />;
  }

  if (accountStatus === 'rejected') {
    return <Navigate to={ROUTES.REJECTED} replace />;
  }

  if (accountStatus === 'suspended') {
    return <Navigate to={ROUTES.SUSPENDED} replace />;
  }

  const handleRefreshStatus = async () => {
    setChecking(true);
    setNotice('');
    try {
      const result = await refreshProfile(true);
      if (result?.status === 'approved') {
        const dest =
          result.role === 'admin'
            ? ROUTES.ADMIN
            : result.role === 'editor'
            ? ROUTES.EDITOR
            : ROUTES.DASHBOARD;
        navigate(dest, { replace: true });
        return;
      }
      if (result?.status === 'rejected') {
        navigate(ROUTES.REJECTED, { replace: true });
        return;
      }
      if (result?.status === 'suspended') {
        navigate(ROUTES.SUSPENDED, { replace: true });
        return;
      }
      setNotice('Tài khoản vẫn đang chờ Quản trị viên phê duyệt. Vui lòng thử lại sau.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Tài khoản đang chờ Admin phê duyệt
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            Đăng ký thành công! Tài khoản của bạn đang chờ Admin phê duyệt. Vui lòng quay lại sau khi được xác nhận.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Họ và tên</span>
          <span className="font-semibold text-slate-900 text-right">{profile.fullName}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Email</span>
          <span className="font-medium text-slate-900 text-right">{profile.email}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Trường công tác</span>
          <span className="font-medium text-slate-900 text-right">
            {profile.school || profile.schoolName}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Cấp dạy · Môn</span>
          <span className="font-medium text-slate-900 text-right">
            {profile.educationLevel || 'THPT'} ·{' '}
            {getSubjectLabel(profile.subject || profile.preferences.primarySubject)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Tỉnh / Thành phố</span>
          <span className="font-medium text-slate-900 text-right">{profile.province}</span>
        </div>
        <div className="flex justify-between gap-4 pt-2 border-t border-slate-200">
          <span className="text-slate-500">Trạng thái hiện tại</span>
          <span className="font-semibold text-amber-700 text-right">Chờ Admin phê duyệt</span>
        </div>
      </div>

      {notice ? (
        <p className="text-sm text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-4 py-3">
          {notice}
        </p>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          disabled={checking}
          onClick={() => void handleRefreshStatus()}
          className="flex-1 min-h-11 px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          <span>{checking ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái phê duyệt'}</span>
        </button>

        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate(ROUTES.LOGIN, { replace: true });
          }}
          className="min-h-11 px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};
