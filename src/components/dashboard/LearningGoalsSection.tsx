import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { EmptyState } from '@/src/components/common/StateViews';
import { LearningGoal } from '@/src/types';

interface LearningGoalsSectionProps {
  goals: LearningGoal[];
  onToggleGoal: (goalId: string) => void;
  onAddGoal: (title: string, targetValue: number, unit: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onResetDemoGoals: () => void;
}

export const LearningGoalsSection: React.FC<LearningGoalsSectionProps> = ({
  goals,
  onToggleGoal,
  onAddGoal,
  onDeleteGoal,
  onResetDemoGoals,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('3');
  const [newUnit, setNewUnit] = useState('bài học');

  const completedCount = goals.filter((goal) => goal.completed).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onAddGoal(trimmed, Math.max(1, Number(newTarget) || 1), newUnit.trim() || 'mục');
    setNewTitle('');
    setNewTarget('3');
    setNewUnit('bài học');
    setIsAdding(false);
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Mục tiêu học tập</h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            Đã hoàn thành {completedCount} / {goals.length} mục tiêu
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding((prev) => !prev)}
          className="inline-flex items-center gap-1.5 min-h-10 px-3.5 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? 'Đóng' : 'Thêm mục tiêu'}</span>
        </button>
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="p-5 bg-slate-50 border-b border-slate-200 space-y-3">
          <div>
            <label htmlFor="goal-title-input" className="block text-xs font-medium text-slate-700 mb-1">
              Tên mục tiêu học tập
            </label>
            <input
              id="goal-title-input"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ví dụ: Luyện đọc 10 thuật ngữ Hóa học lớp 11"
              className="w-full min-h-10 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="goal-target-input" className="block text-xs font-medium text-slate-700 mb-1">
                Chỉ tiêu
              </label>
              <input
                id="goal-target-input"
                type="number"
                min={1}
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className="w-full min-h-10 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label htmlFor="goal-unit-input" className="block text-xs font-medium text-slate-700 mb-1">
                Đơn vị
              </label>
              <input
                id="goal-unit-input"
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="bài học, phút..."
                className="w-full min-h-10 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="min-h-10 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/70 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="min-h-10 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
            >
              Lưu mục tiêu
            </button>
          </div>
        </form>
      ) : null}

      {goals.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="Chưa có mục tiêu nào"
            description="Hãy thêm mục tiêu tuần để duy trì nhịp độ rèn luyện tiếng Anh đứng lớp."
            actionLabel="Khôi phục mục tiêu mẫu"
            onAction={onResetDemoGoals}
            icon={<RotateCcw className="w-5 h-5" />}
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {goals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
            return (
              <div key={goal.id} className="p-4 sm:p-5 flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onToggleGoal(goal.id)}
                  aria-label={
                    goal.completed
                      ? `Đánh dấu chưa hoàn thành: ${goal.title}`
                      : `Đánh dấu hoàn thành: ${goal.title}`
                  }
                  className="mt-0.5 text-slate-400 hover:text-blue-700 transition-colors shrink-0"
                >
                  {goal.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm font-semibold leading-snug ${
                        goal.completed ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {goal.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => onDeleteGoal(goal.id)}
                      aria-label={`Xóa mục tiêu ${goal.title}`}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span>{goal.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {goal.currentValue}/{goal.targetValue} {goal.unit}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{goal.dueLabel}</span>
                  </div>

                  <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        goal.completed ? 'bg-emerald-600' : 'bg-blue-700'
                      }`}
                      style={{ width: `${goal.completed ? 100 : percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
