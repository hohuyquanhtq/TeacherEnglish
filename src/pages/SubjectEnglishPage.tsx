import React, { useCallback, useMemo, useState } from 'react';
import { Search, Volume2 } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/common/StateViews';
import { SUBJECT_OPTIONS } from '@/src/config/curriculum';
import { useAsyncData } from '@/src/hooks/useAsyncData';
import { teacherService } from '@/src/services/teacherService';

export const SubjectEnglishPage: React.FC = () => {
  const fetcher = useCallback(() => teacherService.fetchSubjectTerms(), []);
  const { data, isLoading, error, reload } = useAsyncData(fetcher);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTerms = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    return data.filter((term) => {
      const matchSubject = subjectFilter === 'all' || term.subjectId === subjectFilter;
      const matchSearch =
        !q ||
        term.termEn.toLowerCase().includes(q) ||
        term.termVi.toLowerCase().includes(q) ||
        term.classroomExample.toLowerCase().includes(q);
      return matchSubject && matchSearch;
    });
  }, [data, subjectFilter, searchQuery]);

  const speakTerm = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subject English"
        description="Hệ thống thuật ngữ chuyên ngành và câu giảng giải mẫu theo từng môn học trong chương trình phổ thông."
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="subject-filter" className="text-sm font-medium text-slate-700 whitespace-nowrap">
            Lọc theo môn:
          </label>
          <select
            id="subject-filter"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="min-h-10 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
          >
            <option value="all">Tất cả môn học</option>
            {SUBJECT_OPTIONS.slice(0, 6).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm thuật ngữ Anh / Việt..."
            className="w-full min-h-10 pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filteredTerms.length === 0 ? (
        <EmptyState
          title="Chưa có thuật ngữ phù hợp với bộ lọc"
          description="Hãy chọn Tất cả môn học hoặc đổi từ khóa tìm kiếm để xem danh sách thuật ngữ."
          actionLabel="Hiển thị tất cả"
          onAction={() => {
            setSubjectFilter('all');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-4">Thuật ngữ tiếng Anh</th>
                  <th className="py-3.5 px-4">Nghĩa tiếng Việt</th>
                  <th className="py-3.5 px-4">Môn · Khối</th>
                  <th className="py-3.5 px-4">Câu giảng mẫu trên lớp</th>
                  <th className="py-3.5 px-4 text-right">Nghe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredTerms.map((term) => (
                  <tr key={term.id} className="hover:bg-slate-50/70">
                    <td className="py-4 px-4 align-top">
                      <p className="font-semibold text-slate-900">{term.termEn}</p>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">{term.phonetic}</p>
                    </td>
                    <td className="py-4 px-4 align-top font-medium text-slate-800">
                      {term.termVi}
                    </td>
                    <td className="py-4 px-4 align-top text-xs text-slate-600 whitespace-nowrap">
                      {term.subjectName} · {term.gradeTag}
                    </td>
                    <td className="py-4 px-4 align-top text-slate-600 max-w-md">
                      {term.classroomExample}
                    </td>
                    <td className="py-4 px-4 align-top text-right">
                      <button
                        type="button"
                        onClick={() => speakTerm(term.termEn)}
                        aria-label={`Nghe phát âm ${term.termEn}`}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
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
