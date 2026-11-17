import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, XCircle } from 'lucide-react';
import { ROUTES } from '@/src/config/navigation';
import { useAuth } from '@/src/hooks/authContext';

export const RejectedAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, accountStatus, refreshProfile, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  if (accountStatus === 'approved') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  if (accountStatus === 'pending') {
    return <Navigate to={ROUTES.PENDING_APPROVAL} replace />;
  }
  if (accountStatus === 'suspended') {
    return <Navigate to={ROUTES.SUSPENDED} replace />;
  }

  return (
    <div className="bg-white border border-red-200 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0">
          <XCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Yêu cầu đăng ký chưa được phê duyệt</h1>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            Hồ sơ đăng ký giáo viên của bạn hiện đã bị từ chối bởi Quản trị viên hệ thống.
          </p>
        </div>
      </div>

      <div className="bg-red-50/60 border border-red-200 rounded-xl p-4 space-y-2 text-sm">
        <p className="font-semibold text-red-950">Lý do từ chối</p>
        <p className="text-red-900 leading-relaxed">
          {profile.rejectionReason || 'Thông tin xác minh giáo viên chưa đáp ứng yêu cầu hệ thống.'}
        </p>
        {profile.rejectedAt ? (
          <p className="text-xs text-red-700 pt-1 tabular-nums">
            Thời điểm xử lý: {new Date(profile.rejectedAt).toLocaleString('vi-VN')}
          </p>
        ) : null}
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">
        Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ Quản trị viên nhà trường hoặc ban điều hành Teacher English để kiểm tra lại hồ sơ ({profile.email}).
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          disabled={checking}
          onClick={async () => {
            setChecking(true);
            try {
              const result = await refreshProfile(true);
              if (result?.status === 'approved') {
                navigate(ROUTES.DASHBOARD, { replace: true });
              }
            } finally {
              setChecking(false);
            }
          }}
          className="flex-1 min-h-11 px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          <span>Kiểm tra lại trạng thái</span>
        </button>

        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate(ROUTES.LOGIN, { replace: true });
          }}
          className="min-h-11 px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};
