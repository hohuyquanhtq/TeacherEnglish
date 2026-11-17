import React, { useState } from 'react';
import { PageHeader } from '@/src/components/common/StateViews';
import { useAuth } from '@/src/hooks/useAuth';
import { formatMinutesToHours, getSubjectLabel } from '@/src/utils/formatters';

interface WeeklyReportItem {
  week: string;
  minutes: number;
  lessonsCompleted: number;
  speakingSessions: number;
}

const REPORT_DATA: Record<'month' | 'quarter', WeeklyReportItem[]> = {
  month: [
    { week: 'Tuần 1', minutes: 120, lessonsCompleted: 3, speakingSessions: 4 },
    { week: 'Tuần 2', minutes: 165, lessonsCompleted: 4, speakingSessions: 5 },
    { week: 'Tuần 3', minutes: 150, lessonsCompleted: 4, speakingSessions: 3 },
    { week: 'Tuần 4 (hiện tại)', minutes: 135, lessonsCompleted: 3, speakingSessions: 4 },
  ],
  quarter: [
    { week: 'Tháng 9', minutes: 480, lessonsCompleted: 11, speakingSessions: 12 },
    { week: 'Tháng 10', minutes: 540, lessonsCompleted: 14, speakingSessions: 16 },
    { week: 'Tháng 11', minutes: 570, lessonsCompleted: 14, speakingSessions: 16 },
  ],
};

export const ReportsPage: React.FC = () => {
  const { profile } = useAuth();
  const [period, setPeriod] = useState<'month' | 'quarter'>('month');
  const rows = REPORT_DATA[period];
  const totalMinutes = rows.reduce((sum, item) => sum + item.minutes, 0);
  const totalLessons = rows.reduce((sum, item) => sum + item.lessonsCompleted, 0);
  const maxMinutes = Math.max(...rows.map((r) => r.minutes), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo tiến độ"
        description={`Tổng hợp thời lượng rèn luyện và mức độ hoàn thành của ${profile.fullName} · Môn ${getSubjectLabel(
          profile.preferences.primarySubject
        )}.`}
        actions={
          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                period === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              4 tuần gần nhất
            </button>
            <button
              type="button"
              onClick={() => setPeriod('quarter')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                period === 'quarter' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Theo quý (3 tháng)
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm font-medium text-slate-600">Tổng thời gian học</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {formatMinutesToHours(totalMinutes)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            Mục tiêu tuần: {profile.preferences.weeklyMinutesTarget} phút
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm font-medium text-slate-600">Chuyên đề hoàn thành</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {totalLessons} bài
          </p>
          <p className="mt-1 text-xs text-slate-500">Bao gồm mẫu câu và giáo án song ngữ</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm font-medium text-slate-600">Mức độ CEFR mục tiêu</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {profile.preferences.currentLevel} → {profile.preferences.targetLevel}
          </p>
          <p className="mt-1 text-xs text-slate-500">Đang bám sát kế hoạch bồi dưỡng</p>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Biểu đồ thời lượng học tập</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Phân bổ số phút luyện tập theo từng giai đoạn.
          </p>
        </div>

        <div className="space-y-4">
          {rows.map((row) => {
            const widthPercent = Math.round((row.minutes / maxMinutes) * 100);
            return (
              <div key={row.week} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{row.week}</span>
                  <span className="text-slate-600 tabular-nums">
                    {row.minutes} phút · {row.lessonsCompleted} bài · {row.speakingSessions} lượt nói
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-700 rounded-full transition-all duration-300"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
