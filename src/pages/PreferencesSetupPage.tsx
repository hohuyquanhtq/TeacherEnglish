import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, CheckCircle2, Save } from 'lucide-react';
import { PageHeader } from '@/src/components/common/StateViews';
import {
  ENGLISH_LEVEL_OPTIONS,
  SCHOOL_STAGE_OPTIONS,
  SUBJECT_OPTIONS,
} from '@/src/config/curriculum';
import { ROUTES } from '@/src/config/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { EnglishLevel, SchoolStage, SubjectId } from '@/src/types';

export const PreferencesSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updatePreferences } = useAuth();

  const [primarySubject, setPrimarySubject] = useState<SubjectId>(profile.preferences.primarySubject);
  const [secondarySubjects, setSecondarySubjects] = useState<SubjectId[]>(
    profile.preferences.secondarySubjects
  );
  const [schoolStage, setSchoolStage] = useState<SchoolStage>(profile.preferences.schoolStage);
  const [grades, setGrades] = useState<number[]>(profile.preferences.grades);
  const [currentLevel, setCurrentLevel] = useState<EnglishLevel>(profile.preferences.currentLevel);
  const [targetLevel, setTargetLevel] = useState<EnglishLevel>(profile.preferences.targetLevel);
  const [weeklyMinutesTarget, setWeeklyMinutesTarget] = useState<number>(
    profile.preferences.weeklyMinutesTarget
  );
  const [saved, setSaved] = useState(false);

  const activeStageOption =
    SCHOOL_STAGE_OPTIONS.find((item) => item.id === schoolStage) ?? SCHOOL_STAGE_OPTIONS[2];

  const handleStageChange = (nextStage: SchoolStage) => {
    setSchoolStage(nextStage);
    const stageDef = SCHOOL_STAGE_OPTIONS.find((item) => item.id === nextStage);
    if (stageDef) {
      setGrades([stageDef.grades[0]]);
    }
  };

  const toggleGrade = (grade: number) => {
    setGrades((prev) => {
      if (prev.includes(grade)) {
        return prev.length > 1 ? prev.filter((g) => g !== grade) : prev;
      }
      return [...prev, grade].sort((a, b) => a - b);
    });
  };

  const toggleSecondarySubject = (subjectId: SubjectId) => {
    if (subjectId === primarySubject) return;
    setSecondarySubjects((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      primarySubject,
      secondarySubjects: secondarySubjects.filter((id) => id !== primarySubject),
      schoolStage,
      grades,
      currentLevel,
      targetLevel,
      weeklyMinutesTarget,
    });
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chọn môn học, khối lớp và trình độ tiếng Anh"
        description="Lựa chọn này giúp Teacher English đề xuất đúng thuật ngữ chuyên ngành, mẫu câu lớp học và lộ trình nâng chuẩn CEFR."
      />

      {saved ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm font-medium text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Đã cập nhật cấu hình môn học, khối lớp và trình độ tiếng Anh.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="px-4 py-2 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 whitespace-nowrap self-start sm:self-auto"
          >
            Xem trên Tổng quan
          </button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Subject selection */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              1. Môn học giảng dạy chính &amp; môn liên quan
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Chọn 1 môn học trọng tâm để ưu tiên học liệu chuyên ngành.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUBJECT_OPTIONS.map((subject) => {
              const isPrimary = primarySubject === subject.id;
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => {
                    setPrimarySubject(subject.id);
                    setSecondarySubjects((prev) => prev.filter((id) => id !== subject.id));
                  }}
                  className={`p-4 rounded-xl border text-left transition-colors flex items-start justify-between gap-3 ${
                    isPrimary
                      ? 'border-blue-600 bg-blue-50/70'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{subject.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {subject.englishName} · {subject.group}
                    </p>
                  </div>
                  {isPrimary ? (
                    <span className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm font-medium text-slate-800 mb-2.5">
              Môn học bổ trợ muốn xem thêm (tùy chọn)
            </p>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_OPTIONS.filter((s) => s.id !== primarySubject).map((subject) => {
                const selected = secondarySubjects.includes(subject.id);
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => toggleSecondarySubject(subject.id)}
                    className={`min-h-10 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                      selected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {subject.name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 2: School Stage & Grades */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">2. Cấp học &amp; Khối lớp phụ trách</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Chọn cấp học và các khối lớp bạn đang trực tiếp đứng lớp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SCHOOL_STAGE_OPTIONS.map((stage) => {
              const active = schoolStage === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => handleStageChange(stage.id)}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    active
                      ? 'border-blue-600 bg-blue-50/70'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{stage.label}</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{stage.description}</p>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium text-slate-800 mb-2.5">Chọn khối lớp giảng dạy</p>
            <div className="flex flex-wrap gap-2.5">
              {activeStageOption.grades.map((grade) => {
                const isSelected = grades.includes(grade);
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => toggleGrade(grade)}
                    className={`min-h-10 min-w-[84px] px-4 py-2 rounded-lg text-sm font-medium border transition-colors tabular-nums ${
                      isSelected
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Lớp {grade}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 3: CEFR English Level */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              3. Trình độ tiếng Anh hiện tại &amp; mục tiêu (Khung CEFR)
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Xác định mức độ sẵn sàng hiện tại và ngưỡng năng lực bạn hướng tới.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ENGLISH_LEVEL_OPTIONS.map((lvl) => {
              const active = currentLevel === lvl.code;
              return (
                <button
                  key={lvl.code}
                  type="button"
                  onClick={() => setCurrentLevel(lvl.code)}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    active
                      ? 'border-blue-600 bg-blue-50/70'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{lvl.title}</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{lvl.summary}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            <div>
              <label htmlFor="target-level" className="block text-sm font-medium text-slate-700 mb-1.5">
                Mục tiêu trình độ hướng tới
              </label>
              <select
                id="target-level"
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value as EnglishLevel)}
                className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                {ENGLISH_LEVEL_OPTIONS.map((lvl) => (
                  <option key={lvl.code} value={lvl.code}>
                    {lvl.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="weekly-minutes" className="block text-sm font-medium text-slate-700 mb-1.5">
                Thời lượng tự học mỗi tuần
              </label>
              <select
                id="weekly-minutes"
                value={weeklyMinutesTarget}
                onChange={(e) => setWeeklyMinutesTarget(Number(e.target.value))}
                className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value={90}>90 phút / tuần (15 phút/ngày)</option>
                <option value={180}>180 phút / tuần (30 phút/ngày)</option>
                <option value={300}>300 phút / tuần (50 phút/ngày)</option>
              </select>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            to={ROUTES.DASHBOARD}
            className="min-h-10 px-4 py-2 inline-flex items-center text-sm font-medium text-slate-700 hover:bg-slate-200/70 rounded-lg"
          >
            Hủy thay đổi
          </Link>
          <button
            type="submit"
            className="min-h-11 px-5 py-2.5 inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Lưu cấu hình học tập</span>
          </button>
        </div>
      </form>
    </div>
  );
};
