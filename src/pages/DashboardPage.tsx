import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, SlidersHorizontal, UserCog } from 'lucide-react';
import {
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/common/StateViews';
import { LearningGoalsSection } from '@/src/components/dashboard/LearningGoalsSection';
import { ProgressCards } from '@/src/components/dashboard/ProgressCards';
import { RecentLessonsSection } from '@/src/components/dashboard/RecentLessonsSection';
import { ROUTES } from '@/src/config/navigation';
import { useAsyncData } from '@/src/hooks/useAsyncData';
import { useAuth } from '@/src/hooks/useAuth';
import { teacherService } from '@/src/services/teacherService';
import { LearningGoal } from '@/src/types';
import { formatGradesLabel, getStageLabel, getSubjectLabel } from '@/src/utils/formatters';

export const DashboardPage: React.FC = () => {
  const { profile, session } = useAuth();
  const fetcher = useCallback(() => teacherService.fetchDashboardData(), []);
  const { data, setData, isLoading, error, reload } = useAsyncData(fetcher);

  const handleToggleGoal = (goalId: string) => {
    if (!data) return;
    const nextGoals = data.goals.map((goal) => {
      if (goal.id !== goalId) return goal;
      const nextCompleted = !goal.completed;
      return {
        ...goal,
        completed: nextCompleted,
        currentValue: nextCompleted ? goal.targetValue : Math.min(goal.currentValue, goal.targetValue - 1),
        dueLabel: nextCompleted ? 'Đã đạt mục tiêu' : 'Đang thực hiện',
      };
    });
    teacherService.saveGoals(nextGoals);
    setData({ ...data, goals: nextGoals });
  };

  const handleAddGoal = (title: string, targetValue: number, unit: string) => {
    if (!data) return;
    const newGoal: LearningGoal = {
      id: `goal-${Date.now()}`,
      title,
      category: getSubjectLabel(profile.preferences.primarySubject),
      currentValue: 0,
      targetValue,
      unit,
      dueLabel: 'Tuần này',
      completed: false,
    };
    const nextGoals = [newGoal, ...data.goals];
    teacherService.saveGoals(nextGoals);
    setData({ ...data, goals: nextGoals });
  };

  const handleDeleteGoal = (goalId: string) => {
    if (!data) return;
    const nextGoals = data.goals.filter((goal) => goal.id !== goalId);
    teacherService.saveGoals(nextGoals);
    setData({ ...data, goals: nextGoals });
  };

  const handleResetDemoGoals = () => {
    if (!data) return;
    const restored = teacherService.resetDemoGoals();
    setData({ ...data, goals: restored });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Xin chào, ${session.isAuthenticated ? profile.fullName : 'Giáo viên'}`}
        description={`${Array.from(
          new Set([profile.preferences.primarySubject, ...profile.preferences.secondarySubjects])
        )
          .map(getSubjectLabel)
          .join(', ')} · ${getStageLabel(profile.preferences.schoolStage)} (${formatGradesLabel(
          profile.preferences.grades
        )}) · Lộ trình ${profile.preferences.currentLevel} → ${
          profile.preferences.targetLevel
        } · Quyền: ${profile.systemRole}`}
        actions={
          <>
            <Link
              to={ROUTES.PREFERENCES}
              className="inline-flex items-center gap-2 min-h-10 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span>Chọn môn &amp; trình độ</span>
            </Link>
            <Link
              to={ROUTES.PROFILE_SETUP}
              className="inline-flex items-center gap-2 min-h-10 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <UserCog className="w-4 h-4" />
              <span>Hồ sơ giáo viên</span>
            </Link>
          </>
        }
      />

      {!profile.onboardingCompleted ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-blue-950">
              Hoàn tất thiết lập hồ sơ giảng dạy của bạn
            </h2>
            <p className="text-sm text-blue-900/80 mt-1">
              Chọn môn học, khối lớp và trình độ tiếng Anh hiện tại để hệ thống cá nhân hóa lộ trình phù hợp nhất.
            </p>
          </div>
          <Link
            to={ROUTES.PREFERENCES}
            className="inline-flex items-center justify-center min-h-10 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap shrink-0"
          >
            Thiết lập ngay
          </Link>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-5 h-36 animate-pulse space-y-3"
              >
                <div className="h-3.5 bg-slate-200 rounded w-1/2" />
                <div className="h-7 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
          <LoadingSkeleton rows={4} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data ? (
        <>
          <ProgressCards stats={data.stats} />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-7 min-w-0">
              <RecentLessonsSection lessons={data.recentLessons} />
            </div>
            <div className="xl:col-span-5 min-w-0">
              <LearningGoalsSection
                goals={data.goals}
                onToggleGoal={handleToggleGoal}
                onAddGoal={handleAddGoal}
                onDeleteGoal={handleDeleteGoal}
                onResetDemoGoals={handleResetDemoGoals}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 min-h-10 px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới dữ liệu tổng quan</span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};
