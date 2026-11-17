import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, SlidersHorizontal } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/common/StateViews';
import { ROUTES } from '@/src/config/navigation';
import { useAsyncData } from '@/src/hooks/useAsyncData';
import { useAuth } from '@/src/hooks/useAuth';
import { teacherService } from '@/src/services/teacherService';
import { LessonStatus } from '@/src/types';
import { getStageLabel, getSubjectLabel } from '@/src/utils/formatters';

export const RoadmapPage: React.FC = () => {
  const { profile } = useAuth();
  const fetcher = useCallback(() => teacherService.fetchRoadmapModules(), []);
  const { data, isLoading, error, reload } = useAsyncData(fetcher);
  const [statusFilter, setStatusFilter] = useState<'all' | LessonStatus>('all');

  const filteredModules = useMemo(() => {
    if (!data) return [];
    if (statusFilter === 'all') return data;
    return data.filter((mod) => mod.status === statusFilter);
  }, [data, statusFilter]);

  const statusText: Record<LessonStatus, string> = {
    completed: 'Đã hoàn thành',
    in_progress: 'Đang học',
    not_started: 'Chưa bắt đầu',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lộ trình của tôi"
        description={`Cá nhân hóa cho môn ${getSubjectLabel(
          profile.preferences.primarySubject
        )} · ${getStageLabel(profile.preferences.schoolStage)} · Mục tiêu ${
          profile.preferences.currentLevel
        } → ${profile.preferences.targetLevel}`}
        actions={
          <Link
            to={ROUTES.PREFERENCES}
            className="inline-flex items-center gap-2 min-h-10 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Điều chỉnh lộ trình</span>
          </Link>
        }
      />

      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit flex-wrap">
        {(
          [
            { id: 'all', label: 'Tất cả chặng' },
            { id: 'in_progress', label: 'Đang học' },
            { id: 'completed', label: 'Hoàn thành' },
            { id: 'not_started', label: 'Sắp tới' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filteredModules.length === 0 ? (
        <EmptyState
          title="Không có chặng học nào ở trạng thái này"
          description="Hãy chọn bộ lọc Tất cả chặng để xem toàn bộ lộ trình đào tạo của bạn."
          actionLabel="Xem tất cả chặng"
          onAction={() => setStatusFilter('all')}
        />
      ) : (
        <div className="space-y-4">
          {filteredModules.map((mod) => {
            const pct = Math.round((mod.completedLessons / mod.lessonCount) * 100);
            return (
              <div
                key={mod.id}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-semibold text-blue-700 tabular-nums">
                      Chặng 0{mod.order}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Trình độ {mod.cefrBand}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      {mod.estimatedHours} giờ học
                    </span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        mod.status === 'completed'
                          ? 'text-emerald-700 font-medium'
                          : 'text-slate-700 font-medium'
                      }
                    >
                      {statusText[mod.status]}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold text-slate-900">{mod.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">{mod.summary}</p>

                  <div className="pt-2 flex items-center gap-3">
                    <div className="w-44 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          mod.status === 'completed' ? 'bg-emerald-600' : 'bg-blue-700'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600 tabular-nums">
                      {mod.completedLessons}/{mod.lessonCount} bài học ({pct}%)
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <Link
                    to={ROUTES.ENGLISH_CLASSROOM}
                    className="inline-flex items-center gap-2 min-h-10 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    {mod.status === 'completed' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Ôn tập chặng</span>
                      </>
                    ) : (
                      <>
                        <span>Vào học ngay</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
