import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, LogIn, MailCheck } from 'lucide-react';
import { ROUTES } from '@/src/config/navigation';
import { useAuth } from '@/src/hooks/authContext';
import { mapFirebaseAuthError } from '@/src/services/authService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, sendPasswordReset } = useAuth();

  const fromPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ||
    ROUTES.DASHBOARD;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(fromPath, { replace: true });
    } catch (error) {
      setErrorMessage(mapFirebaseAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      navigate(fromPath, { replace: true });
    } catch (error) {
      setErrorMessage(mapFirebaseAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = resetEmail.trim();
    if (!target) {
      setErrorMessage('Vui lòng nhập địa chỉ email để khôi phục mật khẩu.');
      return;
    }

    setErrorMessage('');
    setResetSuccess('');
    setIsSubmitting(true);
    try {
      await sendPasswordReset(target);
      setResetSuccess(
        `Đã gửi liên kết đặt lại mật khẩu tới ${target}. Vui lòng kiểm tra hộp thư đến hoặc thư mục Spam.`
      );
    } catch (error) {
      setErrorMessage(mapFirebaseAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isResetMode) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Khôi phục mật khẩu</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Nhập email tài khoản của bạn để nhận liên kết đặt lại mật khẩu từ Firebase Authentication.
          </p>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        ) : null}

        {resetSuccess ? (
          <div className="mb-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-start gap-2.5">
            <MailCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{resetSuccess}</span>
          </div>
        ) : null}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email đã đăng ký
            </label>
            <input
              id="reset-email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="giaovien@truonghoc.edu.vn"
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-11 px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi email đặt lại mật khẩu'}</span>
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-200 text-center">
          <button
            type="button"
            onClick={() => {
              setIsResetMode(false);
              setErrorMessage('');
              setResetSuccess('');
            }}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            Quay lại màn hình đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Đăng nhập Teacher English</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Truy cập lộ trình bồi dưỡng tiếng Anh và giáo án song ngữ dành cho giáo viên.
        </p>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email công tác hoặc cá nhân
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="giaovien@truonghoc.edu.vn"
            className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
              Mật khẩu
            </label>
            <button
              type="button"
              onClick={() => {
                setResetEmail(email);
                setErrorMessage('');
                setIsResetMode(true);
              }}
              className="text-xs font-medium text-blue-700 hover:underline"
            >
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full min-h-11 pl-3.5 pr-11 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-md"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-11 px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors"
        >
          <LogIn className="w-4 h-4" />
          <span>{isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full min-h-11 px-4 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-60 rounded-lg transition-colors"
        >
          Đăng nhập nhanh bằng Google
        </button>

        <p className="text-center text-sm text-slate-600">
          Chưa có tài khoản?{' '}
          <Link to={ROUTES.REGISTER} className="font-semibold text-blue-700 hover:underline">
            Đăng ký giáo viên mới
          </Link>
        </p>
      </div>
    </div>
  );
};
