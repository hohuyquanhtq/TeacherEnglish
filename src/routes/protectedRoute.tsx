import React from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { ROUTES } from '@/src/config/navigation';
import { useAuth } from '@/src/hooks/authContext';
import { SystemRole, formatSystemRoleLabel } from '@/src/types';

interface ProtectedRouteProps {
  allowedRoles?: SystemRole[];
  allowPendingOrBlockedStatus?: boolean;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  allowPendingOrBlockedStatus = false,
  children,
}) => {
  const location = useLocation();
  const { isAuthReady, isAuthenticated, role, accountStatus } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl px-6 py-5 text-center space-y-2 max-w-sm w-full">
          <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-800">
            Đang kiểm tra phiên đăng nhập và quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (!allowPendingOrBlockedStatus) {
    if (accountStatus === 'pending') {
      return <Navigate to={ROUTES.PENDING_APPROVAL} replace />;
    }
    if (accountStatus === 'rejected') {
      return <Navigate to={ROUTES.REJECTED} replace />;
    }
    if (accountStatus === 'suspended') {
      return <Navigate to={ROUTES.SUSPENDED} replace />;
    }
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const fallbackRoute = role === 'editor' ? ROUTES.EDITOR : ROUTES.DASHBOARD;
    return (
      <div className="bg-white border border-red-200 rounded-xl p-8 max-w-lg mx-auto my-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Không có quyền truy cập (403)</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Tài khoản của bạn hiện có quyền{' '}
          <span className="font-semibold text-slate-900">{formatSystemRoleLabel(role)}</span>.
          Chức năng này chỉ dành cho vai trò:{' '}
          <span className="font-semibold text-slate-900">
            {allowedRoles.map(formatSystemRoleLabel).join(', ')}
          </span>
          .
        </p>
        <div className="pt-2">
          <Link
            to={fallbackRoute}
            className="inline-flex items-center gap-2 min-h-10 px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang làm việc</span>
          </Link>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
