import React, { useCallback, useState } from 'react';
import {
  BookMarked,
  CheckCircle2,
  CheckSquare,
  MessageSquareText,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/common/StateViews';
import { SUBJECT_OPTIONS } from '@/src/config/curriculum';
import { auth } from '@/src/config/firebase';
import { useAsyncData } from '@/src/hooks/useAsyncData';
import { useAuth } from '@/src/hooks/authContext';
import { COLLECTIONS, firestoreService } from '@/src/services/firestoreService';
import { EnglishLevel, SubjectId, formatSystemRoleLabel } from '@/src/types';
import { getSubjectLabel } from '@/src/utils/formatters';

type EditorTab = 'lessons' | 'classroom' | 'quizzes';

interface FirestoreLessonDoc {
  id: string;
  title: string;
  subjectId: SubjectId;
  subjectName?: string;
  gradeLabel?: string;
  level: EnglishLevel;
  durationMinutes: number;
  warmUpScriptEn?: string;
  warmUpScriptVi?: string;
}

interface FirestorePhraseDoc {
  id: string;
  situation: string;
  english: string;
  vietnamese: string;
  pronunciation?: string;
  note?: string;
}

interface FirestoreQuizDoc {
  id: string;
  title: string;
  category: string;
  questionCount: number;
  durationMinutes: number;
}

export const EditorDashboardPage: React.FC = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<EditorTab>('lessons');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Lesson form state
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonSubject, setLessonSubject] = useState<SubjectId>('physics');
  const [lessonGrade, setLessonGrade] = useState('Lớp 10');
  const [lessonLevel, setLessonLevel] = useState<EnglishLevel>('B1');
  const [lessonMinutes, setLessonMinutes] = useState('45');
  const [lessonScriptEn, setLessonScriptEn] = useState('');
  const [lessonScriptVi, setLessonScriptVi] = useState('');

  // Classroom phrase form state
  const [phraseSituation, setPhraseSituation] = useState('Mở đầu tiết học');
  const [phraseEn, setPhraseEn] = useState('');
  const [phraseVi, setPhraseVi] = useState('');
  const [phraseNote, setPhraseNote] = useState('');

  // Quiz form state
  const [quizTitle, setQuizTitle] = useState('');
  const [quizCategory, setQuizCategory] = useState('Thuật ngữ môn học');
  const [quizQuestions, setQuizQuestions] = useState('15');
  const [quizMinutes, setQuizMinutes] = useState('20');

  const fetcher = useCallback(async () => {
    const [lessons, phrases, quizzes] = await Promise.all([
      firestoreService.listCollection<FirestoreLessonDoc>(COLLECTIONS.LESSONS),
      firestoreService.listCollection<FirestorePhraseDoc>(COLLECTIONS.CLASSROOM_ENGLISH),
      firestoreService.listCollection<FirestoreQuizDoc>(COLLECTIONS.QUIZZES),
    ]);
    return { lessons, phrases, quizzes };
  }, []);

  const { data, isLoading, error, reload } = useAsyncData(fetcher);

  const handleBackendEditorCheck = async () => {
    setErrorMessage('');
    setStatusMessage('');
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error('Không tìm thấy token đăng nhập.');
      const res = await fetch('/api/editor/check', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(json.error || 'Từ chối truy cập backend.');
      setStatusMessage(json.message || 'Xác thực quyền Editor thành công.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi kiểm tra backend.');
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;
    setSaving(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const id = `lesson_${Date.now()}`;
      await firestoreService.upsertDocument(COLLECTIONS.LESSONS, id, {
        id,
        title: lessonTitle.trim().slice(0, 200),
        subjectId: lessonSubject,
        subjectName: getSubjectLabel(lessonSubject),
        gradeLabel: lessonGrade.trim().slice(0, 50) || 'Lớp 10',
        level: lessonLevel,
        durationMinutes: Math.max(5, Math.min(300, Number(lessonMinutes) || 45)),
        warmUpScriptEn: lessonScriptEn.trim().slice(0, 2000),
        warmUpScriptVi: lessonScriptVi.trim().slice(0, 2000),
      });
      setLessonTitle('');
      setLessonScriptEn('');
      setLessonScriptVi('');
      setStatusMessage('Đã lưu bài học song ngữ mới vào Firestore.');
      await reload();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể lưu bài học (kiểm tra Custom Claims Editor).'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePhrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phraseEn.trim() || !phraseVi.trim()) return;
    setSaving(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const id = `phrase_${Date.now()}`;
      await firestoreService.upsertDocument(COLLECTIONS.CLASSROOM_ENGLISH, id, {
        id,
        situation: phraseSituation.trim().slice(0, 100),
        english: phraseEn.trim().slice(0, 500),
        vietnamese: phraseVi.trim().slice(0, 500),
        note: phraseNote.trim().slice(0, 500),
      });
      setPhraseEn('');
      setPhraseVi('');
      setPhraseNote('');
      setStatusMessage('Đã thêm mẫu câu Classroom English vào Firestore.');
      await reload();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể thêm mẫu câu.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) return;
    setSaving(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const id = `quiz_${Date.now()}`;
      await firestoreService.upsertDocument(COLLECTIONS.QUIZZES, id, {
        id,
        title: quizTitle.trim().slice(0, 200),
        category: quizCategory.trim().slice(0, 100),
        questionCount: Math.max(1, Math.min(200, Number(quizQuestions) || 15)),
        durationMinutes: Math.max(1, Math.min(180, Number(quizMinutes) || 20)),
      });
      setQuizTitle('');
      setStatusMessage('Đã tạo bài kiểm tra chuẩn trong Firestore.');
      await reload();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tạo bài kiểm tra.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async (collectionName: string, id: string) => {
    setErrorMessage('');
    setStatusMessage('');
    try {
      await firestoreService.deleteDocument(collectionName, id);
      setStatusMessage('Đã xóa mục học liệu khỏi Firestore.');
      await reload();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể xóa học liệu.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Không gian Biên tập Học liệu"
        description={`Vai trò hiện tại: ${formatSystemRoleLabel(role)}. Biên tập và xuất bản bài học song ngữ, mẫu câu lớp học và đề kiểm tra chuẩn lên Firestore.`}
        actions={
          <button
            type="button"
            onClick={() => void handleBackendEditorCheck()}
            className="inline-flex items-center gap-2 min-h-10 px-4 py-2 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Kiểm tra quyền Editor</span>
          </button>
        }
      />

      {statusMessage ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-sm text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('lessons')}
          className={`inline-flex items-center gap-2 min-h-10 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'lessons'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>Bài học song ngữ ({data?.lessons.length ?? 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('classroom')}
          className={`inline-flex items-center gap-2 min-h-10 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'classroom'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquareText className="w-4 h-4" />
          <span>English Classroom ({data?.phrases.length ?? 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('quizzes')}
          className={`inline-flex items-center gap-2 min-h-10 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'quizzes'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Đề kiểm tra ({data?.quizzes.length ?? 0})</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : activeTab === 'lessons' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleCreateLesson}
            className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4"
          >
            <h2 className="text-base font-semibold text-slate-900">Thêm bài học song ngữ mới</h2>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tiêu đề bài học</label>
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Newton's Laws of Motion (Bilingual)"
                className="w-full min-h-10 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Môn học</label>
                <select
                  value={lessonSubject}
                  onChange={(e) => setLessonSubject(e.target.value as SubjectId)}
                  className="w-full min-h-10 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                >
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Khối lớp</label>
                <input
                  type="text"
                  value={lessonGrade}
                  onChange={(e) => setLessonGrade(e.target.value)}
                  className="w-full min-h-10 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Trình độ CEFR</label>
                <select
                  value={lessonLevel}
                  onChange={(e) => setLessonLevel(e.target.value as EnglishLevel)}
                  className="w-full min-h-10 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                >
                  {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as EnglishLevel[]).map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Thời lượng (phút)</label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={lessonMinutes}
                  onChange={(e) => setLessonMinutes(e.target.value)}
                  className="w-full min-h-10 px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kịch bản mở bài (Tiếng Anh)
              </label>
              <textarea
                rows={2}
                value={lessonScriptEn}
                onChange={(e) => setLessonScriptEn(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Bản dịch gợi ý (Tiếng Việt)
              </label>
              <textarea
                rows={2}
                value={lessonScriptVi}
                onChange={(e) => setLessonScriptVi(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full min-h-10 px-4 py-2 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Đang lưu...' : 'Xuất bản bài học'}</span>
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {!data || data.lessons.length === 0 ? (
              <EmptyState
                title="Chưa có bài học song ngữ nào trên Firestore"
                description="Biên tập viên có thể thêm bài học song ngữ chuẩn bằng biểu mẫu bên trái."
              />
            ) : (
              data.lessons.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 tabular-nums">
                      {item.subjectName || getSubjectLabel(item.subjectId)} · {item.gradeLabel || 'THPT'} · Trình độ {item.level} · {item.durationMinutes} phút
                    </p>
                    {item.warmUpScriptEn ? (
                      <p className="text-xs text-slate-700 mt-2 line-clamp-2">{item.warmUpScriptEn}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteDoc(COLLECTIONS.LESSONS, item.id)}
                    aria-label={`Xóa ${item.title}`}
                    className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeTab === 'classroom' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleCreatePhrase}
            className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4"
          >
            <h2 className="text-base font-semibold text-slate-900">Thêm mẫu câu giao tiếp lớp học</h2>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tình huống</label>
              <select
                value={phraseSituation}
                onChange={(e) => setPhraseSituation(e.target.value)}
                className="w-full min-h-10 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="Mở đầu tiết học">Mở đầu tiết học</option>
                <option value="Giao nhiệm vụ">Giao nhiệm vụ</option>
                <option value="Quản lý lớp">Quản lý lớp</option>
                <option value="Khen ngợi & Phản hồi">Khen ngợi &amp; Phản hồi</option>
                <option value="Kết thúc bài">Kết thúc bài</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Mẫu câu tiếng Anh</label>
              <input
                type="text"
                value={phraseEn}
                onChange={(e) => setPhraseEn(e.target.value)}
                placeholder="Please open your textbooks to page 24."
                className="w-full min-h-10 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nghĩa tiếng Việt</label>
              <input
                type="text"
                value={phraseVi}
                onChange={(e) => setPhraseVi(e.target.value)}
                placeholder="Các em vui lòng mở sách giáo khoa trang 24."
                className="w-full min-h-10 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ghi chú sư phạm</label>
              <input
                type="text"
                value={phraseNote}
                onChange={(e) => setPhraseNote(e.target.value)}
                className="w-full min-h-10 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full min-h-10 px-4 py-2 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Đang lưu...' : 'Thêm mẫu câu'}</span>
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {!data || data.phrases.length === 0 ? (
              <EmptyState
                title="Chưa có mẫu câu Classroom English trong Firestore"
                description="Hãy thêm mẫu câu giao tiếp lớp học chuẩn bằng biểu mẫu bên trái."
              />
            ) : (
              data.phrases.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-blue-700">{item.situation}</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{item.english}</p>
                    <p className="text-xs text-slate-600 mt-1">{item.vietnamese}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteDoc(COLLECTIONS.CLASSROOM_ENGLISH, item.id)}
                    aria-label="Xóa mẫu câu"
                    className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleCreateQuiz}
            className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4"
          >
            <h2 className="text-base font-semibold text-slate-900">Tạo bài kiểm tra mới</h2>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tên bài kiểm tra</label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Đánh giá thuật ngữ Vật lý B1"
                className="w-full min-h-10 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Danh mục</label>
              <select
                value={quizCategory}
                onChange={(e) => setQuizCategory(e.target.value)}
                className="w-full min-h-10 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="Ngôn ngữ lớp học">Ngôn ngữ lớp học</option>
                <option value="Thuật ngữ môn học">Thuật ngữ môn học</option>
                <option value="Phát âm">Phát âm</option>
                <option value="Tổng hợp CEFR">Tổng hợp CEFR</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Số câu hỏi</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={quizQuestions}
                  onChange={(e) => setQuizQuestions(e.target.value)}
                  className="w-full min-h-10 px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Thời gian (phút)</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={quizMinutes}
                  onChange={(e) => setQuizMinutes(e.target.value)}
                  className="w-full min-h-10 px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full min-h-10 px-4 py-2 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Đang lưu...' : 'Lưu bài kiểm tra'}</span>
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {!data || data.quizzes.length === 0 ? (
              <EmptyState
                title="Chưa có bài kiểm tra chuẩn nào trong Firestore"
                description="Sử dụng biểu mẫu bên trái để xuất bản bài kiểm tra cho giáo viên."
              />
            ) : (
              data.quizzes.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 tabular-nums">
                      {item.category} · {item.questionCount} câu · {item.durationMinutes} phút
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteDoc(COLLECTIONS.QUIZZES, item.id)}
                    aria-label={`Xóa ${item.title}`}
                    className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
