import { EnglishLevel, SchoolStage, SubjectId, TeacherRole } from '@/src/types';

export const ASSETS = {
  TEACHER_AVATAR: '/src/assets/images/teacher_avatar_1794884830938.jpg',
  CLASSROOM_COVER: '/src/assets/images/lesson_classroom_cover_1794884830932.jpg',
  SCIENCE_COVER: '/src/assets/images/lesson_science_cover_1794884831824.jpg',
} as const;

export interface SubjectOption {
  id: SubjectId;
  name: string;
  englishName: string;
  group: 'Khoa học tự nhiên' | 'Khoa học xã hội & Ngôn ngữ' | 'Công nghệ & Khác';
}

export const SUBJECT_OPTIONS: SubjectOption[] = [
  { id: 'math', name: 'Toán học', englishName: 'Mathematics', group: 'Khoa học tự nhiên' },
  { id: 'physics', name: 'Vật lý', englishName: 'Physics', group: 'Khoa học tự nhiên' },
  { id: 'chemistry', name: 'Hóa học', englishName: 'Chemistry', group: 'Khoa học tự nhiên' },
  { id: 'biology', name: 'Sinh học', englishName: 'Biology', group: 'Khoa học tự nhiên' },
  { id: 'science', name: 'Khoa học tự nhiên', englishName: 'Natural Science', group: 'Khoa học tự nhiên' },
  { id: 'informatics', name: 'Tin học', englishName: 'Informatics & CS', group: 'Công nghệ & Khác' },
  { id: 'history_geo', name: 'Lịch sử & Địa lý', englishName: 'History & Geography', group: 'Khoa học xã hội & Ngôn ngữ' },
  { id: 'literature', name: 'Ngữ văn', englishName: 'Literature', group: 'Khoa học xã hội & Ngôn ngữ' },
  { id: 'english', name: 'Tiếng Anh', englishName: 'English Language', group: 'Khoa học xã hội & Ngôn ngữ' },
  { id: 'civics', name: 'Giáo dục công dân', englishName: 'Civic Education', group: 'Khoa học xã hội & Ngôn ngữ' },
];

export interface SchoolStageOption {
  id: SchoolStage;
  label: string;
  description: string;
  grades: number[];
}

export const SCHOOL_STAGE_OPTIONS: SchoolStageOption[] = [
  {
    id: 'tieuhoc',
    label: 'Tiểu học',
    description: 'Lớp 1 đến Lớp 5 · Giao tiếp lớp học trực quan, ngắn gọn',
    grades: [1, 2, 3, 4, 5],
  },
  {
    id: 'thcs',
    label: 'Trung học cơ sở (THCS)',
    description: 'Lớp 6 đến Lớp 9 · Kết hợp thuật ngữ nền tảng và điều phối hoạt động',
    grades: [6, 7, 8, 9],
  },
  {
    id: 'thpt',
    label: 'Trung học phổ thông (THPT)',
    description: 'Lớp 10 đến Lớp 12 · Thuật ngữ học thuật chuyên sâu và thảo luận phản biện',
    grades: [10, 11, 12],
  },
];

export interface EnglishLevelOption {
  code: EnglishLevel;
  title: string;
  summary: string;
}

export const ENGLISH_LEVEL_OPTIONS: EnglishLevelOption[] = [
  {
    code: 'A1',
    title: 'Sơ cấp (A1)',
    summary: 'Sử dụng được câu chào hỏi, chỉ dẫn lớp học đơn giản và từ vựng quen thuộc.',
  },
  {
    code: 'A2',
    title: 'Cơ bản (A2)',
    summary: 'Giao tiếp các tình huống lớp học thường ngày và mô tả khái niệm ngắn gọn.',
  },
  {
    code: 'B1',
    title: 'Trung cấp (B1)',
    summary: 'Giảng giải được các bước giải bài tập và tương tác hai chiều với học sinh.',
  },
  {
    code: 'B2',
    title: 'Trung cao cấp (B2)',
    summary: 'Giảng dạy trôi chảy hầu hết nội dung chuyên môn bằng tiếng Anh song ngữ.',
  },
  {
    code: 'C1',
    title: 'Cao cấp (C1)',
    summary: 'Điều phối tranh luận học thuật sâu và giảng dạy hoàn toàn bằng tiếng Anh.',
  },
  {
    code: 'C2',
    title: 'Thành thạo (C2)',
    summary: 'Làm chủ ngôn ngữ học thuật chuẩn xác, tinh tế như giáo viên bản ngữ.',
  },
];

export const TEACHER_ROLES: TeacherRole[] = [
  'Giáo viên bộ môn',
  'Giáo viên tiếng Anh',
  'Tổ trưởng chuyên môn',
  'Ban giám hiệu',
];

export const VIETNAM_PROVINCES: string[] = [
  'TP. Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Huế',
  'Bình Dương',
  'Đồng Nai',
  'Nghệ An',
  'Khánh Hòa',
  'Lâm Đồng',
  'Quảng Ninh',
];
