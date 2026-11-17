import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  AccountStatus,
  AdminUserListItem,
  SystemRole,
  formatSystemRoleLabel,
} from '@/src/types';
import { getSubjectLabel } from '@/src/utils/formatters';

export function formatStatusText(status: AccountStatus): string {
  switch (status) {
    case 'approved':
      return 'Đã phê duyệt';
    case 'rejected':
      return 'Đã từ chối';
    case 'suspended':
      return 'Đang tạm khóa';
    default:
      return 'Chờ phê duyệt';
  }
}

export function formatDateTimeVi(iso?: string | null): string {
  if (!iso) return 'Chưa có';
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return 'Chưa có';
  return new Date(parsed).toLocaleString('vi-VN');
}

interface UserDetailModalProps {
  user: AdminUserListItem | null;
  onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-detail-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="user-detail-title" className="text-lg font-bold text-slate-900">
              Chi tiết tài khoản giáo viên
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">UID: {user.uid}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Họ và tên</p>
              <p className="font-semibold text-slate-900 mt-0.5">{user.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="font-medium text-slate-900 mt-0.5">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Trường công tác</p>
              <p className="font-medium text-slate-900 mt-0.5">{user.school || 'Chưa cập nhật'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Cấp dạy · Môn giảng dạy</p>
              <p className="font-medium text-slate-900 mt-0.5">
                {user.educationLevel} · {getSubjectLabel(user.subject)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Tỉnh / Thành phố</p>
              <p className="font-medium text-slate-900 mt-0.5">{user.province}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Số điện thoại</p>
              <p className="font-medium text-slate-900 mt-0.5 tabular-nums">
                {user.phone || 'Không cung cấp'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Vai trò hệ thống</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {formatSystemRoleLabel(user.role)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Trạng thái tài khoản</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {formatStatusText(user.status)}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-500">Ngày đăng ký</p>
              <p className="font-medium text-slate-800 mt-0.5 tabular-nums">
                {formatDateTimeVi(user.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Đăng nhập gần nhất</p>
              <p className="font-medium text-slate-800 mt-0.5 tabular-nums">
                {formatDateTimeVi(user.lastLoginAt)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Phê duyệt bởi / lúc</p>
              <p className="font-medium text-slate-800 mt-0.5 tabular-nums">
                {user.approvedBy ? `${user.approvedBy} · ${formatDateTimeVi(user.approvedAt)}` : 'Chưa phê duyệt'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Trình độ CEFR</p>
              <p className="font-medium text-slate-800 mt-0.5">
                {user.currentLevel} → {user.targetLevel}
              </p>
            </div>
          </div>

          {user.rejectionReason ? (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs space-y-1">
              <p className="font-semibold text-red-900">Lý do từ chối</p>
              <p className="text-red-800">{user.rejectionReason}</p>
            </div>
          ) : null}

          {user.suspendedReason ? (
            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 text-xs space-y-1">
              <p className="font-semibold text-slate-900">Lý do tạm khóa</p>
              <p className="text-slate-700">{user.suspendedReason}</p>
            </div>
          ) : null}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export interface PendingConfirmAction {
  type: 'approve' | 'reject' | 'suspend' | 'unlock' | 'set_role';
  user: AdminUserListItem;
  nextRole?: SystemRole;
}

interface ConfirmActionModalProps {
  action: PendingConfirmAction | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  action,
  isSubmitting,
  onCancel,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState('');

  if (!action) return null;

  const requiresReason = action.type === 'reject' || action.type === 'suspend';

  const getTitle = () => {
    switch (action.type) {
      case 'approve':
        return 'Xác nhận phê duyệt tài khoản giáo viên';
      case 'reject':
        return 'Xác nhận từ chối tài khoản giáo viên';
      case 'suspend':
        return 'Xác nhận tạm khóa tài khoản';
      case 'unlock':
        return 'Xác nhận mở khóa tài khoản';
      case 'set_role':
        return 'Xác nhận thay đổi vai trò hệ thống';
    }
  };

  const getDescription = () => {
    const label = `${action.user.fullName} (${action.user.email})`;
    switch (action.type) {
      case 'approve':
        return `Tài khoản ${label} sẽ được chuyển sang trạng thái Đã phê duyệt và cấp Custom Claims (approved: true) để truy cập học liệu.`;
      case 'reject':
        return `Tài khoản ${label} sẽ bị từ chối truy cập. Hồ sơ vẫn được lưu lại lịch sử trong hệ thống.`;
      case 'suspend':
        return `Tài khoản ${label} sẽ bị vô hiệu hóa đăng nhập trên Firebase Auth và thu hồi ngay phiên hiện tại.`;
      case 'unlock':
        return `Tài khoản ${label} sẽ được kích hoạt lại và khôi phục vai trò trước khi bị khóa (${formatSystemRoleLabel(action.user.previousRole || action.user.role)}).`;
      case 'set_role':
        return `Thay đổi quyền của ${label} từ ${formatSystemRoleLabel(action.user.role)} sang ${formatSystemRoleLabel(action.nextRole || 'teacher')}.`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (action.type === 'reject' && reason.trim().length < 3) {
      setValidationError('Vui lòng nhập lý do từ chối (tối thiểu 3 ký tự).');
      return;
    }
    if (action.type === 'suspend' && reason.trim().length < 3) {
      setValidationError('Vui lòng nhập lý do tạm khóa (tối thiểu 3 ký tự).');
      return;
    }
    setValidationError('');
    onConfirm(reason.trim());
    setReason('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-action-title"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4"
      >
        <div className="space-y-1.5">
          <h2 id="confirm-action-title" className="text-lg font-bold text-slate-900">
            {getTitle()}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">{getDescription()}</p>
        </div>

        {action.type !== 'approve' ? (
          <div>
            <label
              htmlFor="admin-action-reason"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              {requiresReason ? 'Lý do bắt buộc *' : 'Ghi chú quản trị (tùy chọn)'}
            </label>
            <textarea
              id="admin-action-reason"
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                action.type === 'reject'
                  ? 'Ví dụ: Thông tin trường công tác chưa xác thực được...'
                  : 'Nhập ghi chú để lưu vào nhật ký quản trị...'
              }
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              required={requiresReason}
            />
          </div>
        ) : null}

        {validationError ? (
          <p className="text-xs font-medium text-red-600">{validationError}</p>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setReason('');
              setValidationError('');
              onCancel();
            }}
            className="min-h-10 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`min-h-10 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-60 ${
              action.type === 'reject' || action.type === 'suspend'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </form>
    </div>
  );
};
