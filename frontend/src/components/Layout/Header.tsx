import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  isMobile?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, breadcrumbs, onToggleSidebar, isMobile = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const visibleBreadcrumbs = isMobile ? breadcrumbs?.slice(-1) : breadcrumbs;

  return (
    <header className={`${isMobile ? 'h-[48px]' : 'h-[64px]'} shrink-0 bg-pink-800 border-b border-pink-700 flex items-center justify-between gap-2 overflow-visible ${isMobile ? 'px-3' : 'px-6'} z-[100]`}>
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {/* 移动端汉堡菜单按钮 */}
        {isMobile && (
          <button
            onClick={onToggleSidebar}
            className="p-2 text-white hover:bg-pink-700 rounded-lg transition-colors"
            aria-label="打开菜单"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          {visibleBreadcrumbs && visibleBreadcrumbs.length > 0 ? (
            <nav className="flex min-w-0 items-center gap-1 overflow-hidden text-sm">
              {visibleBreadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center gap-1">
                  {item.path ? (
                    <button
                      onClick={() => navigate(item.path!)}
                      className="block max-w-[48vw] truncate text-white/80 transition-colors hover:text-white sm:max-w-none"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className="block max-w-[48vw] truncate font-medium text-white sm:max-w-none">
                      {item.label}
                    </span>
                  )}
                  {index < visibleBreadcrumbs.length - 1 && (
                    <svg className="w-4 h-4 text-white/60 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </nav>
          ) : (
            <h2 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-white`}>{title}</h2>
          )}
        </div>
      </div>
      
      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-3">
        {/* 通知铃铛 */}
        <NotificationBell />

        <div className="flex items-center gap-1 sm:gap-2">
          <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-white/20 rounded-full flex items-center justify-center`}>
            <span className={`text-white font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {user?.name?.charAt(0) || 'W'}
            </span>
          </div>
          {/* 桌面端显示完整用户信息 */}
          {!isMobile && (
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name || '用户'}</p>
              <p className="text-xs text-white/70">{user?.account || 'account'}</p>
            </div>
          )}
        </div>
        
        <button
          onClick={logout}
          className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-4 py-2 text-sm'} text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors`}
        >
          <svg className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isMobile && '退出'}
        </button>
      </div>
    </header>
  );
};

export default Header;
