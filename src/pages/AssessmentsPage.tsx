import React, { useCallback, useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/common/StateViews';
import { useAsyncData } from '@/src/hooks/useAsyncData';
import { teacherService } from '@/src/services/teacherService';

export const AssessmentsPage: React.FC = () => {
  const fetcher = useCallback(() => teacherService.fetchAssessments(), []);
  const { data, setData, isLoading, error, reload } = useAsyncData(fetcher);
  const [filter, setFilter] = useState<'all' | 'pending'>('all');

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === 'pending') return data.filter((item) => item.status !== 'Đạt yêu cầu');
    return data;
  }, [data, filter]);

  const handleSimulateStart = (id: string) => {
    if (!data) return;
    setData(
      data.map((quiz) =>
        quiz.id === id
          ? {
              ...quiz,
              bestScore: quiz.bestScore ?? 85,
              status: 'Đạt yêu cầu',
            }
          : quiz
      )
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kiểm tra"
        description="Đánh giá mức độ nắm vững mẫu câu lớp học, thuật ngữ chuyên ngành và năng lực theo chuẩn CEFR."
        actions={
          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Tất cả bài kiểm tra
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Cần hoàn thành
            </button>
          </div>
        }
      />

      {isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Không còn bài kiểm tra nào cần làm"
          description="Tất cả bài kiểm tra trong bộ lọc này đã đạt yêu cầu."
          actionLabel="Xem tất cả bài kiểm tra"
          onAction={() => setFilter('all')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-medium text-blue-700">{quiz.category}</span>
                  <span className="tabular-nums">
                    {quiz.questionCount} câu · {quiz.durationMinutes} phút
                  </span>
                </div>
                <h2 className="text-base font-semibold text-slate-900 leading-snug">
                  {quiz.title}
                </h2>
                <p className="text-xs text-slate-600 tabular-nums">
                  Trạng thái:{' '}
                  <span className="font-semibold text-slate-900">{quiz.status}</span>
                  {quiz.bestScore !== null ? ` · Điểm cao nhất: ${quiz.bestScore}/100` : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSimulateStart(quiz.id)}
                className="w-full min-h-10 px-4 py-2 inline-flex items-center justify-center gap-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>{quiz.bestScore !== null ? 'Làm lại bài kiểm tra' : 'Bắt đầu làm bài'}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
