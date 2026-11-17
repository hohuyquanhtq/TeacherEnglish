import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { ROUTES } from '@/src/config/navigation';
import { useAuth } from '@/src/hooks/useAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, restoreDemoAccount } = useAuth();
  const [email, setEmail] = useState('minhanh.nguyen@thpt-lequydon.edu.vn');
  const [password, setPassword] = useState('Teacher@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setErrorMessage('');
    login(email, password);
    navigate(ROUTES.DASHBOARD);
  };

  const handleDemoLogin = () => {
    restoreDemoAccount();
    navigate(ROUTES.DASHBOARD);
  };

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
          <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Mật khẩu
          </label>
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
          className="w-full min-h-11 px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
        >
          <LogIn className="w-4 h-4" />
          <span>Đăng nhập</span>
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
        <button
          type="button"
          onClick={handleDemoLogin}
          className="w-full min-h-10 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          Dùng nhanh tài khoản mẫu (Cô Nguyễn Minh Anh)
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
