import type { User } from 'firebase/auth';
import { ASSETS } from '@/src/config/curriculum';
import { auth } from '@/src/config/firebase';
import { COLLECTIONS, firestoreService } from '@/src/services/firestoreService';
import {
  FirestoreUserProfile,
  SubjectId,
  SystemRole,
  TeacherPreferences,
  TeacherProfile,
  TeacherRole,
} from '@/src/types';

const DEFAULT_SUBJECTS: SubjectId[] = ['physics'];
const DEFAULT_GRADES: number[] = [10, 11];

export function mapFirestoreDocToTeacherProfile(
  docData: FirestoreUserProfile,
  claimsRole?: SystemRole
): TeacherProfile {
  const subjects =
    Array.isArray(docData.subjects) && docData.subjects.length > 0
      ? docData.subjects.slice(0, 10)
      : DEFAULT_SUBJECTS;

  const primarySubject =
    docData.primarySubject && subjects.includes(docData.primarySubject)
      ? docData.primarySubject
      : subjects[0];

  const secondarySubjects = subjects.filter((id) => id !== primarySubject);

  const grades =
    Array.isArray(docData.grades) && docData.grades.length > 0
      ? docData.grades.slice(0, 12)
      : DEFAULT_GRADES;

  const effectiveRole: SystemRole = claimsRole ?? docData.role ?? 'Teacher';

  return {
    id: docData.uid,
    fullName: docData.fullName || 'Giáo viên',
    email: docData.email || '',
    schoolName: docData.schoolName || 'Chưa cập nhật trường học',
    province: docData.province || 'TP. Hồ Chí Minh',
    yearsOfExperience: typeof docData.yearsOfExperience === 'number' ? docData.yearsOfExperience : 1,
    role: docData.teacherPosition || 'Giáo viên bộ môn',
    systemRole: effectiveRole,
    bio: docData.bio || '',
    avatarUrl: docData.avatarUrl || ASSETS.TEACHER_AVATAR,
    onboardingCompleted: Boolean(docData.onboardingCompleted),
    preferences: {
      primarySubject,
      secondarySubjects,
      schoolStage: docData.schoolStage || 'thpt',
      grades,
      currentLevel: docData.currentLevel || 'B1',
      targetLevel: docData.targetLevel || 'B2',
      weeklyMinutesTarget:
        typeof docData.weeklyMinutesTarget === 'number' ? docData.weeklyMinutesTarget : 180,
    },
  };
}

export const userService = {
  async fetchUserProfile(uid: string): Promise<FirestoreUserProfile | null> {
    return firestoreService.getDocument<FirestoreUserProfile>(COLLECTIONS.USERS, uid);
  },

  async createInitialProfile(
    user: User,
    extra?: {
      fullName?: string;
      schoolName?: string;
      teacherPosition?: TeacherRole;
    }
  ): Promise<FirestoreUserProfile> {
    const cleanName = (extra?.fullName || user.displayName || user.email?.split('@')[0] || 'Giáo viên')
      .trim()
      .slice(0, 120);

    const payload: Omit<FirestoreUserProfile, 'createdAt' | 'updatedAt'> = {
      uid: user.uid,
      fullName: cleanName,
      email: (user.email || '').trim().slice(0, 200),
      role: 'Teacher',
      teacherPosition: extra?.teacherPosition || 'Giáo viên bộ môn',
      schoolName: (extra?.schoolName || '').trim().slice(0, 200),
      province: 'TP. Hồ Chí Minh',
      yearsOfExperience: 1,
      bio: '',
      avatarUrl: (user.photoURL || ASSETS.TEACHER_AVATAR).slice(0, 500),
      primarySubject: 'physics',
      subjects: DEFAULT_SUBJECTS,
      schoolStage: 'thpt',
      grades: DEFAULT_GRADES,
      currentLevel: 'B1',
      targetLevel: 'B2',
      weeklyMinutesTarget: 180,
      onboardingCompleted: false,
    };

    await firestoreService.createDocument(COLLECTIONS.USERS, user.uid, payload);

    // Initialize owner-isolated supporting records
    await firestoreService.upsertDocument(COLLECTIONS.USER_LIBRARY, user.uid, {
      uid: user.uid,
      savedIds: [],
    });

    await firestoreService.upsertDocument(COLLECTIONS.LEARNING_RECORDS, user.uid, {
      uid: user.uid,
      goals: [],
      weeklyMinutes: 0,
      completedModules: 0,
      streakDays: 1,
    });

    const created = await this.fetchUserProfile(user.uid);
    return created ?? (payload as FirestoreUserProfile);
  },

  async ensureUserProfile(
    user: User,
    extra?: { fullName?: string; schoolName?: string; teacherPosition?: TeacherRole }
  ): Promise<FirestoreUserProfile> {
    const existing = await this.fetchUserProfile(user.uid);
    if (existing) return existing;
    return this.createInitialProfile(user, extra);
  },

  async updatePersonalProfile(
    uid: string,
    partial: {
      fullName: string;
      schoolName: string;
      province: string;
      yearsOfExperience: number;
      role: TeacherRole;
      bio: string;
    }
  ): Promise<void> {
    // Strictly omit role (RBAC), uid, email, and createdAt — enforced by Firestore rules
    await firestoreService.updateDocument(COLLECTIONS.USERS, uid, {
      fullName: partial.fullName.trim().slice(0, 120),
      schoolName: partial.schoolName.trim().slice(0, 200),
      province: partial.province.trim().slice(0, 100),
      yearsOfExperience: Math.max(0, Math.min(60, Number(partial.yearsOfExperience) || 0)),
      teacherPosition: partial.role,
      bio: partial.bio.trim().slice(0, 1000),
      onboardingCompleted: true,
    });
  },

  async updateLearningPreferences(
    uid: string,
    preferences: TeacherPreferences
  ): Promise<void> {
    const uniqueSubjects = Array.from(
      new Set([preferences.primarySubject, ...preferences.secondarySubjects])
    ).slice(0, 10);

    const uniqueGrades = Array.from(new Set(preferences.grades))
      .filter((g) => g >= 1 && g <= 12)
      .sort((a, b) => a - b)
      .slice(0, 12);

    await firestoreService.updateDocument(COLLECTIONS.USERS, uid, {
      primarySubject: preferences.primarySubject,
      subjects: uniqueSubjects.length > 0 ? uniqueSubjects : DEFAULT_SUBJECTS,
      schoolStage: preferences.schoolStage,
      grades: uniqueGrades.length > 0 ? uniqueGrades : DEFAULT_GRADES,
      currentLevel: preferences.currentLevel,
      targetLevel: preferences.targetLevel,
      weeklyMinutesTarget: Math.max(30, Math.min(2000, preferences.weeklyMinutesTarget || 180)),
      onboardingCompleted: true,
    });
  },

  async listUsersForAdmin(): Promise<FirestoreUserProfile[]> {
    return firestoreService.listCollection<FirestoreUserProfile>(COLLECTIONS.USERS);
  },

  async assignRoleViaBackend(
    targetUid: string,
    nextRole: SystemRole
  ): Promise<{ message: string; customClaimsApplied: boolean }> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Bạn cần đăng nhập để thực hiện thao tác quản trị.');
    }

    const idToken = await currentUser.getIdToken(true);
    const response = await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ targetUid, role: nextRole }),
    });

    const body = (await response.json()) as {
      error?: string;
      message?: string;
      customClaimsApplied?: boolean;
    };

    if (!response.ok) {
      throw new Error(body.error || 'Không thể cập nhật quyền người dùng.');
    }

    // Sync role field in Firestore users/{targetUid} as Admin
    await firestoreService.updateDocument(COLLECTIONS.USERS, targetUid, {
      role: nextRole,
    });

    return {
      message: body.message || 'Đã cập nhật phân quyền thành công.',
      customClaimsApplied: Boolean(body.customClaimsApplied),
    };
  },
};
