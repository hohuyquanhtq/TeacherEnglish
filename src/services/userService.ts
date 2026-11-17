import type { User } from 'firebase/auth';
import { ASSETS } from '@/src/config/curriculum';
import { auth } from '@/src/config/firebase';
import { COLLECTIONS, firestoreService } from '@/src/services/firestoreService';
import {
  AccountStatus,
  AdminAuditLog,
  AdminDashboardStats,
  AdminUserListItem,
  EducationLevel,
  FirestoreUserProfile,
  SubjectId,
  SystemRole,
  TeacherPreferences,
  TeacherProfile,
  TeacherRole,
  normalizeAccountStatus,
  normalizeSystemRole,
} from '@/src/types';

const DEFAULT_SUBJECTS: SubjectId[] = ['physics'];
const DEFAULT_GRADES: number[] = [10, 11];

function toIsoString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

export function mapFirestoreDocToTeacherProfile(
  docData: FirestoreUserProfile,
  claimsRole?: SystemRole | null
): TeacherProfile {
  const subjects =
    Array.isArray(docData.subjects) && docData.subjects.length > 0
      ? docData.subjects.slice(0, 10)
      : docData.subject
      ? [docData.subject]
      : DEFAULT_SUBJECTS;

  const primarySubject =
    docData.primarySubject && subjects.includes(docData.primarySubject)
      ? docData.primarySubject
      : docData.subject && subjects.includes(docData.subject)
      ? docData.subject
      : subjects[0];

  const secondarySubjects = subjects.filter((id) => id !== primarySubject);

  const grades =
    Array.isArray(docData.grades) && docData.grades.length > 0
      ? docData.grades.slice(0, 12)
      : DEFAULT_GRADES;

  const effectiveRole: SystemRole = claimsRole ?? normalizeSystemRole(docData.role);
  const status: AccountStatus = docData.status
    ? normalizeAccountStatus(docData.status)
    : 'pending';

  const schoolValue = docData.school || docData.schoolName || 'Chưa cập nhật trường học';

  return {
    id: docData.uid,
    fullName: docData.fullName || 'Giáo viên',
    email: docData.email || '',
    schoolName: schoolValue,
    school: schoolValue,
    educationLevel:
      docData.educationLevel || (docData.schoolStage === 'thcs' ? 'THCS' : 'THPT'),
    subject: docData.subject || primarySubject,
    phone: docData.phone || '',
    province: docData.province || 'TP. Hồ Chí Minh',
    yearsOfExperience:
      typeof docData.yearsOfExperience === 'number' ? docData.yearsOfExperience : 1,
    role: docData.teacherPosition || 'Giáo viên bộ môn',
    systemRole: effectiveRole,
    status,
    approvedAt: toIsoString(docData.approvedAt),
    approvedBy: docData.approvedBy || null,
    rejectedAt: toIsoString(docData.rejectedAt),
    rejectedBy: docData.rejectedBy || null,
    rejectionReason: docData.rejectionReason || null,
    suspendedAt: toIsoString(docData.suspendedAt),
    suspendedBy: docData.suspendedBy || null,
    suspendedReason: docData.suspendedReason || null,
    lastLoginAt: toIsoString(docData.lastLoginAt),
    bio: docData.bio || '',
    avatarUrl: docData.avatarUrl || ASSETS.TEACHER_AVATAR,
    onboardingCompleted: Boolean(docData.onboardingCompleted),
    preferences: {
      primarySubject,
      secondarySubjects,
      schoolStage: docData.schoolStage || (docData.educationLevel === 'THCS' ? 'thcs' : 'thpt'),
      grades,
      currentLevel: docData.currentLevel || 'B1',
      targetLevel: docData.targetLevel || 'B2',
      weeklyMinutesTarget:
        typeof docData.weeklyMinutesTarget === 'number' ? docData.weeklyMinutesTarget : 180,
    },
  };
}

async function getVerifiedAdminHeaders(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Bạn cần đăng nhập để thực hiện thao tác này.');
  }
  const idToken = await currentUser.getIdToken(true);
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${idToken}`,
  };
}

async function parseJsonResponse<T>(res: Response, fallbackError: string): Promise<T> {
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    body = {};
  }

  if (!res.ok) {
    throw new Error(
      typeof body.error === 'string' && body.error ? body.error : fallbackError
    );
  }
  return body as T;
}

export interface RegisterProfileInput {
  fullName: string;
  school: string;
  educationLevel: EducationLevel;
  subject: SubjectId;
  province: string;
  phone?: string;
}

export const userService = {
  async fetchUserProfile(uid: string): Promise<FirestoreUserProfile | null> {
    return firestoreService.getDocument<FirestoreUserProfile>(COLLECTIONS.USERS, uid);
  },

  async registerPendingProfileViaBackend(
    user: User,
    input: RegisterProfileInput
  ): Promise<FirestoreUserProfile> {
    const idToken = await user.getIdToken();
    const res = await fetch('/api/auth/register-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        fullName: input.fullName,
        school: input.school,
        educationLevel: input.educationLevel,
        subject: input.subject,
        province: input.province,
        phone: input.phone || '',
      }),
    });

    const data = await parseJsonResponse<{
      ok: boolean;
      profileWrittenByBackend?: boolean;
    }>(res, 'Không thể khởi tạo hồ sơ tài khoản chờ phê duyệt.');

    if (!data.profileWrittenByBackend) {
      // Fallback strictly locked by firestore.rules: role='teacher', status='pending'
      const existing = await this.fetchUserProfile(user.uid);
      if (!existing) {
        const cleanName = input.fullName.trim().slice(0, 120) || 'Giáo viên';
        const cleanSchool = input.school.trim().slice(0, 200) || 'Chưa cập nhật trường';
        const schoolStage = input.educationLevel === 'THCS' ? 'thcs' : 'thpt';
        const defaultGrades = input.educationLevel === 'THCS' ? [6, 7, 8, 9] : [10, 11, 12];

        await firestoreService.createDocument(COLLECTIONS.USERS, user.uid, {
          uid: user.uid,
          fullName: cleanName,
          email: (user.email || '').trim().slice(0, 200),
          role: 'teacher',
          status: 'pending',
          teacherPosition: 'Giáo viên bộ môn',
          school: cleanSchool,
          schoolName: cleanSchool,
          educationLevel: input.educationLevel,
          subject: input.subject,
          primarySubject: input.subject,
          subjects: [input.subject],
          schoolStage,
          grades: defaultGrades,
          province: input.province.trim().slice(0, 100) || 'TP. Hồ Chí Minh',
          phone: (input.phone || '').trim().slice(0, 30),
          yearsOfExperience: 1,
          bio: '',
          avatarUrl: (user.photoURL || ASSETS.TEACHER_AVATAR).slice(0, 500),
          currentLevel: 'B1',
          targetLevel: 'B2',
          weeklyMinutesTarget: 180,
          onboardingCompleted: false,
        });
      }
    }

    const fetched = await this.fetchUserProfile(user.uid);
    if (fetched) return fetched;

    return {
      uid: user.uid,
      fullName: input.fullName,
      email: user.email || '',
      role: 'teacher',
      status: 'pending',
      school: input.school,
      schoolName: input.school,
      educationLevel: input.educationLevel,
      subject: input.subject,
      subjects: [input.subject],
      grades: input.educationLevel === 'THCS' ? [6, 7, 8, 9] : [10, 11, 12],
      province: input.province,
      phone: input.phone || '',
      currentLevel: 'B1',
      targetLevel: 'B2',
    };
  },

  async ensureUserProfile(user: User): Promise<FirestoreUserProfile> {
    const existing = await this.fetchUserProfile(user.uid);
    if (existing) return existing;

    return this.registerPendingProfileViaBackend(user, {
      fullName:
        user.displayName || user.email?.split('@')[0] || 'Giáo viên mới',
      school: 'Chưa cập nhật trường công tác',
      educationLevel: 'THPT',
      subject: 'english',
      province: 'TP. Hồ Chí Minh',
      phone: '',
    });
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
      phone?: string;
    }
  ): Promise<void> {
    const cleanSchool = partial.schoolName.trim().slice(0, 200);
    // Strictly omit role (RBAC), status, uid, email, and audit fields — enforced by Firestore rules
    await firestoreService.updateDocument(COLLECTIONS.USERS, uid, {
      fullName: partial.fullName.trim().slice(0, 120),
      schoolName: cleanSchool,
      school: cleanSchool,
      province: partial.province.trim().slice(0, 100),
      phone: (partial.phone || '').trim().slice(0, 30),
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
      subject: preferences.primarySubject,
      primarySubject: preferences.primarySubject,
      subjects: uniqueSubjects.length > 0 ? uniqueSubjects : DEFAULT_SUBJECTS,
      schoolStage: preferences.schoolStage,
      educationLevel: preferences.schoolStage === 'thcs' ? 'THCS' : 'THPT',
      grades: uniqueGrades.length > 0 ? uniqueGrades : DEFAULT_GRADES,
      currentLevel: preferences.currentLevel,
      targetLevel: preferences.targetLevel,
      weeklyMinutesTarget: Math.max(30, Math.min(2000, preferences.weeklyMinutesTarget || 180)),
      onboardingCompleted: true,
    });
  },

  // ---------------------------------------------------------------------------
  // Admin Backend API Methods (All strictly verify Admin Custom Claims)
  // ---------------------------------------------------------------------------
  async fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
    const headers = await getVerifiedAdminHeaders();
    const res = await fetch('/api/admin/stats', { headers });
    return parseJsonResponse<AdminDashboardStats>(
      res,
      'Không thể tải số liệu thống kê quản trị.'
    );
  },

  async fetchAdminUsers(params?: {
    status?: string;
    role?: string;
    search?: string;
  }): Promise<AdminUserListItem[]> {
    const headers = await getVerifiedAdminHeaders();
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.role && params.role !== 'all') query.set('role', params.role);
    if (params?.search?.trim()) query.set('search', params.search.trim());

    const qs = query.toString();
    const res = await fetch(`/api/admin/users${qs ? `?${qs}` : ''}`, { headers });
    const data = await parseJsonResponse<{ users: AdminUserListItem[] }>(
      res,
      'Không thể tải danh sách tài khoản.'
    );
    return data.users || [];
  },

  async approveTeacher(
    targetUid: string,
    targetRole: 'teacher' | 'editor' = 'teacher'
  ): Promise<{ message: string }> {
    const headers = await getVerifiedAdminHeaders();
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetUid, targetRole }),
    });
    return parseJsonResponse<{ message: string }>(
      res,
      'Không thể phê duyệt tài khoản giáo viên.'
    );
  },

  async rejectTeacher(
    targetUid: string,
    reason: string
  ): Promise<{ message: string }> {
    const headers = await getVerifiedAdminHeaders();
    const res = await fetch('/api/admin/reject', {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetUid, reason }),
    });
    return parseJsonResponse<{ message: string }>(
      res,
      'Không thể từ chối tài khoản giáo viên.'
    );
  },

  async suspendUser(
    targetUid: string,
    reason: string
  ): Promise<{ message: string }> {
    const headers = await getVerifiedAdminHeaders();
    const res = await fetch('/api/admin/suspend', {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetUid, reason }),
    });
    return parseJsonResponse<{ message: string }>(
      res,
      'Không thể tạm khóa tài khoản.'
    );
  },

  async unlockUser(
    targetUid: string,
    reason?: string
  ): Promise<{ message: string }> {
    const headers = await getVerifiedAdminHeaders();
    const res = await fetch('/api/admin/unlock', {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetUid, reason }),
    });
    return parseJsonResponse<{ message: string }>(
      res,
      'Không thể mở khóa tài khoản.'
    );
  },

  async assignRoleViaBackend(
    targetUid: string,
    nextRole: SystemRole,
    reason?: string
  ): Promise<{ message: string; customClaimsApplied: boolean }> {
    const headers = await getVerifiedAdminHeaders();
    const res = await fetch('/api/admin/set-role', {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetUid, role: nextRole, reason }),
    });
    return parseJsonResponse<{ message: string; customClaimsApplied: boolean }>(
      res,
      'Không thể cập nhật phân quyền tài khoản.'
    );
  },

  async fetchAuditLogs(): Promise<AdminAuditLog[]> {
    const headers = await getVerifiedAdminHeaders();
    const res = await fetch('/api/admin/audit-logs', { headers });
    const data = await parseJsonResponse<{ logs: AdminAuditLog[] }>(
      res,
      'Không thể tải nhật ký hoạt động quản trị.'
    );
    return data.logs || [];
  },
};
