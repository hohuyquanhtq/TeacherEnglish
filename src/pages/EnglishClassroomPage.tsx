import React, { useCallback, useMemo, useState } from 'react';
import { Bookmark, Search, Volume2 } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/common/StateViews';
import { useAsyncData } from '@/src/hooks/useAsyncData';
import { teacherService } from '@/src/services/teacherService';

const SITUATIONS = [
  'Tất cả',
  'Mở đầu tiết học',
  'Giao nhiệm vụ',
  'Quản lý lớp',
  'Khen ngợi & Phản hồi',
  'Kết thúc bài',
] as const;

export const EnglishClassroomPage: React.FC = () => {
  const fetcher = useCallback(() => teacherService.fetchClassroomPhrases(), []);
  const { data, setData, isLoading, error, reload } = useAsyncData(fetcher);
  const [selectedSituation, setSelectedSituation] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const filteredPhrases = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    return data.filter((item) => {
      const matchSituation =
        selectedSituation === 'Tất cả' || item.situation === selectedSituation;
      const matchQuery =
        !q ||
        item.english.toLowerCase().includes(q) ||
        item.vietnamese.toLowerCase().includes(q);
      return matchSituation && matchQuery;
    });
  }, [data, selectedSituation, searchQuery]);

  const toggleBookmark = (id: string) => {
    if (!data) return;
    setData(
      data.map((item) => (item.id === id ? { ...item, bookmarked: !item.bookmarked } : item))
    );
  };

  const handleSpeak = (id: string, text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.92;
      utterance.onend = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="English Classroom"
        description="Hệ thống mẫu câu điều hành lớp học tự nhiên theo từng tình huống đứng lớp, kèm phiên âm và ghi chú sư phạm."
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {SITUATIONS.map((sit) => (
            <button
              key={sit}
              type="button"
              onClick={() => setSelectedSituation(sit)}
              className={`min-h-9 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedSituation === sit
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sit}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm mẫu câu Anh / Việt..."
            aria-label="Tìm mẫu câu lớp học"
            className="w-full min-h-10 pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filteredPhrases.length === 0 ? (
        <EmptyState
          title="Không tìm thấy mẫu câu phù hợp"
          description="Thử chọn tình huống khác hoặc xóa từ khóa tìm kiếm hiện tại."
          actionLabel="Đặt lại bộ lọc"
          onAction={() => {
            setSelectedSituation('Tất cả');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filteredPhrases.map((phrase) => (
            <div key={phrase.id} className="p-5 sm:p-6 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-700">{phrase.situation}</p>
                  <p className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                    {phrase.english}
                  </p>
                  <p className="text-xs font-mono text-slate-500">{phrase.pronunciation}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSpeak(phrase.id, phrase.english)}
                    aria-label="Nghe phát âm mẫu"
                    className={`min-h-10 px-3 py-2 inline-flex items-center gap-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                      speakingId === phrase.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{speakingId === phrase.id ? 'Đang đọc' : 'Nghe mẫu'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleBookmark(phrase.id)}
                    aria-label={phrase.bookmarked ? 'Bỏ lưu mẫu câu' : 'Lưu vào thư viện'}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                      phrase.bookmarked
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${phrase.bookmarked ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-sm text-slate-700 space-y-1">
                <p>
                  <span className="font-medium text-slate-900">Nghĩa tiếng Việt:</span>{' '}
                  {phrase.vietnamese}
                </p>
                <p className="text-xs text-slate-500">Ghi chú sư phạm: {phrase.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
