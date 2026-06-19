import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface LayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
  hideSidebar?: boolean;
  noScroll?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ title, subtitle, breadcrumbs, children, hideSidebar = false, noScroll = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen overflow-hidden bg-bg-light">
      {!hideSidebar && (
        <>
          {/* 移动端遮罩层 */}
          {isMobile && sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={closeSidebar}
            />
          )}
          <Sidebar
            isOpen={sidebarOpen}
            onClose={closeSidebar}
            isMobile={isMobile}
          />
        </>
      )}
      <div className={`${hideSidebar ? '' : 'md:ml-[220px]'} flex h-screen min-w-0 flex-col overflow-hidden`}>
        <Header
          title={title}
          subtitle={subtitle}
          breadcrumbs={breadcrumbs}
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarOpen}
          isMobile={isMobile}
        />
        <main className={`${noScroll ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain'} min-h-0 min-w-0 flex-1 max-w-full overflow-x-hidden p-3 sm:p-4 md:p-6`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
