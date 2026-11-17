import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/src/components/layout/Header';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { useSidebar } from '@/src/hooks/useSidebar';

export const MainLayout: React.FC = () => {
  const { isCollapsed, isMobileOpen, toggleCollapse, openMobile, closeMobile } = useSidebar();

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 overflow-x-hidden">
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onToggleCollapse={toggleCollapse}
        onCloseMobile={closeMobile}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobileMenu={openMobile} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1280px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
