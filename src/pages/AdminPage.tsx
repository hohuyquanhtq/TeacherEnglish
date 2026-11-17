import React, { useCallback, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Unlock,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import {
  ConfirmActionModal,
  PendingConfirmAction,
  UserDetailModal,
  formatDateTimeVi,
  formatStatusText,
} from '@/src/components/admin/AdminModals';
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
import {
  AccountStatus,
  AdminAuditLog,
  AdminDashboardStats,
  AdminUserListItem,
  AuditActionType,
  SystemRole,
  formatSystemRoleLabel,
} from '@/src/types';
import { getSubjectLabel } from '@/src/utils/formatters';

type AdminTab = 'overview' | 'pending' | 'users' | 'roles' | 'audit';

const PAGE_SIZE = 10;

function formatAuditActionLabel(action: AuditActionType | string): string {
  switch (action) {
    case 'approve_teacher':
      return 'Phê duyệt giáo viên';
    case 'reject_teacher':
      return 'Từ chối giáo viên';
    case 'suspend_user':
      return 'Khóa tài khoản';
    case 'unlock_user':
      return 'Mở khóa tài khoản';
    case 'set_role':
      return 'Thay đổi phân quyền';
    case 'bootstrap_admin':
      return 'Khởi tạo Admin đầu tiên';
    default:
      return action;
  }
}

export const AdminPage: React.FC = () => {
  const { role, session } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Shared UI feedback
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isMutating, setIsMutating] = useState(false);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingStatusFilter, setPendingStatusFilter] = useState<AccountStatus | 'all'>('pending');
  const [userStatusFilter, setUserStatusFilter] = useState<AccountStatus | 'all'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<SystemRole | 'all'>('all');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserListItem | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmAction | null>(null);

  const fetcher = useCallback(async () => {
    const [stats, users, logs] = await Promise.all([
      userService.fetchAdminDashboardStats(),
      userService.fetchAdminUsers(),
      userService.fetchAuditLogs(),
    ]);
    return { stats, users, logs };
  }, []);

  const { data, isLoading, error, reload } = useAsyncData(fetcher);

  const stats: AdminDashboardStats = data?.stats ?? {
    totalAccounts: 0,
    approvedTeachers: 0,
    pendingTeachers: 0,
    rejectedAccounts: 0,
    suspendedAccounts: 0,
    editorsCount: 0,
    adminsCount: 0,
  };

  const allUsers: AdminUserListItem[] = useMemo(() => data?.users ?? [], [data]);
  const allLogs: AdminAuditLog[] = useMemo(() => data?.logs ?? [], [data]);

  const filteredPendingUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (pendingStatusFilter !== 'all' && u.status !== pendingStatusFilter) return false;
      if (q) {
        const hay = `${u.fullName} ${u.email} ${u.school} ${u.province}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allUsers, pendingStatusFilter, searchQuery]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (userStatusFilter !== 'all' && u.status !== userStatusFilter) return false;
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
      if (q) {
        const hay = `${u.fullName} ${u.email} ${u.school} ${u.province}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allUsers, userStatusFilter, userRoleFilter, searchQuery]);

  const filteredLogs = useMemo(() => {
    if (auditActionFilter === 'all') return allLogs;
    return allLogs.filter((l) => l.action === auditActionFilter);
  }, [allLogs, auditActionFilter]);

  const activeList = activeTab === 'pending' ? filteredPendingUsers : filteredUsers;
  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedList = activeList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleBackendSecurityCheck = async () => {
    setErrorMessage('');
    setStatusMessage('');
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error('Không tìm thấy token đăng nhập.');
      const res = await fetch('/api/admin/check', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(json.error || 'Từ chối truy cập backend.');
      setStatusMessage(json.message || 'Xác thực Custom Claims Admin thành công.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi kiểm tra backend.');
    }
  };

  const handleConfirmAction = async (reason: string) => {
    if (!pendingConfirm) return;
    setIsMutating(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      let resultMessage = '';
      if (pendingConfirm.type === 'approve') {
        const res = await userService.approveTeacher(pendingConfirm.user.uid, 'teacher');
        resultMessage = res.message;
      } else if (pendingConfirm.type === 'reject') {
        const res = await userService.rejectTeacher(pendingConfirm.user.uid, reason);
        resultMessage = res.message;
      } else if (pendingConfirm.type === 'suspend') {
        const res = await userService.suspendUser(pendingConfirm.user.uid, reason);
        resultMessage = res.message;
      } else if (pendingConfirm.type === 'unlock') {
        const res = await userService.unlockUser(pendingConfirm.user.uid, reason);
        resultMessage = res.message;
      } else if (pendingConfirm.type === 'set_role' && pendingConfirm.nextRole) {
        const res = await userService.assignRoleViaBackend(
          pendingConfirm.user.uid,
          pendingConfirm.nextRole,
          reason
        );
        resultMessage = res.message;
      }

      setPendingConfirm(null);
      setStatusMessage(resultMessage);
      await reload();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể thực hiện thao tác quản trị.'
      );
      setPendingConfirm(null);
    } finally {
      setIsMutating(false);
    }
  };

  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setErrorMessage('');
    setStatusMessage('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản trị hệ thống & Phê duyệt giáo viên"
        description={`Vai trò hiện tại: ${formatSystemRoleLabel(role)} · Mọi thao tác phê duyệt, từ chối, khóa/mở khóa và phân quyền đều thực thi qua Firebase Admin SDK, đồng bộ Custom Claims và ghi nhật ký bất biến.`}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void handleBackendSecurityCheck()}
              className="inline-flex items-center gap-2 min-h-10 px-3.5 py-2 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Xác thực Admin Claims</span>
            </button>
            <button
              type="button"
              onClick={() => void reload()}
              className="inline-flex items-center gap-2 min-h-10 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới dữ liệu</span>
            </button>
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

      {/* Admin Workspace Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => switchTab('overview')}
          className={`min-h-10 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tổng quan quản trị
        </button>
        <button
          type="button"
          onClick={() => switchTab('pending')}
          className={`min-h-10 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap tabular-nums ${
            activeTab === 'pending'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Phê duyệt giáo viên ({stats.pendingTeachers})
        </button>
        <button
          type="button"
          onClick={() => switchTab('users')}
          className={`min-h-10 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap tabular-nums ${
            activeTab === 'users'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Quản lý người dùng ({stats.totalAccounts})
        </button>
        <button
          type="button"
          onClick={() => switchTab('roles')}
          className={`min-h-10 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'roles'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Phân quyền
        </button>
        <button
          type="button"
          onClick={() => switchTab('audit')}
          className={`min-h-10 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap tabular-nums ${
            activeTab === 'audit'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Nhật ký hoạt động ({allLogs.length})
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : activeTab === 'overview' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">Tổng số tài khoản</p>
              <p className="text-3xl font-bold text-slate-900 mt-2 tabular-nums">
                {stats.totalAccounts}
              </p>
              <p className="text-xs text-slate-500 mt-1">Dữ liệu thực từ Firestore</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">Giáo viên đã phê duyệt</p>
              <p className="text-3xl font-bold text-emerald-700 mt-2 tabular-nums">
                {stats.approvedTeachers}
              </p>
              <p className="text-xs text-slate-500 mt-1">Được phép truy cập học liệu</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">Giáo viên chờ phê duyệt</p>
              <p className="text-3xl font-bold text-amber-700 mt-2 tabular-nums">
                {stats.pendingTeachers}
              </p>
              <button
                type="button"
                onClick={() => switchTab('pending')}
                className="text-xs font-semibold text-blue-700 hover:underline mt-1"
              >
                Mở hàng chờ phê duyệt →
              </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">Bị từ chối / Đang khóa</p>
              <p className="text-3xl font-bold text-slate-900 mt-2 tabular-nums">
                {stats.rejectedAccounts} / {stats.suspendedAccounts}
              </p>
              <p className="text-xs text-slate-500 mt-1">Từ chối · Tạm khóa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">Biên tập viên (Editor)</p>
              <p className="text-2xl font-bold text-slate-900 mt-1.5 tabular-nums">
                {stats.editorsCount}
              </p>
              <p className="text-xs text-slate-500 mt-1">Quản lý học liệu chuẩn</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">Quản trị viên (Admin)</p>
              <p className="text-2xl font-bold text-slate-900 mt-1.5 tabular-nums">
                {stats.adminsCount}
              </p>
              <p className="text-xs text-slate-500 mt-1">Toàn quyền quản trị &amp; phân quyền</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">Nhật ký quản trị ghi nhận</p>
              <p className="text-2xl font-bold text-slate-900 mt-1.5 tabular-nums">
                {allLogs.length}
              </p>
              <button
                type="button"
                onClick={() => switchTab('audit')}
                className="text-xs font-semibold text-blue-700 hover:underline mt-1"
              >
                Xem lịch sử thao tác →
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'pending' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Lọc trạng thái phê duyệt"
                value={pendingStatusFilter}
                onChange={(e) => {
                  setPendingStatusFilter(e.target.value as AccountStatus | 'all');
                  setCurrentPage(1);
                }}
                className="min-h-10 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="pending">Chờ phê duyệt</option>
                <option value="rejected">Đã từ chối</option>
                <option value="approved">Đã phê duyệt</option>
                <option value="all">Tất cả trạng thái</option>
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm theo họ tên, email, trường..."
                className="w-full min-h-10 pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {pagedList.length === 0 ? (
            <EmptyState
              title="Danh sách trống"
              description={
                pendingStatusFilter === 'pending' && !searchQuery.trim()
                  ? 'Hiện không có tài khoản giáo viên nào đang chờ phê duyệt.'
                  : 'Không tìm thấy tài khoản nào khớp với bộ lọc hiện tại.'
              }
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Họ và tên</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Trường công tác</th>
                      <th className="py-3 px-4">Cấp dạy</th>
                      <th className="py-3 px-4">Môn giảng dạy</th>
                      <th className="py-3 px-4">Tỉnh/Thành phố</th>
                      <th className="py-3 px-4">Ngày đăng ký</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {pagedList.map((member) => (
                      <tr key={member.uid} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {member.fullName}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{member.email}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {member.school || 'Chưa cập nhật'}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{member.educationLevel}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {getSubjectLabel(member.subject)}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{member.province}</td>
                        <td className="py-3 px-4 text-xs text-slate-600 tabular-nums">
                          {formatDateTimeVi(member.createdAt)}
                          <div className="text-slate-500 mt-0.5">
                            {formatStatusText(member.status)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedUserDetail(member)}
                              className="min-h-9 px-2.5 py-1.5 inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Chi tiết</span>
                            </button>
                            {member.status === 'pending' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPendingConfirm({ type: 'approve', user: member })
                                  }
                                  className="min-h-9 px-3 py-1.5 inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg whitespace-nowrap"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Phê duyệt</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPendingConfirm({ type: 'reject', user: member })
                                  }
                                  className="min-h-9 px-3 py-1.5 inline-flex items-center gap-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg whitespace-nowrap"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Từ chối</span>
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'users' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                aria-label="Lọc theo vai trò"
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value as SystemRole | 'all');
                  setCurrentPage(1);
                }}
                className="min-h-10 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="teacher">Teacher</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>

              <select
                aria-label="Lọc theo trạng thái"
                value={userStatusFilter}
                onChange={(e) => {
                  setUserStatusFilter(e.target.value as AccountStatus | 'all');
                  setCurrentPage(1);
                }}
                className="min-h-10 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="approved">Đã phê duyệt</option>
                <option value="pending">Chờ phê duyệt</option>
                <option value="rejected">Đã từ chối</option>
                <option value="suspended">Đang tạm khóa</option>
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm kiếm tài khoản..."
                className="w-full min-h-10 pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {pagedList.length === 0 ? (
            <EmptyState
              title="Không có người dùng phù hợp"
              description="Thử thay đổi bộ lọc vai trò, trạng thái hoặc từ khóa tìm kiếm."
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Người dùng</th>
                      <th className="py-3 px-4">Đơn vị &amp; Môn</th>
                      <th className="py-3 px-4">Vai trò</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Đăng ký / Đăng nhập cuối</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {pagedList.map((member) => {
                      const isSelf = member.uid === session.userId;
                      return (
                        <tr key={member.uid} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900">{member.fullName}</p>
                            <p className="text-xs text-slate-500">{member.email}</p>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-700">
                            <p className="font-medium text-slate-800">{member.school || '—'}</p>
                            <p className="text-slate-500 mt-0.5">
                              {member.educationLevel} · {getSubjectLabel(member.subject)}
                            </p>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {formatSystemRoleLabel(member.role)}
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold">
                            <span
                              className={
                                member.status === 'approved'
                                  ? 'text-emerald-700'
                                  : member.status === 'pending'
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                              }
                            >
                              {formatStatusText(member.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 tabular-nums">
                            <p>ĐK: {formatDateTimeVi(member.createdAt)}</p>
                            <p className="text-slate-500 mt-0.5">
                              ĐN: {formatDateTimeVi(member.lastLoginAt)}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedUserDetail(member)}
                                className="min-h-9 px-2.5 py-1.5 inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Chi tiết</span>
                              </button>
                              {member.status === 'suspended' ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPendingConfirm({ type: 'unlock', user: member })
                                  }
                                  className="min-h-9 px-3 py-1.5 inline-flex items-center gap-1 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                  <span>Mở khóa</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isSelf}
                                  title={isSelf ? 'Không thể tự khóa tài khoản của chính mình' : undefined}
                                  onClick={() =>
                                    setPendingConfirm({ type: 'suspend', user: member })
                                  }
                                  className="min-h-9 px-3 py-1.5 inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 disabled:opacity-40 rounded-lg whitespace-nowrap"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Khóa</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'roles' ? (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <p>
              Việc thay đổi vai trò cập nhật đồng thời Firebase Custom Claims (<code className="font-mono text-xs">role</code>) qua Admin SDK và Firestore (<code className="font-mono text-xs">users/&#123;uid&#125;</code>). Hệ thống tự động ngăn hạ quyền tài khoản Admin hoạt động cuối cùng.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Tài khoản</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Vai trò hiện tại</th>
                    <th className="py-3 px-4 text-right">Cấp quyền mới</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {allUsers.map((member) => (
                    <tr key={member.uid} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{member.fullName}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-700">
                        {formatStatusText(member.status)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {formatSystemRoleLabel(member.role)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <select
                          aria-label={`Phân quyền cho ${member.fullName}`}
                          value={member.role}
                          onChange={(e) => {
                            const nextRole = e.target.value as SystemRole;
                            if (nextRole !== member.role) {
                              setPendingConfirm({
                                type: 'set_role',
                                user: member,
                                nextRole,
                              });
                            }
                          }}
                          className="min-h-9 px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                        >
                          <option value="teacher">Teacher</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <ClipboardList className="w-4 h-4 text-blue-700" />
              <span>Hiển thị tối đa 100 bản ghi gần nhất từ collection <code className="font-mono text-xs">adminAuditLogs</code>.</span>
            </div>

            <select
              aria-label="Lọc loại hành động nhật ký"
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              className="min-h-10 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            >
              <option value="all">Tất cả hành động</option>
              <option value="approve_teacher">Phê duyệt giáo viên</option>
              <option value="reject_teacher">Từ chối giáo viên</option>
              <option value="suspend_user">Khóa tài khoản</option>
              <option value="unlock_user">Mở khóa tài khoản</option>
              <option value="set_role">Thay đổi phân quyền</option>
              <option value="bootstrap_admin">Khởi tạo Admin đầu tiên</option>
            </select>
          </div>

          {filteredLogs.length === 0 ? (
            <EmptyState
              title="Chưa có nhật ký hoạt động quản trị"
              description="Các thao tác phê duyệt, từ chối, khóa/mở khóa và phân quyền sẽ được ghi nhận tự động tại đây."
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Thời gian</th>
                      <th className="py-3 px-4">Người thực hiện</th>
                      <th className="py-3 px-4">Hành động</th>
                      <th className="py-3 px-4">Tài khoản mục tiêu</th>
                      <th className="py-3 px-4">Thay đổi &amp; Lý do</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-slate-600 tabular-nums whitespace-nowrap">
                          {formatDateTimeVi(log.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">
                            {log.actorEmail || log.actorUid}
                          </p>
                          <p className="text-slate-500">{formatSystemRoleLabel(log.actorRole)}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {formatAuditActionLabel(log.action)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">
                            {log.targetName || log.targetEmail || log.targetUid}
                          </p>
                          <p className="text-slate-500 font-mono">{log.targetUid}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <p>
                            {JSON.stringify(log.oldValue)} → {JSON.stringify(log.newValue)}
                          </p>
                          {log.reason ? (
                            <p className="text-slate-500 mt-0.5">Lý do: {log.reason}</p>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination for Pending & Users tables */}
      {(activeTab === 'pending' || activeTab === 'users') && activeList.length > PAGE_SIZE ? (
        <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
          <span className="tabular-nums">
            Trang {safePage} / {totalPages} · Tổng {activeList.length} tài khoản
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="min-h-9 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="min-h-9 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      ) : null}

      <UserDetailModal
        user={selectedUserDetail}
        onClose={() => setSelectedUserDetail(null)}
      />

      <ConfirmActionModal
        action={pendingConfirm}
        isSubmitting={isMutating}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={(reason) => void handleConfirmAction(reason)}
      />
    </div>
  );
};
