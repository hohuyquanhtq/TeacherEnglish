import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { AppImage } from '@/src/components/common/AppImage';
import { EmptyState } from '@/src/components/common/StateViews';
import { LessonStatus, RecentLesson } from '@/src/types';

interface RecentLessonsSectionProps {
  lessons: RecentLesson[];
}

const STATUS_LABELS: Record<LessonStatus, string> = {
  completed: 'Đã hoàn thành',
  in_progress: 'Đang học',
  not_started: 'Chưa bắt đầu',
};

const FILTER_OPTIONS: { id: 'all' | LessonStatus; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'in_progress', label: 'Đang học' },
  { id: 'completed', label: 'Đã hoàn thành' },
];

export const RecentLessonsSection: React.FC<RecentLessonsSectionProps> = ({ lessons }) => {
  const [filter, setFilter] = useState<'all' | LessonStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLessons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const matchesStatus = filter === 'all' || lesson.status === filter;
      const matchesQuery =
        !query ||
        lesson.title.toLowerCase().includes(query) ||
        lesson.moduleName.toLowerCase().includes(query) ||
        lesson.subjectLabel.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [lessons, filter, searchQuery]);

  const resetFilters = () => {
    setFilter('all');
    setSearchQuery('');
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Bài học gần đây</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Tiếp tục các bài giảng và chuyên đề bạn đã mở gần nhất.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bài học..."
              aria-label="Tìm bài học gần đây"
              className="w-full sm:w-48 min-h-10 pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filter === option.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredLessons.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="Không tìm thấy bài học phù hợp"
            description="Không có bài học nào khớp với bộ lọc hoặc từ khóa bạn vừa nhập."
            actionLabel="Xóa bộ lọc"
            onAction={resetFilters}
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <AppImage
                  src={lesson.coverUrl}
                  alt={lesson.title}
                  fallbackText={lesson.moduleName}
                  className="w-20 h-14 rounded-lg object-cover shrink-0 border border-slate-200"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-medium text-blue-700">{lesson.moduleName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{lesson.subjectLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{lesson.durationMinutes} phút</span>
                  </div>

                  <h3 className="mt-1 text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                    {lesson.title}
                  </h3>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${
                          lesson.status === 'completed' ? 'bg-emerald-600' : 'bg-blue-700'
                        }`}
                        style={{ width: `${lesson.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600 tabular-nums">
                      {lesson.progressPercent}% · {STATUS_LABELS[lesson.status]} · {lesson.lastAccessedAt}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  to={lesson.routePath}
                  className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <span>
                    {lesson.status === 'completed'
                      ? 'Xem lại'
                      : lesson.status === 'in_progress'
                      ? 'Tiếp tục'
                      : 'Bắt đầu'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
