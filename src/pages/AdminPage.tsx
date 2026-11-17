import React, { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, Search, ShieldCheck } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/common/StateViews';
import { auth } from '@/src/config/firebase';
import { useAsyncData } from '@/src/hooks/useAsyncData';
import { useAuth } from '@/src/hooks/authContext';
import { userService } from '@/src/services/userService';
import { FirestoreUserProfile, SystemRole } from '@/src/types';

export const AdminPage: React.FC = () => {
  const { role } = useAuth();
  const fetcher = useCallback(() => userService.listUsersForAdmin(), []);
  const { data, setData, isLoading, error, reload } = useAsyncData(fetcher);

  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const filteredMembers = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.schoolName || '').toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const handleRoleChange = async (member: FirestoreUserProfile, nextRole: SystemRole) => {
    setErrorMessage('');
    setStatusMessage('');
    setUpdatingUid(member.uid);
    try {
      const result = await userService.assignRoleViaBackend(member.uid, nextRole);
      if (data) {
        setData(
          data.map((item) =>
            item.uid === member.uid ? { ...item, role: nextRole } : item
          )
        );
      }
      setStatusMessage(result.message);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể cập nhật quyền người dùng.'
      );
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleBackendSecurityCheck = async () => {
    setErrorMessage('');
    setStatusMessage('');
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Không tìm thấy token đăng nhập.');
      const res = await fetch('/api/admin/check', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(json.error || 'Từ chối truy cập backend.');
      setStatusMessage(json.message || 'Kiểm tra quyền backend thành công.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi kiểm tra backend.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản trị & Phân quyền (RBAC)"
        description={`Quyền hiện tại của bạn: ${role}. Chỉ Admin mới có thể xem danh sách tài khoản và phân quyền Teacher / Editor / Admin thông qua backend.`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleBackendSecurityCheck}
              className="inline-flex items-center gap-2 min-h-10 px-3.5 py-2 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Kiểm tra quyền Backend</span>
            </button>

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="w-full min-h-10 pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        }
      />

      {statusMessage ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-sm text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800"
        >
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          title="Chưa tìm thấy tài khoản nào"
          description="Danh sách tài khoản Firestore hiện trống hoặc không khớp với từ khóa tìm kiếm."
          actionLabel="Tải lại danh sách"
          onAction={() => {
            setSearchQuery('');
            void reload();
          }}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-4">Giáo viên</th>
                  <th className="py-3.5 px-4">Trường / Đơn vị</th>
                  <th className="py-3.5 px-4">Trình độ</th>
                  <th className="py-3.5 px-4">Vai trò hiện tại</th>
                  <th className="py-3.5 px-4 text-right">Phân quyền (Backend)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredMembers.map((member) => (
                  <tr key={member.uid} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{member.fullName}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {member.schoolName || 'Chưa cập nhật'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {member.currentLevel} → {member.targetLevel}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {member.role}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        aria-label={`Đổi quyền cho ${member.fullName}`}
                        value={member.role}
                        disabled={updatingUid === member.uid}
                        onChange={(e) =>
                          void handleRoleChange(member, e.target.value as SystemRole)
                        }
                        className="min-h-9 px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 disabled:opacity-60"
                      >
                        <option value="Teacher">Teacher</option>
                        <option value="Editor">Editor</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
