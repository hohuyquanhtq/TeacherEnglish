import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Check, CheckCircle2, Save } from 'lucide-react';
import { PageHeader } from '@/src/components/common/StateViews';
import {
  ENGLISH_LEVEL_OPTIONS,
  SCHOOL_STAGE_OPTIONS,
  SUBJECT_OPTIONS,
} from '@/src/config/curriculum';
import { ROUTES } from '@/src/config/navigation';
import { useAuth } from '@/src/hooks/authContext';
import { EnglishLevel, SchoolStage, SubjectId } from '@/src/types';

export const PreferencesSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updatePreferences } = useAuth();

  const [selectedSubjects, setSelectedSubjects] = useState<SubjectId[]>([
    profile.preferences.primarySubject,
    ...profile.preferences.secondarySubjects,
  ]);
  const [schoolStage, setSchoolStage] = useState<SchoolStage>(profile.preferences.schoolStage);
  const [grades, setGrades] = useState<number[]>(profile.preferences.grades);
  const [currentLevel, setCurrentLevel] = useState<EnglishLevel>(profile.preferences.currentLevel);
  const [targetLevel, setTargetLevel] = useState<EnglishLevel>(profile.preferences.targetLevel);
  const [weeklyMinutesTarget, setWeeklyMinutesTarget] = useState<number>(
    profile.preferences.weeklyMinutesTarget
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setSelectedSubjects(
      Array.from(
        new Set([profile.preferences.primarySubject, ...profile.preferences.secondarySubjects])
      )
    );
    setSchoolStage(profile.preferences.schoolStage);
    setGrades(profile.preferences.grades);
    setCurrentLevel(profile.preferences.currentLevel);
    setTargetLevel(profile.preferences.targetLevel);
    setWeeklyMinutesTarget(profile.preferences.weeklyMinutesTarget);
  }, [profile]);

  const toggleSubject = (subjectId: SubjectId) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subjectId)) {
        return prev.length > 1 ? prev.filter((id) => id !== subjectId) : prev;
      }
      return [...prev, subjectId];
    });
  };

  const toggleGrade = (grade: number) => {
    setGrades((prev) => {
      if (prev.includes(grade)) {
        return prev.length > 1 ? prev.filter((g) => g !== grade) : prev;
      }
      return [...prev, grade].sort((a, b) => a - b);
    });
  };

  const handleStageSelect = (nextStage: SchoolStage) => {
    setSchoolStage(nextStage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaved(false);
    setIsSaving(true);

    const primarySubject = selectedSubjects[0] ?? 'physics';
    const secondarySubjects = selectedSubjects.slice(1);

    try {
      await updatePreferences({
        primarySubject,
        secondarySubjects,
        schoolStage,
        grades,
        currentLevel,
        targetLevel,
        weeklyMinutesTarget,
      });
      setSaved(true);
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : 'Không thể lưu cấu hình lên Firestore.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chọn môn học, khối lớp và trình độ tiếng Anh"
        description="Cho phép chọn nhiều môn học, nhiều khối lớp và lưu trình độ CEFR trực tiếp vào hồ sơ Firestore của bạn."
      />

      {errorMsg ? (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-sm text-red-800"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      ) : null}

      {saved ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm font-medium text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Đã lưu danh sách môn học, khối lớp và trình độ tiếng Anh vào Firestore.</span>
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
        {/* Section 1: Multi-subject selection */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              1. Chọn các môn học giảng dạy ({selectedSubjects.length} môn đã chọn)
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Bạn có thể chọn một hoặc nhiều môn học liên quan; môn đầu tiên được dùng làm môn trọng tâm.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUBJECT_OPTIONS.map((subject) => {
              const isSelected = selectedSubjects.includes(subject.id);
              const isPrimary = selectedSubjects[0] === subject.id;
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => toggleSubject(subject.id)}
                  className={`p-4 rounded-xl border text-left transition-colors flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {subject.name}
                      {isPrimary ? (
                        <span className="ml-2 text-xs font-medium text-blue-700">· Trọng tâm</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {subject.englishName} · {subject.group}
                    </p>
                  </div>
                  {isSelected ? (
                    <span className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: School Stage & Multi-grade selection */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              2. Cấp học chính &amp; Chọn nhiều khối lớp phụ trách ({grades.length} khối đã chọn)
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Chọn cấp học chính và bật/tắt bất kỳ khối lớp nào từ Lớp 1 đến Lớp 12 mà bạn trực tiếp giảng dạy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SCHOOL_STAGE_OPTIONS.map((stage) => {
              const active = schoolStage === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => handleStageSelect(stage.id)}
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

          <div className="pt-2 space-y-3">
            {SCHOOL_STAGE_OPTIONS.map((stage) => (
              <div key={stage.id} className="space-y-2">
                <p className="text-xs font-semibold text-slate-600">{stage.label}</p>
                <div className="flex flex-wrap gap-2">
                  {stage.grades.map((grade) => {
                    const isSelected = grades.includes(grade);
                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => toggleGrade(grade)}
                        className={`min-h-10 min-w-[80px] px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors tabular-nums ${
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
            ))}
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
            disabled={isSaving}
            className="min-h-11 px-5 py-2.5 inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu cấu hình học tập'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
