import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ASSETS } from '@/src/config/curriculum';
import { auth } from '@/src/config/firebase';
import { authService } from '@/src/services/authService';
import {
  RegisterProfileInput,
  mapFirestoreDocToTeacherProfile,
  userService,
} from '@/src/services/userService';
import {
  AccountStatus,
  AuthSession,
  SystemRole,
  TeacherPreferences,
  TeacherProfile,
  normalizeAccountStatus,
  normalizeSystemRole,
} from '@/src/types';

const GUEST_PROFILE: TeacherProfile = {
  id: '',
  fullName: 'Giáo viên',
  email: '',
  schoolName: '',
  school: '',
  educationLevel: 'THPT',
  subject: 'physics',
  phone: '',
  province: 'TP. Hồ Chí Minh',
  yearsOfExperience: 0,
  role: 'Giáo viên bộ môn',
  systemRole: 'teacher',
  status: 'pending',
  bio: '',
  avatarUrl: ASSETS.TEACHER_AVATAR,
  onboardingCompleted: false,
  preferences: {
    primarySubject: 'physics',
    secondarySubjects: [],
    schoolStage: 'thpt',
    grades: [10],
    currentLevel: 'B1',
    targetLevel: 'B2',
    weeklyMinutesTarget: 180,
  },
};

const GUEST_SESSION: AuthSession = {
  isAuthenticated: false,
  userId: '',
  fullName: 'Khách',
  email: '',
  role: 'Giáo viên bộ môn',
  systemRole: 'teacher',
  status: 'pending',
  claimsApproved: false,
};

interface AuthContextValue {
  firebaseUser: User | null;
  session: AuthSession;
  profile: TeacherProfile;
  role: SystemRole;
  accountStatus: AccountStatus;
  claimsApproved: boolean;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AccountStatus>;
  loginWithGoogle: () => Promise<AccountStatus>;
  register: (
    payload: RegisterProfileInput & { email: string; password: string }
  ) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateProfile: (partial: Partial<TeacherProfile>) => Promise<void>;
  updatePreferences: (preferences: TeacherPreferences) => Promise<void>;
  refreshProfile: (forceTokenRefresh?: boolean) => Promise<{
    role: SystemRole;
    status: AccountStatus;
    claimsApproved: boolean;
  } | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<TeacherProfile>(GUEST_PROFILE);
  const [session, setSession] = useState<AuthSession>(GUEST_SESSION);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  const hydrateUserProfile = useCallback(
    async (
      user: User,
      forceTokenRefresh = false
    ): Promise<{
      role: SystemRole;
      status: AccountStatus;
      claimsApproved: boolean;
    }> => {
      const firestoreDoc = await userService.ensureUserProfile(user);
      const docStatus = normalizeAccountStatus(firestoreDoc.status);
      let claims = await authService.getVerifiedClaims(user, forceTokenRefresh);

      // If Firestore shows approved while token claims are still stale, force a token refresh once
      if (docStatus === 'approved' && !claims.claimApproved && !forceTokenRefresh) {
        claims = await authService.getVerifiedClaims(user, true);
      }

      const resolvedRole = claims.claimRole ?? normalizeSystemRole(firestoreDoc.role);
      const mappedProfile = mapFirestoreDocToTeacherProfile(firestoreDoc, resolvedRole);

      // Keep Firestore status authoritative for UI flow, and require claimsApproved when claims exist
      const effectiveStatus = mappedProfile.status;
      const effectiveClaimsApproved =
        effectiveStatus === 'approved' && claims.claimApproved;

      setProfile(mappedProfile);
      setSession({
        isAuthenticated: true,
        userId: user.uid,
        fullName: mappedProfile.fullName,
        email: mappedProfile.email,
        role: mappedProfile.role,
        systemRole: resolvedRole,
        status: effectiveStatus,
        claimsApproved: effectiveClaimsApproved,
      });

      return {
        role: resolvedRole,
        status: effectiveStatus,
        claimsApproved: effectiveClaimsApproved,
      };
    },
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(GUEST_PROFILE);
        setSession(GUEST_SESSION);
        setIsAuthReady(true);
        return;
      }

      try {
        await hydrateUserProfile(user);
      } catch (err) {
        console.error('Lỗi tải hồ sơ người dùng từ Firestore:', err);
        setSession({
          isAuthenticated: true,
          userId: user.uid,
          fullName: user.displayName || user.email || 'Giáo viên',
          email: user.email || '',
          role: 'Giáo viên bộ môn',
          systemRole: 'teacher',
          status: 'pending',
          claimsApproved: false,
        });
      } finally {
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [hydrateUserProfile]);

  const login = useCallback(
    async (email: string, password: string): Promise<AccountStatus> => {
      const user = await authService.loginWithEmail(email, password);
      const result = await hydrateUserProfile(user, true);
      return result.status;
    },
    [hydrateUserProfile]
  );

  const loginWithGoogle = useCallback(async (): Promise<AccountStatus> => {
    const user = await authService.loginWithGoogle();
    const result = await hydrateUserProfile(user, true);
    return result.status;
  }, [hydrateUserProfile]);

  const register = useCallback(
    async (payload: RegisterProfileInput & { email: string; password: string }) => {
      const user = await authService.registerWithEmail(payload);
      await hydrateUserProfile(user, false);
    },
    [hydrateUserProfile]
  );

  const sendPasswordReset = useCallback(async (email: string) => {
    await authService.sendPasswordReset(email);
  }, []);

  const updateProfile = useCallback(
    async (partial: Partial<TeacherProfile>) => {
      if (!firebaseUser) {
        throw new Error('Bạn cần đăng nhập để cập nhật hồ sơ.');
      }

      const nextValues = {
        fullName: partial.fullName ?? profile.fullName,
        schoolName: partial.schoolName ?? profile.schoolName,
        province: partial.province ?? profile.province,
        yearsOfExperience: partial.yearsOfExperience ?? profile.yearsOfExperience,
        role: partial.role ?? profile.role,
        bio: partial.bio ?? profile.bio,
        phone: partial.phone ?? profile.phone,
      };

      await userService.updatePersonalProfile(firebaseUser.uid, nextValues);
      await hydrateUserProfile(firebaseUser);
    },
    [firebaseUser, profile, hydrateUserProfile]
  );

  const updatePreferences = useCallback(
    async (preferences: TeacherPreferences) => {
      if (!firebaseUser) {
        throw new Error('Bạn cần đăng nhập để lưu cấu hình môn học và trình độ.');
      }

      await userService.updateLearningPreferences(firebaseUser.uid, preferences);
      await hydrateUserProfile(firebaseUser);
    },
    [firebaseUser, hydrateUserProfile]
  );

  const refreshProfile = useCallback(
    async (forceTokenRefresh = false) => {
      if (!firebaseUser) return null;
      return hydrateUserProfile(firebaseUser, forceTokenRefresh);
    },
    [firebaseUser, hydrateUserProfile]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setFirebaseUser(null);
    setProfile(GUEST_PROFILE);
    setSession(GUEST_SESSION);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        session,
        profile,
        role: session.systemRole,
        accountStatus: session.status,
        claimsApproved: session.claimsApproved,
        isAuthReady,
        isAuthenticated: session.isAuthenticated,
        login,
        loginWithGoogle,
        register,
        sendPasswordReset,
        updateProfile,
        updatePreferences,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
