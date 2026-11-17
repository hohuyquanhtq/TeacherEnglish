import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Save } from 'lucide-react';
import { AppImage } from '@/src/components/common/AppImage';
import { PageHeader } from '@/src/components/common/StateViews';
import { TEACHER_ROLES, VIETNAM_PROVINCES } from '@/src/config/curriculum';
import { ROUTES } from '@/src/config/navigation';
import { useAuth } from '@/src/hooks/authContext';
import { TeacherRole, formatSystemRoleLabel } from '@/src/types';

export const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(profile.fullName);
  const [schoolName, setSchoolName] = useState(profile.schoolName);
  const [province, setProvince] = useState(profile.province);
  const [yearsOfExperience, setYearsOfExperience] = useState(String(profile.yearsOfExperience));
  const [role, setRole] = useState<TeacherRole>(profile.role);
  const [bio, setBio] = useState(profile.bio);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [errorNotice, setErrorNotice] = useState('');

  useEffect(() => {
    setFullName(profile.fullName);
    setSchoolName(profile.schoolName);
    setProvince(profile.province);
    setYearsOfExperience(String(profile.yearsOfExperience));
    setRole(profile.role);
    setBio(profile.bio);
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    setSavedNotice(false);
    setIsSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim() || profile.fullName,
        schoolName: schoolName.trim() || profile.schoolName,
        province,
        yearsOfExperience: Math.max(0, Number(yearsOfExperience) || 0),
        role,
        bio: bio.trim(),
      });
      setSavedNotice(true);
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : 'Không thể lưu hồ sơ lên Firestore.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thiết lập hồ sơ giáo viên"
        description="Thông tin được lưu trực tiếp vào Firestore (users/{uid}). Phân quyền hệ thống chỉ do Admin quản lý."
        actions={
          <Link
            to={ROUTES.PREFERENCES}
            className="inline-flex items-center gap-2 min-h-10 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap"
          >
            <span>Sang bước Chọn môn &amp; trình độ</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      {errorNotice ? (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-sm text-red-800"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      ) : null}

      {savedNotice ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm font-medium text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Đã đồng bộ thông tin hồ sơ giáo viên lên Firestore thành công.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.PREFERENCES)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 whitespace-nowrap self-start sm:self-auto"
          >
            <span>Tiếp tục chọn môn học &amp; trình độ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-200">
          <AppImage
            src={profile.avatarUrl}
            alt={fullName}
            className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div>
            <h2 className="text-base font-semibold text-slate-900">{fullName || 'Giáo viên'}</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              {role} · Quyền hệ thống:{' '}
              <span className="font-semibold text-slate-900">
                {formatSystemRoleLabel(profile.systemRole)}
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Email tài khoản ({profile.email}) và quyền hệ thống (
              {formatSystemRoleLabel(profile.systemRole)}) được bảo vệ phía máy chủ.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-slate-700 mb-1.5">
              Họ và tên giáo viên
            </label>
            <input
              id="profile-name"
              type="text"
              maxLength={120}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email tài khoản (không thể sửa trực tiếp)
            </label>
            <input
              id="profile-email"
              type="email"
              value={profile.email}
              disabled
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-slate-100 text-slate-600 border border-slate-200 rounded-lg cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="profile-school" className="block text-sm font-medium text-slate-700 mb-1.5">
              Trường học / Đơn vị
            </label>
            <input
              id="profile-school"
              type="text"
              maxLength={200}
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label htmlFor="profile-province" className="block text-sm font-medium text-slate-700 mb-1.5">
              Tỉnh / Thành phố
            </label>
            <select
              id="profile-province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            >
              {VIETNAM_PROVINCES.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="profile-role" className="block text-sm font-medium text-slate-700 mb-1.5">
              Chức danh chuyên môn
            </label>
            <select
              id="profile-role"
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

          <div>
            <label htmlFor="profile-years" className="block text-sm font-medium text-slate-700 mb-1.5">
              Số năm kinh nghiệm giảng dạy
            </label>
            <input
              id="profile-years"
              type="number"
              min={0}
              max={60}
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div>
          <label htmlFor="profile-bio" className="block text-sm font-medium text-slate-700 mb-1.5">
            Định hướng giảng dạy &amp; ghi chú cá nhân
          </label>
          <textarea
            id="profile-bio"
            rows={3}
            maxLength={1000}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ví dụ: Chuẩn bị giảng dạy các chuyên đề Khoa học tự nhiên bằng tiếng Anh cho lớp tích hợp."
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-200">
          <Link
            to={ROUTES.DASHBOARD}
            className="min-h-10 px-4 py-2 inline-flex items-center text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Quay lại Tổng quan
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="min-h-10 px-5 py-2 inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu hồ sơ giáo viên'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
