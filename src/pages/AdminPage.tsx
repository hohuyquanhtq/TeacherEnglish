import React, { useCallback, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/common/StateViews';
import { useAsyncData } from '@/src/hooks/useAsyncData';
import { teacherService } from '@/src/services/teacherService';

export const AdminPage: React.FC = () => {
  const fetcher = useCallback(() => teacherService.fetchAdminMembers(), []);
  const { data, setData, isLoading, error, reload } = useAsyncData(fetcher);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const approveMember = (id: string) => {
    if (!data) return;
    setData(
      data.map((m) => (m.id === id ? { ...m, accountStatus: 'Đang hoạt động' } : m))
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản trị"
        description="Quản lý danh sách giáo viên tham gia bồi dưỡng, tổ chuyên môn và trạng thái phê duyệt tài khoản."
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm giáo viên hoặc tổ..."
              className="w-full min-h-10 pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>
        }
      />

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          title="Không tìm thấy giáo viên phù hợp"
          description="Không có tài khoản giáo viên nào khớp với từ khóa tìm kiếm."
          actionLabel="Hiển thị toàn bộ danh sách"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-4">Giáo viên</th>
                  <th className="py-3.5 px-4">Tổ chuyên môn</th>
                  <th className="py-3.5 px-4">Trình độ</th>
                  <th className="py-3.5 px-4 text-right">Tiến độ</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{member.fullName}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{member.department}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{member.level}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-800 tabular-nums">
                      {member.completionRate}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-semibold ${
                          member.accountStatus === 'Đang hoạt động'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {member.accountStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {member.accountStatus === 'Chờ duyệt' ? (
                        <button
                          type="button"
                          onClick={() => approveMember(member.id)}
                          className="inline-flex items-center gap-1.5 min-h-9 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Phê duyệt</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Đã kích hoạt</span>
                      )}
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
