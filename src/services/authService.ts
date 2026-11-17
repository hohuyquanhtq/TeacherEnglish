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
import { RegisterProfileInput, userService } from '@/src/services/userService';
import { SystemRole, normalizeSystemRole } from '@/src/types';

export function mapFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Phương thức đăng nhập Email/Mật khẩu chưa được bật trong Firebase Console (Authentication → Sign-in method).';
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc sử dụng tính năng Quên mật khẩu.';
    case 'auth/invalid-email':
      return 'Địa chỉ email không đúng định dạng.';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu từ 6 ký tự trở lên.';
    case 'auth/user-disabled':
      return 'Tài khoản này đã bị tạm khóa bởi Quản trị viên hệ thống. Vui lòng liên hệ bộ phận quản trị.';
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

export interface VerifiedClaimsResult {
  claimRole: SystemRole | null;
  claimApproved: boolean;
}

export const authService = {
  async registerWithEmail(
    payload: RegisterProfileInput & {
      email: string;
      password: string;
    }
  ): Promise<User> {
    const credential = await createUserWithEmailAndPassword(
      auth,
      payload.email.trim(),
      payload.password
    );

    await updateProfile(credential.user, {
      displayName: payload.fullName.trim(),
    });

    await userService.registerPendingProfileViaBackend(credential.user, {
      fullName: payload.fullName,
      school: payload.school,
      educationLevel: payload.educationLevel,
      subject: payload.subject,
      province: payload.province,
      phone: payload.phone,
    });

    // Optional email verification link (non-blocking)
    try {
      await sendEmailVerification(credential.user);
    } catch {
      // Non-fatal
    }

    return credential.user;
  },

  async loginWithEmail(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    await userService.ensureUserProfile(credential.user);
    await this.syncLoginTimestamp(credential.user);
    return credential.user;
  },

  async loginWithGoogle(): Promise<User> {
    const credential = await signInWithPopup(auth, googleProvider);
    await userService.ensureUserProfile(credential.user);
    await this.syncLoginTimestamp(credential.user);
    return credential.user;
  },

  async syncLoginTimestamp(user: User): Promise<void> {
    try {
      const idToken = await user.getIdToken();
      await fetch('/api/auth/sync-login', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
    } catch {
      // Non-fatal
    }
  },

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async getVerifiedClaims(
    user: User,
    forceRefresh = false
  ): Promise<VerifiedClaimsResult> {
    try {
      const tokenResult = await getIdTokenResult(user, forceRefresh);
      const rawRole = tokenResult.claims.role;
      const claimRole = rawRole ? normalizeSystemRole(rawRole) : null;
      const claimApproved = tokenResult.claims.approved === true;
      return { claimRole, claimApproved };
    } catch {
      return { claimRole: null, claimApproved: false };
    }
  },
};
