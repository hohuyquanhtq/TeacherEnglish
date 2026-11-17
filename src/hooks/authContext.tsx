import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ASSETS } from '@/src/config/curriculum';
import { auth } from '@/src/config/firebase';
import { authService } from '@/src/services/authService';
import {
  mapFirestoreDocToTeacherProfile,
  userService,
} from '@/src/services/userService';
import {
  AuthSession,
  SystemRole,
  TeacherPreferences,
  TeacherProfile,
  TeacherRole,
} from '@/src/types';

const GUEST_PROFILE: TeacherProfile = {
  id: '',
  fullName: 'Giáo viên',
  email: '',
  schoolName: '',
  province: 'TP. Hồ Chí Minh',
  yearsOfExperience: 0,
  role: 'Giáo viên bộ môn',
  systemRole: 'Teacher',
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
  systemRole: 'Teacher',
};

interface AuthContextValue {
  firebaseUser: User | null;
  session: AuthSession;
  profile: TeacherProfile;
  role: SystemRole;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    role: TeacherRole;
    schoolName: string;
  }) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateProfile: (partial: Partial<TeacherProfile>) => Promise<void>;
  updatePreferences: (preferences: TeacherPreferences) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<TeacherProfile>(GUEST_PROFILE);
  const [session, setSession] = useState<AuthSession>(GUEST_SESSION);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  const hydrateUserProfile = useCallback(async (user: User) => {
    const firestoreDoc = await userService.ensureUserProfile(user);
    const resolvedRole = await authService.resolveSystemRole(user, firestoreDoc.role);
    const mappedProfile = mapFirestoreDocToTeacherProfile(firestoreDoc, resolvedRole);

    setProfile(mappedProfile);
    setSession({
      isAuthenticated: true,
      userId: user.uid,
      fullName: mappedProfile.fullName,
      email: mappedProfile.email,
      role: mappedProfile.role,
      systemRole: resolvedRole,
    });
  }, []);

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
          systemRole: 'Teacher',
        });
      } finally {
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [hydrateUserProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const user = await authService.loginWithEmail(email, password);
      await hydrateUserProfile(user);
    },
    [hydrateUserProfile]
  );

  const loginWithGoogle = useCallback(async () => {
    const user = await authService.loginWithGoogle();
    await hydrateUserProfile(user);
  }, [hydrateUserProfile]);

  const register = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      password: string;
      role: TeacherRole;
      schoolName: string;
    }) => {
      const user = await authService.registerWithEmail({
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
        schoolName: payload.schoolName,
        teacherPosition: payload.role,
      });
      await hydrateUserProfile(user);
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

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    await hydrateUserProfile(firebaseUser);
  }, [firebaseUser, hydrateUserProfile]);

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
