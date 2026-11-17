import { ASSETS } from '@/src/config/curriculum';
import { ROUTES } from '@/src/config/navigation';
import {
  AdminMemberRecord,
  AssessmentItem,
  BilingualLessonPlan,
  ClassroomPhrase,
  LearningGoal,
  LibraryResource,
  ProgressStat,
  RecentLesson,
  RoadmapModule,
  SpeakingPromptItem,
  SubjectTerm,
  TeachingScenario,
} from '@/src/types';
import { storage } from '@/src/utils/storage';

const GOALS_STORAGE_KEY = 'teacher_english_goals_v1';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const INITIAL_GOALS: LearningGoal[] = [
  {
    id: 'goal-1',
    title: 'Hoàn thành 180 phút luyện tập tiếng Anh trong tuần',
    category: 'Thời lượng tuần',
    currentValue: 135,
    targetValue: 180,
    unit: 'phút',
    dueLabel: 'Chủ nhật tuần này',
    completed: false,
  },
  {
    id: 'goal-2',
    title: 'Thuộc 25 mẫu câu điều hành lớp học chủ động',
    category: 'English Classroom',
    currentValue: 25,
    targetValue: 25,
    unit: 'mẫu câu',
    dueLabel: 'Đã đạt mục tiêu',
    completed: true,
  },
  {
    id: 'goal-3',
    title: 'Hoàn thành 2 kịch bản giảng thử song ngữ khối 10',
    category: 'Thực hành giảng dạy',
    currentValue: 1,
    targetValue: 2,
    unit: 'kịch bản',
    dueLabel: 'Còn 3 ngày',
    completed: false,
  },
];

export interface DashboardBundle {
  stats: ProgressStat[];
  recentLessons: RecentLesson[];
  goals: LearningGoal[];
}

export const teacherService = {
  async fetchDashboardData(): Promise<DashboardBundle> {
    await wait(260);
    const goals = storage.get<LearningGoal[]>(GOALS_STORAGE_KEY, INITIAL_GOALS);

    const stats: ProgressStat[] = [
      {
        id: 'stat-roadmap',
        label: 'Tiến độ lộ trình B1 → B2',
        value: '64%',
        sublabel: '16 / 25 chuyên đề đã hoàn thành',
        progressPercent: 64,
        trendText: '+8% so với tuần trước',
      },
      {
        id: 'stat-weekly-time',
        label: 'Thời lượng học tuần này',
        value: '135 phút',
        sublabel: 'Mục tiêu: 180 phút / tuần',
        progressPercent: 75,
        trendText: 'Còn 45 phút để đạt chỉ tiêu',
      },
      {
        id: 'stat-classroom-phrases',
        label: 'Mẫu câu & thuật ngữ đã lưu',
        value: '84 mục',
        sublabel: '52 mẫu câu lớp học · 32 thuật ngữ',
        trendText: 'Môn Vật lý · Khối THPT',
      },
      {
        id: 'stat-speaking-streak',
        label: 'Chuỗi ngày rèn luyện đều đặn',
        value: '9 ngày',
        sublabel: 'Luyện nói & phản xạ sư phạm',
        trendText: 'Kỷ lục cá nhân: 14 ngày',
      },
    ];

    const recentLessons: RecentLesson[] = [
      {
        id: 'lesson-1',
        title: 'Điều phối hoạt động nhóm và kiểm tra hiểu bài',
        moduleName: 'English Classroom',
        subjectLabel: 'Kỹ năng đứng lớp',
        durationMinutes: 20,
        progressPercent: 100,
        status: 'completed',
        lastAccessedAt: 'Hôm nay, 08:30',
        coverUrl: ASSETS.CLASSROOM_COVER,
        routePath: ROUTES.ENGLISH_CLASSROOM,
      },
      {
        id: 'lesson-2',
        title: 'Động lực học chất điểm & Định luật Newton bằng tiếng Anh',
        moduleName: 'Subject English',
        subjectLabel: 'Vật lý · Lớp 10',
        durationMinutes: 35,
        progressPercent: 70,
        status: 'in_progress',
        lastAccessedAt: 'Hôm qua, 20:15',
        coverUrl: ASSETS.SCIENCE_COVER,
        routePath: ROUTES.SUBJECT_ENGLISH,
      },
      {
        id: 'lesson-3',
        title: 'Giáo án song ngữ: Định luật bảo toàn cơ năng',
        moduleName: 'Bài học song ngữ',
        subjectLabel: 'Vật lý · Lớp 10',
        durationMinutes: 45,
        progressPercent: 45,
        status: 'in_progress',
        lastAccessedAt: '2 ngày trước',
        coverUrl: ASSETS.CLASSROOM_COVER,
        routePath: ROUTES.BILINGUAL_LESSONS,
      },
      {
        id: 'lesson-4',
        title: 'Luyện ngữ điệu khi đặt câu hỏi gợi mở cho học sinh',
        moduleName: 'Luyện nói',
        subjectLabel: 'Phát âm sư phạm',
        durationMinutes: 15,
        progressPercent: 0,
        status: 'not_started',
        lastAccessedAt: 'Chưa bắt đầu',
        coverUrl: ASSETS.SCIENCE_COVER,
        routePath: ROUTES.SPEAKING,
      },
    ];

    return { stats, recentLessons, goals };
  },

  saveGoals(goals: LearningGoal[]): void {
    storage.set(GOALS_STORAGE_KEY, goals);
  },

  resetDemoGoals(): LearningGoal[] {
    storage.set(GOALS_STORAGE_KEY, INITIAL_GOALS);
    return INITIAL_GOALS;
  },

  async fetchRoadmapModules(): Promise<RoadmapModule[]> {
    await wait(220);
    return [
      {
        id: 'mod-1',
        order: 1,
        title: 'Ngôn ngữ khởi động tiết học & ổn định lớp',
        cefrBand: 'A2 – B1',
        lessonCount: 6,
        completedLessons: 6,
        estimatedHours: 4,
        status: 'completed',
        summary: 'Làm chủ lời chào, điểm danh, chuyển tiếp hoạt động và thiết lập nội quy lớp học tự nhiên.',
      },
      {
        id: 'mod-2',
        order: 2,
        title: 'Hướng dẫn nhiệm vụ học tập & chia nhóm hiệu quả',
        cefrBand: 'B1',
        lessonCount: 6,
        completedLessons: 5,
        estimatedHours: 5,
        status: 'in_progress',
        summary: 'Diễn đạt yêu cầu bài tập rõ ràng, kiểm tra mức độ hiểu đề (ICQs) và quản lý thời gian nhóm.',
      },
      {
        id: 'mod-3',
        order: 3,
        title: 'Hệ thống thuật ngữ môn học cốt lõi theo chương trình GDPT',
        cefrBand: 'B1 – B2',
        lessonCount: 8,
        completedLessons: 5,
        estimatedHours: 7,
        status: 'in_progress',
        summary: 'Phát âm chuẩn và giải thích khái niệm chuyên ngành bằng câu tiếng Anh dễ hiểu cho học sinh Việt Nam.',
      },
      {
        id: 'mod-4',
        order: 4,
        title: 'Đặt câu hỏi gợi mở, phản hồi và nhận xét bài làm',
        cefrBand: 'B2',
        lessonCount: 5,
        completedLessons: 0,
        estimatedHours: 4.5,
        status: 'not_started',
        summary: 'Khuyến khích học sinh phát biểu, sửa lỗi khéo léo và tổng kết trọng tâm cuối tiết học.',
      },
    ];
  },

  async fetchClassroomPhrases(): Promise<ClassroomPhrase[]> {
    await wait(200);
    return [
      {
        id: 'phr-1',
        situation: 'Mở đầu tiết học',
        english: "Good morning, everyone. Let's quickly recap what we covered last time before starting today's topic.",
        vietnamese: 'Chào cả lớp. Chúng ta hãy ôn nhanh nội dung buổi trước trước khi bắt đầu chủ đề hôm nay nhé.',
        pronunciation: '/ɡʊd ˈmɔːrnɪŋ ˈevriwʌn | lets ˈkwɪkli ˈriːkæp.../',
        note: 'Dùng trong 2 phút đầu giờ để kết nối kiến thức cũ.',
        bookmarked: true,
      },
      {
        id: 'phr-2',
        situation: 'Giao nhiệm vụ',
        english: 'Work in pairs for five minutes and compare your solutions on the worksheet.',
        vietnamese: 'Các em làm việc theo cặp trong 5 phút và đối chiếu lời giải trên phiếu học tập nhé.',
        pronunciation: '/wɜːrk ɪn peərz fɔːr faɪv ˈmɪnɪts.../',
        note: 'Nhấn mạnh thời lượng và sản phẩm cần hoàn thành.',
        bookmarked: true,
      },
      {
        id: 'phr-3',
        situation: 'Quản lý lớp',
        english: 'Eyes up here, please. Let’s pause for a moment and check step two together.',
        vietnamese: 'Cả lớp hướng mắt lên bảng giúp cô/thầy nhé. Mình dừng lại một chút để kiểm tra bước hai cùng nhau.',
        pronunciation: '/aɪz ʌp hɪər pliːz.../',
        note: 'Giữ giọng bình tĩnh, rõ ràng khi thu hút lại sự chú ý.',
        bookmarked: false,
      },
      {
        id: 'phr-4',
        situation: 'Khen ngợi & Phản hồi',
        english: "That's a thoughtful observation. Can you explain how you arrived at that formula?",
        vietnamese: 'Nhận xét rất sâu sắc. Em có thể giải thích cách em suy ra công thức đó không?',
        pronunciation: '/ðæts ə ˈθɔːtfəl ˌɑːbzərˈveɪʃən.../',
        note: 'Khuyến khích học sinh trình bày lập luận thay vì chỉ nêu đáp án.',
        bookmarked: false,
      },
      {
        id: 'phr-5',
        situation: 'Kết thúc bài',
        english: 'Before the bell rings, write down one key takeaway from today’s experiment.',
        vietnamese: 'Trước khi hết giờ, các em hãy ghi lại một ý cốt lõi rút ra từ thí nghiệm hôm nay.',
        pronunciation: '/bɪˈfɔːr ðə bel rɪŋz.../',
        note: 'Phù hợp cho hoạt động tổng kết 3 phút cuối tiết.',
        bookmarked: true,
      },
    ];
  },

  async fetchSubjectTerms(): Promise<SubjectTerm[]> {
    await wait(200);
    return [
      {
        id: 'term-1',
        subjectId: 'physics',
        subjectName: 'Vật lý',
        termEn: 'Gravitational potential energy',
        termVi: 'Thế năng trọng trường',
        phonetic: '/ˌɡrævɪˈteɪʃənl pəˈtenʃl ˈenərdʒi/',
        classroomExample: 'When an object is lifted higher, its gravitational potential energy increases.',
        gradeTag: 'Lớp 10',
      },
      {
        id: 'term-2',
        subjectId: 'math',
        subjectName: 'Toán học',
        termEn: 'Quadratic equation',
        termVi: 'Phương trình bậc hai',
        phonetic: '/kwɑːˈdrætɪk ɪˈkweɪʒn/',
        classroomExample: 'Let’s identify the coefficients a, b, and c of this quadratic equation.',
        gradeTag: 'Lớp 9 – 10',
      },
      {
        id: 'term-3',
        subjectId: 'chemistry',
        subjectName: 'Hóa học',
        termEn: 'Chemical equilibrium',
        termVi: 'Cân bằng hóa học',
        phonetic: '/ˈkemɪkl ˌiːkwɪˈlɪbriəm/',
        classroomExample: 'At chemical equilibrium, the forward and reverse reaction rates are equal.',
        gradeTag: 'Lớp 11',
      },
      {
        id: 'term-4',
        subjectId: 'biology',
        subjectName: 'Sinh học',
        termEn: 'Cellular respiration',
        termVi: 'Hô hấp tế bào',
        phonetic: '/ˈseljələr ˌrespəˈreɪʃn/',
        classroomExample: 'Cellular respiration releases energy in the form of ATP for cell activities.',
        gradeTag: 'Lớp 10',
      },
      {
        id: 'term-5',
        subjectId: 'informatics',
        subjectName: 'Tin học',
        termEn: 'Conditional statement',
        termVi: 'Câu lệnh điều kiện',
        phonetic: '/kənˈdɪʃənl ˈsteɪtmənt/',
        classroomExample: 'Use a conditional statement to check whether the input score is valid.',
        gradeTag: 'Lớp 8 – 10',
      },
    ];
  },

  async fetchBilingualLessons(): Promise<BilingualLessonPlan[]> {
    await wait(220);
    return [
      {
        id: 'bi-1',
        title: 'Định luật bảo toàn cơ năng (Conservation of Mechanical Energy)',
        subjectName: 'Vật lý',
        gradeLabel: 'Lớp 10',
        level: 'B1',
        durationMinutes: 45,
        objectivesVi: [
          'Phát biểu được định nghĩa cơ năng và định luật bảo toàn cơ năng.',
          'Vận dụng công thức tính động năng, thế năng trong bài toán con lắc đơn.',
        ],
        objectivesEn: [
          'State the definition of mechanical energy and its conservation principle.',
          'Apply kinetic and potential energy formulas to simple pendulum problems.',
        ],
        warmUpScriptEn:
          'Imagine a roller coaster at the top of the first hill. Does it move fast or slow there? Why does it speed up as it goes down?',
        warmUpScriptVi:
          'Hãy tưởng tượng một tàu lượn siêu tốc ở đỉnh dốc đầu tiên. Ở đó tàu chuyển động nhanh hay chậm? Vì sao tàu tăng tốc khi lao xuống dốc?',
        coverUrl: ASSETS.SCIENCE_COVER,
      },
      {
        id: 'bi-2',
        title: 'Hàm số bậc hai và đồ thị Parabol (Quadratic Functions)',
        subjectName: 'Toán học',
        gradeLabel: 'Lớp 10',
        level: 'B1',
        durationMinutes: 45,
        objectivesVi: [
          'Xác định tọa độ đỉnh và trục đối xứng của đồ thị hàm số bậc hai.',
          'Mô tả được chiều biến thiên của đồ thị bằng tiếng Anh cơ bản.',
        ],
        objectivesEn: [
          'Determine the vertex coordinates and axis of symmetry of a parabola.',
          'Describe increasing and decreasing intervals using clear classroom English.',
        ],
        warmUpScriptEn:
          'Look at the path of a basketball thrown toward the hoop. What geometric shape does the ball trace in the air?',
        warmUpScriptVi:
          'Hãy quan sát quỹ đạo quả bóng rổ khi ném về phía rổ. Quả bóng tạo thành đường cong hình học nào trong không trung?',
        coverUrl: ASSETS.CLASSROOM_COVER,
      },
    ];
  },

  async fetchSpeakingPrompts(): Promise<SpeakingPromptItem[]> {
    await wait(180);
    return [
      {
        id: 'spk-1',
        title: 'Giới thiệu mục tiêu tiết học trong 45 giây',
        context: 'Đầu tiết học · Khởi động trước bảng',
        targetLevel: 'B1',
        durationSeconds: 45,
        sampleAnswer:
          'Today we are going to explore how energy transforms from potential to kinetic energy. By the end of this lesson, you will be able to solve two practical motion problems in English.',
        practicedCount: 4,
      },
      {
        id: 'spk-2',
        title: 'Giải thích một lỗi sai phổ biến của học sinh',
        context: 'Chữa bài tập trên lớp · Phản hồi tích cực',
        targetLevel: 'B2',
        durationSeconds: 60,
        sampleAnswer:
          'Many students forget to convert centimeters into meters before substituting values into the formula. Always check your SI units first.',
        practicedCount: 2,
      },
      {
        id: 'spk-3',
        title: 'Hướng dẫn thảo luận nhóm theo cặp đôi',
        context: 'Hoạt động tương tác giữa giờ',
        targetLevel: 'A2',
        durationSeconds: 30,
        sampleAnswer:
          'Turn to your partner. Student A will read the graph, and Student B will write down two observations. You have three minutes.',
        practicedCount: 5,
      },
    ];
  },

  async fetchTeachingScenarios(): Promise<TeachingScenario[]> {
    await wait(200);
    return [
      {
        id: 'scen-1',
        title: 'Tình huống 1: Lớp ồn khi chuyển từ giảng lý thuyết sang làm nhóm',
        classroomSetting: 'Lớp 10A2 · 40 học sinh · Tiết 3 buổi sáng',
        objective: 'Thu hút lại sự chú ý bằng khẩu lệnh tiếng Anh ngắn gọn, thân thiện và giao việc rõ ràng.',
        steps: [
          'Dùng tín hiệu dừng hoạt động (Attention getter) trong 5 giây.',
          'Kiểm tra xem học sinh đã nắm rõ 2 yêu cầu chính của phiếu bài tập chưa.',
          'Đặt đồng hồ đếm ngược và phân công vai trò trưởng nhóm.',
        ],
        difficulty: 'Cơ bản',
        completed: true,
      },
      {
        id: 'scen-2',
        title: 'Tình huống 2: Học sinh e ngại không dám trả lời bằng tiếng Anh',
        classroomSetting: 'Lớp 11B1 · Tiết học song ngữ đầu tiên',
        objective: 'Tạo tâm lý an toàn, gợi mở bằng câu hỏi lựa chọn (scaffolding questions) và khen ngợi kịp thời.',
        steps: [
          'Chuyển từ câu hỏi mở sang câu hỏi gợi ý hai phương án.',
          'Cho phép học sinh nói thuật ngữ chính bằng tiếng Anh kết hợp giải thích ngắn.',
          'Ghi nhận nỗ lực và chuẩn hóa lại câu diễn đạt trọn vẹn.',
        ],
        difficulty: 'Trung bình',
        completed: false,
      },
    ];
  },

  async fetchAssessments(): Promise<AssessmentItem[]> {
    await wait(200);
    return [
      {
        id: 'quiz-1',
        title: 'Đánh giá năng lực ngôn ngữ điều hành lớp học (Phần 1)',
        category: 'Ngôn ngữ lớp học',
        questionCount: 15,
        durationMinutes: 15,
        bestScore: 87,
        status: 'Đạt yêu cầu',
      },
      {
        id: 'quiz-2',
        title: 'Kiểm tra thuật ngữ chuyên môn Vật lý & Khoa học tự nhiên',
        category: 'Thuật ngữ môn học',
        questionCount: 20,
        durationMinutes: 20,
        bestScore: 72,
        status: 'Cần cải thiện',
      },
      {
        id: 'quiz-3',
        title: 'Bài kiểm tra phân loại trình độ CEFR đầu vào cho giáo viên',
        category: 'Tổng hợp CEFR',
        questionCount: 30,
        durationMinutes: 35,
        bestScore: null,
        status: 'Chưa làm',
      },
    ];
  },

  async fetchLibraryResources(): Promise<LibraryResource[]> {
    await wait(200);
    return [
      {
        id: 'lib-1',
        title: 'Bộ 50 câu điều hành lớp học song ngữ (In nhanh cho giáo viên)',
        resourceType: 'Mẫu câu lớp học',
        subjectName: 'Dùng chung mọi môn',
        savedAt: 'Hôm nay',
        sizeOrLength: '50 mẫu câu',
      },
      {
        id: 'lib-2',
        title: 'Giáo án mẫu: Newton’s Laws of Motion (Lớp 10)',
        resourceType: 'Giáo án song ngữ',
        subjectName: 'Vật lý',
        savedAt: '2 ngày trước',
        sizeOrLength: '12 trang',
      },
      {
        id: 'lib-3',
        title: 'Bảng từ vựng cốt lõi Toán học & Hình học THCS - THPT',
        resourceType: 'Bộ thẻ từ vựng',
        subjectName: 'Toán học',
        savedAt: '5 ngày trước',
        sizeOrLength: '120 thuật ngữ',
      },
    ];
  },

  async fetchAdminMembers(): Promise<AdminMemberRecord[]> {
    await wait(220);
    return [
      {
        id: 'mem-1',
        fullName: 'Nguyễn Minh Anh',
        email: 'minhanh.nguyen@thpt-lequydon.edu.vn',
        department: 'Tổ Vật lý – Công nghệ',
        level: 'B1',
        completionRate: 64,
        accountStatus: 'Đang hoạt động',
      },
      {
        id: 'mem-2',
        fullName: 'Trần Quốc Bảo',
        email: 'quocbao.tran@thpt-lequydon.edu.vn',
        department: 'Tổ Toán học',
        level: 'B2',
        completionRate: 82,
        accountStatus: 'Đang hoạt động',
      },
      {
        id: 'mem-3',
        fullName: 'Lê Thị Thu Hà',
        email: 'thuha.le@thpt-lequydon.edu.vn',
        department: 'Tổ Hóa – Sinh',
        level: 'A2',
        completionRate: 41,
        accountStatus: 'Đang hoạt động',
      },
      {
        id: 'mem-4',
        fullName: 'Phạm Hoàng Nam',
        email: 'hoangnam.pham@thpt-lequydon.edu.vn',
        department: 'Tổ Tin học',
        level: 'B1',
        completionRate: 15,
        accountStatus: 'Chờ duyệt',
      },
    ];
  },
};
