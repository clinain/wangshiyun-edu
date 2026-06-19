import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '@/api';
import type { Notification } from '@/types';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 获取未读通知数量
  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await notificationAPI.getUnreadCount();
      setUnreadCount(result.count);
    } catch (error) {
      // 静默失败
    }
  }, []);

  // 获取通知列表
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const result = await notificationAPI.list({ pageSize: 10 });
      setNotifications(result.notifications || []);
    } catch (error) {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }, []);

  // 定时轮询未读数量（每10秒）
  useEffect(() => {
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(timer);
  }, [fetchUnreadCount]);

  // 监听自定义事件，当有新评论/回复时立即刷新通知
  useEffect(() => {
    const handleNotificationRefresh = () => {
      fetchUnreadCount();
    };
    window.addEventListener('notification-refresh', handleNotificationRefresh);
    return () => window.removeEventListener('notification-refresh', handleNotificationRefresh);
  }, [fetchUnreadCount]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 打开/关闭下拉框
  const toggleDropdown = async () => {
    if (!isOpen) {
      await fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  // 标记单条为已读
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      // 静默失败
    }
  };

  // 标记全部已读
  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      // 静默失败
    }
  };

  // 删除通知
  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      // 如果是未读的，减少未读计数
      const target = notifications.find(n => n.id === id);
      if (target && !target.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      // 静默失败
    }
  };

  // 点击通知跳转到详情页
  const handleNotificationClick = async (notification: Notification) => {
    // 1. 标记已读
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    // 2. 关闭下拉框
    setIsOpen(false);

    // 3. 根据通知类型构建跳转 URL
    const commentParam = notification.commentId ? `?commentId=${notification.commentId}` : '';

    if (notification.resourceId) {
      // 资源评论通知 → 跳转到资源页
      navigate(`/resources${commentParam}`);
    } else if (notification.portfolioId) {
      // 作品集评论通知 → 跳转到作品集详情页
      navigate(`/portfolios/${notification.portfolioId}/view${commentParam}`);
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const parseDate = (value: string) => {
      if (!value) return new Date(NaN);
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
        return new Date(value.replace(' ', 'T') + '+08:00');
      }
      return new Date(value);
    };
    const date = parseDate(dateStr);
    if (isNaN(date.getTime())) return dateStr || '-';
    const now = new Date();
    const diff = Math.max(0, now.getTime() - date.getTime());
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 铃铛按钮 */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
        title="通知"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {/* 未读数量角标 */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 下拉通知面板 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-[130] overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">通知</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-pink-600 hover:text-pink-700 font-medium"
              >
                全部已读
              </button>
            )}
          </div>

          {/* 通知列表 */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm">暂无通知</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !notification.isRead ? 'bg-pink-50/50' : ''
                  }`}
                >
                  {/* 发送者头像 */}
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-pink-600">
                      {notification.senderName?.charAt(0) || '系'}
                    </span>
                  </div>

                  {/* 通知内容 */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${!notification.isRead ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                      {notification.title}
                    </p>
                    {notification.content && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {notification.content}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* 未读圆点 + 删除按钮 */}
                  <div className="flex-shrink-0 flex items-center gap-1">
                    {!notification.isRead && (
                      <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    )}
                    <button
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="p-1 text-gray-300 hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                      style={{ opacity: 1 }}
                      title="删除"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
