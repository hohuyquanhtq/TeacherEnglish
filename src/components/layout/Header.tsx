import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
} from 'lucide-react';
import { AppImage } from '@/src/components/common/AppImage';
import { ROUTE_TITLES, ROUTES } from '@/src/config/navigation';
import { useAuth } from '@/src/hooks/authContext';
import { formatSystemRoleLabel } from '@/src/types';
import { getStageLabel, getSubjectLabel } from '@/src/utils/formatters';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, profile, role, accountStatus, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const pageTitle = ROUTE_TITLES[location.pathname] ?? 'Teacher English';
  const isApproved = accountStatus === 'approved';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
      {/* Left: Mobile Trigger & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {isApproved ? (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Mở menu điều hướng"
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        ) : null}

        <div className="flex items-center gap-2 text-sm min-w-0">
          <Link
            to={isApproved ? ROUTES.DASHBOARD : ROUTES.PENDING_APPROVAL}
            className="hidden sm:inline text-slate-500 hover:text-slate-800 whitespace-nowrap"
          >
            Teacher English
          </Link>
          <span className="hidden sm:inline text-slate-300" aria-hidden="true">
            /
          </span>
          <span className="font-semibold text-slate-900 truncate">{pageTitle}</span>
        </div>
      </div>

      {/* Right: Subject preference shortcut + Account Profile Menu */}
      <div className="flex items-center gap-3 shrink-0">
        {session.isAuthenticated && isApproved ? (
          <Link
            to={ROUTES.PREFERENCES}
            className="hidden md:inline-flex items-center gap-2 min-h-10 px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-700" />
            <span>
              {getSubjectLabel(profile.preferences.primarySubject)} ·{' '}
              {getStageLabel(profile.preferences.schoolStage)} · {profile.preferences.currentLevel}
            </span>
          </Link>
        ) : null}

        <div className="relative" ref={dropdownRef}>
          {session.isAuthenticated ? (
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2.5 min-h-10 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              <AppImage
                src={profile.avatarUrl}
                alt={session.fullName}
                className="w-7 h-7 rounded-md object-cover shrink-0"
              />
              <div className="text-left hidden sm:block max-w-[160px]">
                <div className="text-sm font-semibold text-slate-900 truncate leading-tight">
                  {session.fullName}
                </div>
              </div>
              <span className="sm:hidden text-sm font-semibold text-slate-900 max-w-[110px] truncate">
                {session.fullName}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-1.5 min-h-10 px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="inline-flex items-center gap-1.5 min-h-10 px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-sm font-medium text-white whitespace-nowrap"
              >
                <span>Đăng ký</span>
              </Link>
            </div>
          )}

          {menuOpen && session.isAuthenticated ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-40"
            >
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">{session.fullName}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {session.email} · {formatSystemRoleLabel(role)}
                </p>
              </div>

              {isApproved ? (
                <div className="py-1">
                  <Link
                    to={ROUTES.PROFILE_SETUP}
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <UserCog className="w-4 h-4 text-slate-500" />
                    <span>Thiết lập hồ sơ giáo viên</span>
                  </Link>
                  <Link
                    to={ROUTES.PREFERENCES}
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                    <span>Chọn môn học &amp; trình độ</span>
                  </Link>
                  {role === 'admin' ? (
                    <Link
                      to={ROUTES.ADMIN}
                      role="menuitem"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-800 font-medium hover:bg-blue-50"
                    >
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      <span>Quản trị hệ thống</span>
                    </Link>
                  ) : null}
                </div>
              ) : null}

              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleLogout()}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
