import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose, isMobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: '首页', icon: 'home' },
    {
      path: '/lessons/create',
      label: '我的备课',
      icon: 'book-open',
      children: [
        { path: '/lessons/create', label: '教案编辑' },
        { path: '/ppt', label: 'PPT设计' },
        { path: '/lessons/sync', label: '同步设计' },
      ]
    },
    {
      path: '/resources',
      label: '资源中心',
      icon: 'folder-open',
      children: [
        { path: '/lessons', label: '文档管理' },
      ]
    },
    { path: '/portfolios', label: '作品集', icon: 'grid' },
    { path: '/knowledge-base', label: '新课标知识库', icon: 'academic' },
    { path: '/profile', label: '个人中心', icon: 'user' },
  ];

  const isActive = (path: string) => {
    const fullPath = location.pathname + location.search;
    if (path.includes('?')) {
      return fullPath === path;
    }
    return location.pathname === path && !location.search;
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const renderIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'home': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      'book-open': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      'folder-open': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      'grid': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      'user': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      'academic': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
      ),
    };
    return icons[iconName];
  };

  const isLessonsActive = () => {
    const p = location.pathname;
    return (p.startsWith('/lessons') && p !== '/lessons') || p.startsWith('/ppt');
  };

  const isResourcesActive = () => {
    const p = location.pathname;
    return p.startsWith('/resources');
  };

  // 移动端：覆盖层模式
  if (isMobile) {
    return (
      <aside
        className={`fixed left-0 top-0 h-screen w-[260px] bg-pink-900 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-[64px] border-b border-pink-700 px-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold text-white" style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>网师云</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-pink-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              if ('children' in item) {
                const isActiveGroup = item.path === '/lessons/create' ? isLessonsActive() : isResourcesActive();
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => handleNavigate(item.path || item.children?.[0]?.path || '/')}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative ${
                        isActiveGroup
                          ? 'bg-pink-500/20 text-white font-bold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-pink-500 before:rounded-r'
                          : 'text-white font-bold hover:bg-pink-800'
                      }`}
                      style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    >
                      {renderIcon(item.icon)}
                      <span className="text-sm">{item.label}</span>
                    </button>
                    {item.children && (
                      <ul className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.path + child.label}>
                            <button
                              onClick={() => handleNavigate(child.path)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                isActive(child.path)
                                  ? 'bg-pink-500/30 text-white'
                                  : 'text-white hover:bg-pink-800'
                              }`}
                              style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                            >
                              <span className="text-sm">{child.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }
              return (
                <li key={item.path}>
                  <button
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative ${
                      isActive(item.path)
                        ? 'bg-pink-500/20 text-white font-bold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-pink-500 before:rounded-r'
                        : 'text-white font-bold hover:bg-pink-800'
                    }`}
                    style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                  >
                    {renderIcon(item.icon)}
                    <span className="text-sm">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    );
  }

  // 桌面端：固定侧边栏
  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-pink-900 flex flex-col z-50">
      <div className="flex items-center justify-start h-[64px] border-b border-pink-700 px-4">
        <div className="flex items-center gap-4">
          <img
            src="/logo.jpg"
            alt="Logo"
            className="w-14 h-14 object-contain"
          />
          <span className="text-2xl font-bold text-white" style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>网师云</span>
        </div>
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            if ('children' in item) {
              const isActiveGroup = item.path === '/lessons/create' ? isLessonsActive() : isResourcesActive();
              return (
                <li key={item.label}>
                  <button
                    onClick={() => handleNavigate(item.path || item.children?.[0]?.path || '/')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${
                      isActiveGroup
                        ? 'bg-pink-500/20 text-white font-bold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-pink-500 before:rounded-r'
                        : 'text-white font-bold hover:bg-pink-800'
                    }`}
                    style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                  >
                    {renderIcon(item.icon)}
                    <span className="text-sm">{item.label}</span>
                  </button>
                  {item.children && (
                    <ul className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.path + child.label}>
                          <button
                            onClick={() => handleNavigate(child.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                              isActive(child.path)
                                ? 'bg-pink-500/30 text-white'
                                : 'text-white hover:bg-pink-800'
                            }`}
                            style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                          >
                            <span className="text-sm">{child.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }
            return (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${
                    isActive(item.path)
                      ? 'bg-pink-500/20 text-white font-bold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-pink-500 before:rounded-r'
                      : 'text-white font-bold hover:bg-pink-800'
                  }`}
                  style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                >
                  {renderIcon(item.icon)}
                  <span className="text-sm">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
