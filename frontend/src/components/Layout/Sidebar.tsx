import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose, isMobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const menuItems: { path: string; label: string; icon: string; children?: { path: string; label: string }[] }[] = [
    { path: '/dashboard', label: '首页', icon: 'home' },
    {
      label: '我的备课',
      path: '/teaching-preparation',
      icon: 'book-open',
      children: [
        { path: '/lessons/create', label: '教案编辑' },
        { path: '/ppt', label: 'PPT设计' },
        { path: '/lessons/sync', label: '同步设计' },
      ],
    },
    { path: '/portfolios', label: '作品集', icon: 'grid' },
    { path: '/resources', label: '资源中心', icon: 'collection' },
    { path: '/knowledge-base', label: '新课标知识库', icon: 'academic' },
    { path: '/profile', label: '个人中心', icon: 'user' },
    ...(user?.role === 'admin' ? [{
      label: '管理后台',
      path: '/admin',
      icon: 'admin',
      children: [
        { path: '/admin/users', label: '用户管理' },
      ],
    }] : []),
  ];

  const isActive = (path: string) => {
    // 忽略查询参数，只比较路径部分
    return location.pathname === path;
  };

  // 当前路由是否属于某个子菜单组
  const isChildActive = (children: { path: string }[]) => {
    return children.some(child => location.pathname === child.path || location.pathname.startsWith(child.path + '/'));
  };

  // 当路由变化时，自动展开包含当前路由的父菜单
  useEffect(() => {
    menuItems.forEach(item => {
      if ('children' in item && item.children) {
        if (isChildActive(item.children)) {
          setExpandedItems(prev => {
            if (prev.has(item.label)) return prev;
            const next = new Set(prev);
            next.add(item.label);
            return next;
          });
        }
      }
    });
  }, [location.pathname]);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
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
      'collection': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      'admin': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    };
    return icons[iconName];
  };

  const isLessonsActive = () => {
    const p = location.pathname;
    return p === '/teaching-preparation' || (p.startsWith('/lessons') && p !== '/lessons') || p.startsWith('/ppt');
  };

  const isResourcesActive = () => {
    return location.pathname === '/resources';
  };

  const isGroupActive = (item: any) => {
    if (item.path === '/resources') return isResourcesActive();
    if (item.path === '/teaching-preparation') return isLessonsActive();
    if (item.path === '/admin') return location.pathname.startsWith('/admin');
    return false;
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
                const isActiveGroup = isGroupActive(item);
                const isExpanded = expandedItems.has(item.label);
                return (
                  <li key={item.label}>
                    <div className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative ${
                      isActiveGroup
                        ? 'bg-pink-500/20 text-white font-bold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-pink-500 before:rounded-r'
                        : 'text-white font-bold hover:bg-pink-800'
                    }`}
                      style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    >
                      {renderIcon(item.icon)}
                      <span
                        className="text-sm flex-1 text-left cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); toggleExpand(item.label); handleNavigate(item.path); }}
                      >
                        {item.label}
                      </span>
                      {/* 展开/折叠箭头 */}
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 cursor-pointer ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        onClick={(e) => { e.stopPropagation(); toggleExpand(item.label); }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    {isExpanded && item.children && (
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
              const isActiveGroup = isGroupActive(item);
              const isExpanded = expandedItems.has(item.label);
              return (
                <li key={item.label}>
                  <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${
                    isActiveGroup
                      ? 'bg-pink-500/20 text-white font-bold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-pink-500 before:rounded-r'
                      : 'text-white font-bold hover:bg-pink-800'
                  }`}
                    style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                  >
                    {renderIcon(item.icon)}
                    <span
                      className="text-sm flex-1 text-left cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); toggleExpand(item.label); handleNavigate(item.path); }}
                    >
                      {item.label}
                    </span>
                    {/* 展开/折叠箭头 */}
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 cursor-pointer ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      onClick={(e) => { e.stopPropagation(); toggleExpand(item.label); }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  {isExpanded && item.children && (
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
