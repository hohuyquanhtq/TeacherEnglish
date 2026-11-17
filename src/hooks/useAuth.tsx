import React, { createContext, useCallback, useContext, useState } from 'react';
import { authService } from '@/src/services/authService';
import { AuthSession, TeacherPreferences, TeacherProfile, TeacherRole } from '@/src/types';

interface AuthContextValue {
  session: AuthSession;
  profile: TeacherProfile;
  login: (email: string, password: string) => void;
  register: (payload: {
    fullName: string;
    email: string;
    role: TeacherRole;
    schoolName: string;
  }) => void;
  updateProfile: (partial: Partial<TeacherProfile>) => void;
  updatePreferences: (preferences: TeacherPreferences) => void;
  logout: () => void;
  restoreDemoAccount: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession>(() => authService.getSession());
  const [profile, setProfile] = useState<TeacherProfile>(() => authService.getProfile());

  const login = useCallback((email: string, password: string) => {
    const result = authService.login(email, password);
    setSession(result.session);
    setProfile(result.profile);
  }, []);

  const register = useCallback(
    (payload: { fullName: string; email: string; role: TeacherRole; schoolName: string }) => {
      const result = authService.register(payload);
      setSession(result.session);
      setProfile(result.profile);
    },
    []
  );

  const updateProfile = useCallback((partial: Partial<TeacherProfile>) => {
    const nextProfile = authService.updateProfile(partial);
    setProfile(nextProfile);
    setSession(authService.getSession());
  }, []);

  const updatePreferences = useCallback((preferences: TeacherPreferences) => {
    const nextProfile = authService.updatePreferences(preferences);
    setProfile(nextProfile);
  }, []);

  const logout = useCallback(() => {
    const nextSession = authService.logout();
    setSession(nextSession);
  }, []);

  const restoreDemoAccount = useCallback(() => {
    const result = authService.resetToDemo();
    setSession(result.session);
    setProfile(result.profile);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        login,
        register,
        updateProfile,
        updatePreferences,
        logout,
        restoreDemoAccount,
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
