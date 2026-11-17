export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type SchoolStage = 'tieuhoc' | 'thcs' | 'thpt';

export type SubjectId =
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'science'
  | 'informatics'
  | 'history_geo'
  | 'literature'
  | 'english'
  | 'civics';

export type TeacherRole =
  | 'Giáo viên bộ môn'
  | 'Giáo viên tiếng Anh'
  | 'Tổ trưởng chuyên môn'
  | 'Ban giám hiệu';

export interface TeacherPreferences {
  primarySubject: SubjectId;
  secondarySubjects: SubjectId[];
  schoolStage: SchoolStage;
  grades: number[];
  currentLevel: EnglishLevel;
  targetLevel: EnglishLevel;
  weeklyMinutesTarget: number;
}

export interface TeacherProfile {
  id: string;
  fullName: string;
  email: string;
  schoolName: string;
  province: string;
  yearsOfExperience: number;
  role: TeacherRole;
  bio: string;
  avatarUrl: string;
  preferences: TeacherPreferences;
  onboardingCompleted: boolean;
}

export interface AuthSession {
  isAuthenticated: boolean;
  userId: string;
  fullName: string;
  email: string;
  role: TeacherRole;
}

export type NavIconKey =
  | 'dashboard'
  | 'roadmap'
  | 'classroom'
  | 'subject'
  | 'bilingual'
  | 'coach'
  | 'speaking'
  | 'practice'
  | 'assessments'
  | 'library'
  | 'reports'
  | 'admin';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: NavIconKey;
  description: string;
}

export type LessonStatus = 'completed' | 'in_progress' | 'not_started';

export interface RecentLesson {
  id: string;
  title: string;
  moduleName: string;
  subjectLabel: string;
  durationMinutes: number;
  progressPercent: number;
  status: LessonStatus;
  lastAccessedAt: string;
  coverUrl: string;
  routePath: string;
}

export interface LearningGoal {
  id: string;
  title: string;
  category: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  dueLabel: string;
  completed: boolean;
}

export interface ProgressStat {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  progressPercent?: number;
  trendText: string;
}

export interface RoadmapModule {
  id: string;
  order: number;
  title: string;
  cefrBand: string;
  lessonCount: number;
  completedLessons: number;
  estimatedHours: number;
  status: LessonStatus;
  summary: string;
}

export interface ClassroomPhrase {
  id: string;
  situation: 'Mở đầu tiết học' | 'Giao nhiệm vụ' | 'Quản lý lớp' | 'Khen ngợi & Phản hồi' | 'Kết thúc bài';
  english: string;
  vietnamese: string;
  pronunciation: string;
  note: string;
  bookmarked: boolean;
}

export interface SubjectTerm {
  id: string;
  subjectId: SubjectId;
  subjectName: string;
  termEn: string;
  termVi: string;
  phonetic: string;
  classroomExample: string;
  gradeTag: string;
}

export interface BilingualLessonPlan {
  id: string;
  title: string;
  subjectName: string;
  gradeLabel: string;
  level: EnglishLevel;
  durationMinutes: number;
  objectivesVi: string[];
  objectivesEn: string[];
  warmUpScriptEn: string;
  warmUpScriptVi: string;
  coverUrl: string;
}

export interface SpeakingPromptItem {
  id: string;
  title: string;
  context: string;
  targetLevel: EnglishLevel;
  durationSeconds: number;
  sampleAnswer: string;
  practicedCount: number;
}

export interface TeachingScenario {
  id: string;
  title: string;
  classroomSetting: string;
  objective: string;
  steps: string[];
  difficulty: 'Cơ bản' | 'Trung bình' | 'Nâng cao';
  completed: boolean;
}

export interface AssessmentItem {
  id: string;
  title: string;
  category: 'Ngôn ngữ lớp học' | 'Thuật ngữ môn học' | 'Phát âm' | 'Tổng hợp CEFR';
  questionCount: number;
  durationMinutes: number;
  bestScore: number | null;
  status: 'Chưa làm' | 'Đạt yêu cầu' | 'Cần cải thiện';
}

export interface LibraryResource {
  id: string;
  title: string;
  resourceType: 'Giáo án song ngữ' | 'Bộ thẻ từ vựng' | 'Mẫu câu lớp học' | 'Tài liệu tham khảo';
  subjectName: string;
  savedAt: string;
  sizeOrLength: string;
}

export interface AdminMemberRecord {
  id: string;
  fullName: string;
  email: string;
  department: string;
  level: EnglishLevel;
  completionRate: number;
  accountStatus: 'Đang hoạt động' | 'Chờ duyệt';
}
