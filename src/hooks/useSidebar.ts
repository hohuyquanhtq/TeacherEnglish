import { useCallback, useState } from 'react';
import { storage } from '@/src/utils/storage';

const SIDEBAR_COLLAPSE_KEY = 'teacher_english_sidebar_collapsed';

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() =>
    storage.get<boolean>(SIDEBAR_COLLAPSE_KEY, false)
  );
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      storage.set(SIDEBAR_COLLAPSE_KEY, next);
      return next;
    });
  }, []);

  const openMobile = useCallback(() => setIsMobileOpen(true), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  return {
    isCollapsed,
    isMobileOpen,
    toggleCollapse,
    openMobile,
    closeMobile,
  };
}
