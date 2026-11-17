import React, { useCallback, useMemo, useState } from 'react';
import { BookOpen, Search, Trash2 } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/common/StateViews';
import { useAsyncData } from '@/src/hooks/useAsyncData';
import { teacherService } from '@/src/services/teacherService';

export const LibraryPage: React.FC = () => {
  const fetcher = useCallback(() => teacherService.fetchLibraryResources(), []);
  const { data, setData, isLoading, error, reload } = useAsyncData(fetcher);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subjectName.toLowerCase().includes(q) ||
        item.resourceType.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const handleRemove = (id: string) => {
    if (!data) return;
    setData(data.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thư viện của tôi"
        description="Lưu trữ giáo án song ngữ, bộ thẻ từ vựng và danh sách mẫu câu thường dùng khi giảng dạy."
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tài liệu đã lưu..."
              className="w-full min-h-10 pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>
        }
      />

      {isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'Không tìm thấy tài liệu phù hợp' : 'Thư viện của bạn đang trống'}
          description={
            searchQuery
              ? 'Thử nhập từ khóa khác hoặc xóa bộ lọc tìm kiếm.'
              : 'Bạn có thể khôi phục tài liệu mẫu hoặc lưu từ mục English Classroom và Bài học song ngữ.'
          }
          actionLabel={searchQuery ? 'Xóa tìm kiếm' : 'Khôi phục tài liệu mẫu'}
          onAction={() => {
            if (searchQuery) {
              setSearchQuery('');
            } else {
              void reload();
            }
          }}
        />
      ) : (
        <div className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-medium text-blue-700">{item.resourceType}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.subjectName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{item.sizeOrLength}</span>
                    <span aria-hidden="true">·</span>
                    <span>Lưu {item.savedAt}</span>
                  </div>
                  <h2 className="mt-1 text-base font-semibold text-slate-900">{item.title}</h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                aria-label={`Bỏ lưu ${item.title}`}
                className="min-h-10 px-3.5 py-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                <Trash2 className="w-4 h-4" />
                <span>Bỏ lưu</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
