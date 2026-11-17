import { ASSETS } from '@/src/config/curriculum';
import { AuthSession, TeacherPreferences, TeacherProfile, TeacherRole } from '@/src/types';
import { storage } from '@/src/utils/storage';

const AUTH_STORAGE_KEY = 'teacher_english_session_v1';
const PROFILE_STORAGE_KEY = 'teacher_english_profile_v1';

const DEFAULT_PROFILE: TeacherProfile = {
  id: 'gv-001',
  fullName: 'Nguyễn Minh Anh',
  email: 'minhanh.nguyen@thpt-lequydon.edu.vn',
  schoolName: 'Trường THPT Lê Quý Đôn',
  province: 'TP. Hồ Chí Minh',
  yearsOfExperience: 6,
  role: 'Giáo viên bộ môn',
  bio: 'Giáo viên Vật lý định hướng giảng dạy song ngữ cho khối lớp chuyên và lớp tích hợp.',
  avatarUrl: ASSETS.TEACHER_AVATAR,
  onboardingCompleted: true,
  preferences: {
    primarySubject: 'physics',
    secondarySubjects: ['math', 'science'],
    schoolStage: 'thpt',
    grades: [10, 11],
    currentLevel: 'B1',
    targetLevel: 'B2',
    weeklyMinutesTarget: 180,
  },
};

const DEFAULT_SESSION: AuthSession = {
  isAuthenticated: true,
  userId: DEFAULT_PROFILE.id,
  fullName: DEFAULT_PROFILE.fullName,
  email: DEFAULT_PROFILE.email,
  role: DEFAULT_PROFILE.role,
};

export const authService = {
  getSession(): AuthSession {
    return storage.get<AuthSession>(AUTH_STORAGE_KEY, DEFAULT_SESSION);
  },

  getProfile(): TeacherProfile {
    return storage.get<TeacherProfile>(PROFILE_STORAGE_KEY, DEFAULT_PROFILE);
  },

  login(email: string, _password: string): { session: AuthSession; profile: TeacherProfile } {
    const existingProfile = this.getProfile();
    const normalizedName =
      existingProfile.email.toLowerCase() === email.trim().toLowerCase()
        ? existingProfile.fullName
        : email.split('@')[0]?.replace(/[._-]/g, ' ') || 'Giáo viên mới';

    const titleCasedName = normalizedName
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    const nextProfile: TeacherProfile = {
      ...existingProfile,
      email: email.trim(),
      fullName:
        existingProfile.email.toLowerCase() === email.trim().toLowerCase()
          ? existingProfile.fullName
          : titleCasedName,
    };

    const nextSession: AuthSession = {
      isAuthenticated: true,
      userId: nextProfile.id,
      fullName: nextProfile.fullName,
      email: nextProfile.email,
      role: nextProfile.role,
    };

    storage.set(PROFILE_STORAGE_KEY, nextProfile);
    storage.set(AUTH_STORAGE_KEY, nextSession);
    return { session: nextSession, profile: nextProfile };
  },

  register(payload: {
    fullName: string;
    email: string;
    role: TeacherRole;
    schoolName: string;
  }): { session: AuthSession; profile: TeacherProfile } {
    const current = this.getProfile();
    const nextProfile: TeacherProfile = {
      ...current,
      id: `gv-${Date.now().toString().slice(-4)}`,
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      role: payload.role,
      schoolName: payload.schoolName.trim() || 'Chưa cập nhật đơn vị',
      onboardingCompleted: false,
    };

    const nextSession: AuthSession = {
      isAuthenticated: true,
      userId: nextProfile.id,
      fullName: nextProfile.fullName,
      email: nextProfile.email,
      role: nextProfile.role,
    };

    storage.set(PROFILE_STORAGE_KEY, nextProfile);
    storage.set(AUTH_STORAGE_KEY, nextSession);
    return { session: nextSession, profile: nextProfile };
  },

  updateProfile(partial: Partial<TeacherProfile>): TeacherProfile {
    const current = this.getProfile();
    const updated: TeacherProfile = {
      ...current,
      ...partial,
      onboardingCompleted: true,
    };
    storage.set(PROFILE_STORAGE_KEY, updated);

    const session = this.getSession();
    if (session.isAuthenticated) {
      storage.set(AUTH_STORAGE_KEY, {
        ...session,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
      });
    }
    return updated;
  },

  updatePreferences(preferences: TeacherPreferences): TeacherProfile {
    const current = this.getProfile();
    const updated: TeacherProfile = {
      ...current,
      preferences,
      onboardingCompleted: true,
    };
    storage.set(PROFILE_STORAGE_KEY, updated);
    return updated;
  },

  logout(): AuthSession {
    const loggedOut: AuthSession = {
      isAuthenticated: false,
      userId: '',
      fullName: 'Khách',
      email: '',
      role: 'Giáo viên bộ môn',
    };
    storage.set(AUTH_STORAGE_KEY, loggedOut);
    return loggedOut;
  },

  resetToDemo(): { session: AuthSession; profile: TeacherProfile } {
    storage.set(PROFILE_STORAGE_KEY, DEFAULT_PROFILE);
    storage.set(AUTH_STORAGE_KEY, DEFAULT_SESSION);
    return { session: DEFAULT_SESSION, profile: DEFAULT_PROFILE };
  },
};
