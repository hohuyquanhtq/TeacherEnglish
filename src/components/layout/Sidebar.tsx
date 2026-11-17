import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  BookMarked,
  BookOpenCheck,
  Bot,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FolderHeart,
  GraduationCap,
  LayoutDashboard,
  Map,
  MessageSquareText,
  Mic,
  Presentation,
  Settings2,
  X,
} from 'lucide-react';
import { ROUTES, SIDEBAR_NAV_ITEMS } from '@/src/config/navigation';
import { NavIconKey } from '@/src/types';

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

const ICON_MAP: Record<NavIconKey, React.FC<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  roadmap: Map,
  classroom: MessageSquareText,
  subject: BookOpenCheck,
  bilingual: BookMarked,
  coach: Bot,
  speaking: Mic,
  practice: Presentation,
  assessments: CheckSquare,
  library: FolderHeart,
  reports: BarChart3,
  admin: Settings2,
};

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
}) => {
  const renderNavList = (collapsedMode: boolean) => (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Điều hướng chính">
      {SIDEBAR_NAV_ITEMS.map((item) => {
        const Icon = ICON_MAP[item.icon];
        return (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === ROUTES.DASHBOARD}
            onClick={onCloseMobile}
            title={collapsedMode ? item.label : undefined}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg min-h-10 px-3 py-2.5 text-sm font-medium transition-colors',
                collapsedMode ? 'justify-center px-2' : '',
                isActive
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${
                    isActive ? 'text-blue-700' : 'text-slate-500'
                  }`}
                />
                {!collapsedMode ? (
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                ) : null}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:shrink-0 bg-white border-r border-slate-200 transition-all duration-200 ${
          isCollapsed ? 'lg:w-[76px]' : 'lg:w-[264px]'
        }`}
      >
        <div
          className={`h-16 flex items-center border-b border-slate-200 px-4 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <NavLink
            to={ROUTES.DASHBOARD}
            className="flex items-center gap-2.5 min-w-0 text-slate-900 hover:opacity-90"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            {!isCollapsed ? (
              <span className="font-bold text-base tracking-tight whitespace-nowrap truncate">
                Teacher English
              </span>
            ) : null}
          </NavLink>
        </div>

        {renderNavList(isCollapsed)}

        <div className="p-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            className={`w-full flex items-center gap-2 min-h-10 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Thu gọn menu</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[280px] max-w-[85vw] bg-white h-full flex flex-col border-r border-slate-200 shadow-xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
              <NavLink
                to={ROUTES.DASHBOARD}
                onClick={onCloseMobile}
                className="flex items-center gap-2.5 text-slate-900"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-bold text-base tracking-tight whitespace-nowrap">
                  Teacher English
                </span>
              </NavLink>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Đóng menu"
                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderNavList(false)}
          </aside>
        </div>
      ) : null}
    </>
  );
};
