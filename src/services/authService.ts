import {
  createUserWithEmailAndPassword,
  getIdTokenResult,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '@/src/config/firebase';
import { userService } from '@/src/services/userService';
import { SystemRole, TeacherRole } from '@/src/types';

export function mapFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Phương thức đăng nhập Email/Mật khẩu chưa được bật trong Firebase Console (Authentication → Sign-in method). Bạn có thể bật trong Console hoặc dùng Đăng nhập bằng Google.';
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc sử dụng tính năng Quên mật khẩu.';
    case 'auth/invalid-email':
      return 'Địa chỉ email không đúng định dạng.';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu từ 6 ký tự trở lên.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email hoặc mật khẩu không chính xác.';
    case 'auth/too-many-requests':
      return 'Quá nhiều lần thử thất bại. Vui lòng đợi vài phút rồi thử lại.';
    case 'auth/popup-closed-by-user':
      return 'Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng tới máy chủ Firebase. Vui lòng kiểm tra kết nối Internet.';
    default:
      return error instanceof Error
        ? error.message
        : 'Đã xảy ra lỗi xác thực. Vui lòng thử lại.';
  }
}

export const authService = {
  async registerWithEmail(payload: {
    fullName: string;
    email: string;
    password: string;
    schoolName: string;
    teacherPosition: TeacherRole;
  }): Promise<User> {
    const credential = await createUserWithEmailAndPassword(
      auth,
      payload.email.trim(),
      payload.password
    );

    await updateProfile(credential.user, {
      displayName: payload.fullName.trim(),
    });

    await userService.createInitialProfile(credential.user, {
      fullName: payload.fullName,
      schoolName: payload.schoolName,
      teacherPosition: payload.teacherPosition,
    });

    // Optional email verification link (non-blocking)
    try {
      await sendEmailVerification(credential.user);
    } catch {
      // Non-fatal if verification mail cannot be sent immediately
    }

    return credential.user;
  },

  async loginWithEmail(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    await userService.ensureUserProfile(credential.user);
    return credential.user;
  },

  async loginWithGoogle(): Promise<User> {
    const credential = await signInWithPopup(auth, googleProvider);
    await userService.ensureUserProfile(credential.user);
    return credential.user;
  },

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async resolveSystemRole(user: User, firestoreRole?: SystemRole): Promise<SystemRole> {
    try {
      const tokenResult = await getIdTokenResult(user);
      const claimRole = tokenResult.claims.role;
      if (claimRole === 'Admin' || claimRole === 'Editor' || claimRole === 'Teacher') {
        return claimRole;
      }
    } catch {
      // Fallback to verified backend check below
    }

    // Also verify token with backend endpoint
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { role?: SystemRole };
        if (data.role === 'Admin' || data.role === 'Editor' || data.role === 'Teacher') {
          return data.role;
        }
      }
    } catch {
      // Ignore network hiccup
    }

    return firestoreRole ?? 'Teacher';
  },
};
