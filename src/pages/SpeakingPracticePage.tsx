import React, { useCallback, useState } from 'react';
import { Mic, RotateCcw, Square, Volume2 } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/common/StateViews';
import { useAsyncData } from '@/src/hooks/useAsyncData';
import { teacherService } from '@/src/services/teacherService';

export const SpeakingPracticePage: React.FC = () => {
  const fetcher = useCallback(() => teacherService.fetchSpeakingPrompts(), []);
  const { data, setData, isLoading, error, reload } = useAsyncData(fetcher);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [isRecordingPreview, setIsRecordingPreview] = useState(false);

  const playSample = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    }
  };

  const togglePractice = (id: string) => {
    if (activePromptId === id && isRecordingPreview) {
      setIsRecordingPreview(false);
      if (data) {
        setData(
          data.map((item) =>
            item.id === id ? { ...item, practicedCount: item.practicedCount + 1 } : item
          )
        );
      }
      return;
    }
    setActivePromptId(id);
    setIsRecordingPreview(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Luyện nói"
        description="Thực hành đọc to lời giảng, giữ nhịp nói rõ ràng và luyện phản xạ theo các tình huống đứng lớp quen thuộc."
      />

      {isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Chưa có bài luyện nói nào"
          description="Nhấn Tải lại để lấy danh sách bài tập phát âm và ngữ điệu sư phạm."
          actionLabel="Tải lại"
          onAction={reload}
          icon={<RotateCcw className="w-5 h-5" />}
        />
      ) : (
        <div className="space-y-4">
          {data.map((item) => {
            const isRecordingThis = activePromptId === item.id && isRecordingPreview;
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                      <span className="font-semibold text-blue-700">Trình độ {item.targetLevel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.context}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">Thời lượng gợi ý {item.durationSeconds} giây</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">Đã luyện {item.practicedCount} lần</span>
                    </div>
                    <h2 className="mt-1.5 text-lg font-semibold text-slate-900">{item.title}</h2>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => playSample(item.sampleAnswer)}
                      className="min-h-10 px-3.5 py-2 inline-flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Nghe mẫu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePractice(item.id)}
                      className={`min-h-10 px-4 py-2 inline-flex items-center gap-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        isRecordingThis
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-blue-700 hover:bg-blue-800 text-white'
                      }`}
                    >
                      {isRecordingThis ? (
                        <>
                          <Square className="w-4 h-4" />
                          <span>Dừng &amp; Ghi nhận lượt</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          <span>Bắt đầu luyện nói</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 leading-relaxed">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Lời giảng tham khảo:</p>
                  <p>“{item.sampleAnswer}”</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
