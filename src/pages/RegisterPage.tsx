import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, UserPlus } from 'lucide-react';
import { SUBJECT_OPTIONS, VIETNAM_PROVINCES } from '@/src/config/curriculum';
import { ROUTES } from '@/src/config/navigation';
import { useAuth } from '@/src/hooks/authContext';
import { mapFirebaseAuthError } from '@/src/services/authService';
import { EducationLevel, SubjectId } from '@/src/types';
import { getSubjectLabel } from '@/src/utils/formatters';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle, logout } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [school, setSchool] = useState('');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>('THPT');
  const [subject, setSubject] = useState<SubjectId>('physics');
  const [province, setProvince] = useState('TP. Hồ Chí Minh');
  const [phone, setPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registrationCompleted, setRegistrationCompleted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !school.trim() || !password) {
      setErrorMessage('Vui lòng điền đầy đủ họ tên, email, trường công tác và mật khẩu.');
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
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        school: school.trim(),
        educationLevel,
        subject,
        province,
        phone: phone.trim(),
      });
      setRegistrationCompleted(true);
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
      const status = await loginWithGoogle();
      if (status === 'approved') {
        navigate(ROUTES.DASHBOARD, { replace: true });
      } else if (status === 'rejected') {
        navigate(ROUTES.REJECTED, { replace: true });
      } else if (status === 'suspended') {
        navigate(ROUTES.SUSPENDED, { replace: true });
      } else {
        navigate(ROUTES.PENDING_APPROVAL, { replace: true });
      }
    } catch (error) {
      setErrorMessage(mapFirebaseAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationCompleted) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto space-y-5">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">
            Đăng ký thành công!
          </h1>
          <p className="text-sm text-slate-700 leading-relaxed">
            Đăng ký thành công! Tài khoản của bạn đang chờ Admin phê duyệt. Vui lòng quay lại sau khi được xác nhận.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Họ và tên</span>
            <span className="font-medium text-slate-900 text-right">{fullName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Email</span>
            <span className="font-medium text-slate-900 text-right">{email}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Trường công tác</span>
            <span className="font-medium text-slate-900 text-right">{school}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Cấp dạy · Môn</span>
            <span className="font-medium text-slate-900 text-right">
              {educationLevel} · {getSubjectLabel(subject)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Trạng thái</span>
            <span className="font-semibold text-amber-700 text-right">Đang chờ phê duyệt</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(ROUTES.PENDING_APPROVAL, { replace: true })}
            className="flex-1 min-h-11 px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Clock className="w-4 h-4" />
            <span>Theo dõi trạng thái duyệt</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate(ROUTES.LOGIN, { replace: true });
            }}
            className="flex-1 min-h-11 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            Về trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Đăng ký tài khoản giáo viên</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Tài khoản mới được tạo với vai trò Giáo viên (teacher) và trạng thái chờ Admin phê duyệt trước khi truy cập học liệu.
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
              Họ và tên *
            </label>
            <input
              id="reg-fullname"
              type="text"
              maxLength={120}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn An"
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email *
            </label>
            <input
              id="reg-email"
              type="email"
              maxLength={200}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vanan.nguyen@truonghoc.edu.vn"
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Mật khẩu *
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
              Xác nhận mật khẩu *
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

        <div>
          <label htmlFor="reg-school" className="block text-sm font-medium text-slate-700 mb-1.5">
            Trường công tác *
          </label>
          <input
            id="reg-school"
            type="text"
            maxLength={200}
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="Trường THPT Chu Văn An"
            className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-level" className="block text-sm font-medium text-slate-700 mb-1.5">
              Cấp dạy *
            </label>
            <select
              id="reg-level"
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            >
              <option value="THCS">Trung học cơ sở (THCS)</option>
              <option value="THPT">Trung học phổ thông (THPT)</option>
            </select>
          </div>

          <div>
            <label htmlFor="reg-subject" className="block text-sm font-medium text-slate-700 mb-1.5">
              Môn giảng dạy *
            </label>
            <select
              id="reg-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value as SubjectId)}
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            >
              {SUBJECT_OPTIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-province" className="block text-sm font-medium text-slate-700 mb-1.5">
              Tỉnh / Thành phố *
            </label>
            <select
              id="reg-province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            >
              {VIETNAM_PROVINCES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reg-phone" className="block text-sm font-medium text-slate-700 mb-1.5">
              Số điện thoại (tùy chọn)
            </label>
            <input
              id="reg-phone"
              type="tel"
              maxLength={30}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912 345 678"
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-11 px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản giáo viên'}</span>
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isSubmitting}
          className="w-full min-h-11 px-4 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-60 rounded-lg transition-colors"
        >
          Đăng ký bằng tài khoản Google (chờ Admin duyệt)
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
