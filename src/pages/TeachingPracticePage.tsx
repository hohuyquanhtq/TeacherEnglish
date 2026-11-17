import React, { useCallback, useState } from 'react';
import { CheckCircle2, Play } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/common/StateViews';
import { useAsyncData } from '@/src/hooks/useAsyncData';
import { teacherService } from '@/src/services/teacherService';

export const TeachingPracticePage: React.FC = () => {
  const fetcher = useCallback(() => teacherService.fetchTeachingScenarios(), []);
  const { data, setData, isLoading, error, reload } = useAsyncData(fetcher);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const toggleCompleted = (id: string) => {
    if (!data) return;
    setData(
      data.map((scen) => (scen.id === id ? { ...scen, completed: !scen.completed } : scen))
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thực hành giảng dạy"
        description="Mô phỏng tình huống đứng lớp thực tế để giáo viên rèn kỹ năng chuyển ngôn ngữ và xử lý tương tác học sinh."
      />

      {isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Chưa có kịch bản thực hành"
          description="Danh sách tình huống thực hành đang trống. Nhấn tải lại để cập nhật kịch bản mới."
          actionLabel="Tải lại kịch bản"
          onAction={reload}
        />
      ) : (
        <div className="space-y-4">
          {data.map((scen) => {
            const isExpanded = activeScenarioId === scen.id;
            return (
              <div
                key={scen.id}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                      <span className="font-medium text-blue-700">{scen.difficulty}</span>
                      <span aria-hidden="true">·</span>
                      <span>{scen.classroomSetting}</span>
                      <span aria-hidden="true">·</span>
                      <span className={scen.completed ? 'text-emerald-700 font-medium' : ''}>
                        {scen.completed ? 'Đã hoàn thành' : 'Chưa thực hành'}
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-lg font-semibold text-slate-900">{scen.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{scen.objective}</p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveScenarioId(isExpanded ? null : scen.id)}
                      className="min-h-10 px-4 py-2 inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap"
                    >
                      <Play className="w-4 h-4" />
                      <span>{isExpanded ? 'Thu gọn hướng dẫn' : 'Mở kịch bản'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCompleted(scen.id)}
                      className={`min-h-10 px-3.5 py-2 inline-flex items-center gap-1.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${
                        scen.completed
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{scen.completed ? 'Đã xong' : 'Đánh dấu xong'}</span>
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <p className="text-xs font-semibold text-slate-600">Các bước điều phối gợi ý:</p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-800">
                      {scen.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
