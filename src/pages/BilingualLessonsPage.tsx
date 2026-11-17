import React, { useCallback, useState } from 'react';
import { Clock, Languages } from 'lucide-react';
import { AppImage } from '@/src/components/common/AppImage';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/common/StateViews';
import { useAsyncData } from '@/src/hooks/useAsyncData';
import { teacherService } from '@/src/services/teacherService';

export const BilingualLessonsPage: React.FC = () => {
  const fetcher = useCallback(() => teacherService.fetchBilingualLessons(), []);
  const { data, isLoading, error, reload } = useAsyncData(fetcher);
  const [displayMode, setDisplayMode] = useState<'bilingual' | 'en' | 'vi'>('bilingual');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bài học song ngữ"
        description="Thiết kế bài giảng kết hợp Anh - Việt giúp giáo viên chuyển đổi ngôn ngữ mượt mà trên lớp."
        actions={
          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            {(
              [
                { id: 'bilingual', label: 'Song ngữ Anh - Việt' },
                { id: 'en', label: 'Chỉ tiếng Anh' },
                { id: 'vi', label: 'Chỉ tiếng Việt' },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setDisplayMode(mode.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  displayMode === mode.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <LoadingSkeleton rows={2} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Chưa có giáo án song ngữ"
          description="Cập nhật môn học phụ trách để tải về các kịch bản bài giảng song ngữ phù hợp."
          actionLabel="Tải lại danh sách"
          onAction={reload}
        />
      ) : (
        <div className="space-y-6">
          {data.map((lesson) => (
            <article
              key={lesson.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                <div className="lg:col-span-4">
                  <AppImage
                    src={lesson.coverUrl}
                    alt={lesson.title}
                    fallbackText={lesson.subjectName}
                    className="w-full h-52 lg:h-full object-cover"
                  />
                </div>

                <div className="lg:col-span-8 p-6 space-y-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                      <span className="font-semibold text-blue-700">{lesson.subjectName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{lesson.gradeLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>Trình độ {lesson.level}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Clock className="w-3.5 h-3.5" />
                        {lesson.durationMinutes} phút
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-xl font-semibold text-slate-900">{lesson.title}</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-200">
                    {displayMode !== 'vi' ? (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                          <Languages className="w-3.5 h-3.5 text-blue-700" />
                          <span>Mục tiêu &amp; Dẫn nhập (English)</span>
                        </h3>
                        <ul className="list-disc pl-4 text-sm text-slate-800 space-y-1">
                          {lesson.objectivesEn.map((obj, idx) => (
                            <li key={idx}>{obj}</li>
                          ))}
                        </ul>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                          “{lesson.warmUpScriptEn}”
                        </p>
                      </div>
                    ) : null}

                    {displayMode !== 'en' ? (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                          <Languages className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Mục tiêu &amp; Dẫn nhập (Tiếng Việt)</span>
                        </h3>
                        <ul className="list-disc pl-4 text-sm text-slate-800 space-y-1">
                          {lesson.objectivesVi.map((obj, idx) => (
                            <li key={idx}>{obj}</li>
                          ))}
                        </ul>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                          “{lesson.warmUpScriptVi}”
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
