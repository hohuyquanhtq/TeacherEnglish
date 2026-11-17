import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { TEACHER_ROLES } from '@/src/config/curriculum';
import { ROUTES } from '@/src/config/navigation';
import { useAuth } from '@/src/hooks/authContext';
import { mapFirebaseAuthError } from '@/src/services/authService';
import { TeacherRole } from '@/src/types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [role, setRole] = useState<TeacherRole>('Giáo viên bộ môn');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Vui lòng điền đầy đủ họ tên, email và mật khẩu.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await register({ fullName, email, password, role, schoolName });
      navigate(ROUTES.PROFILE_SETUP, { replace: true });
    } catch (error) {
      setErrorMessage(mapFirebaseAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      navigate(ROUTES.PROFILE_SETUP, { replace: true });
    } catch (error) {
      setErrorMessage(mapFirebaseAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Đăng ký tài khoản giáo viên</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Tài khoản mới được tạo qua Firebase Authentication và cấp quyền mặc định Teacher trong Firestore.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-fullname" className="block text-sm font-medium text-slate-700 mb-1.5">
              Họ và tên
            </label>
            <input
              id="reg-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn An"
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label htmlFor="reg-role" className="block text-sm font-medium text-slate-700 mb-1.5">
              Chức danh giảng dạy
            </label>
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(e.target.value as TeacherRole)}
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            >
              {TEACHER_ROLES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vanan.nguyen@truonghoc.edu.vn"
            className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            required
          />
        </div>

        <div>
          <label htmlFor="reg-school" className="block text-sm font-medium text-slate-700 mb-1.5">
            Trường học / Đơn vị công tác
          </label>
          <input
            id="reg-school"
            type="text"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="Trường THPT Chu Văn An"
            className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Mật khẩu
            </label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-slate-700 mb-1.5">
              Xác nhận mật khẩu
            </label>
            <input
              id="reg-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-11 px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký & Tạo hồ sơ Firestore'}</span>
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isSubmitting}
          className="w-full min-h-11 px-4 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-60 rounded-lg transition-colors"
        >
          Đăng ký nhanh bằng tài khoản Google
        </button>

        <p className="text-center text-sm text-slate-600">
          Đã có tài khoản?{' '}
          <Link to={ROUTES.LOGIN} className="font-semibold text-blue-700 hover:underline">
            Đăng nhập tại đây
          </Link>
        </p>
      </div>
    </div>
  );
};
