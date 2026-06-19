import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import Button from '../components/Button';
import Input from '../components/Input';
import { authAPI, notificationAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '@/types';

const Profile: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'none' | 'profile' | 'settings'>('none');
  const [activePanel, setActivePanel] = useState<'none' | 'messages'>('none');
  const [stats, setStats] = useState({
    lessonCount: 0,
    pptCount: 0,
    portfolioCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // 头像上传相关状态
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  
  // 密码修改相关状态
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 消息相关状态
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread' | 'read'>('all');

  // 鼓励语录相关
  const motivationalQuotes = [
    { text: '教育不是注满一桶水，而是点燃一把火。', author: '叶芝' },
    { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
    { text: '千里之行，始于足下。', author: '老子' },
    { text: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈' },
    { text: '书山有路勤为径，学海无涯苦作舟。', author: '韩愈' },
    { text: '不积跬步，无以至千里；不积小流，无以成江海。', author: '荀子' },
    { text: '博学之，审问之，慎思之，明辨之，笃行之。', author: '《中庸》' },
    { text: '世上无难事，只怕有心人。', author: '谚语' },
    { text: '活到老，学到老。', author: '朱熹' },
    { text: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游' },
    { text: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '《警世贤文》' },
    { text: '三人行，必有我师焉。', author: '孔子' },
    { text: '玉不琢，不成器；人不学，不知道。', author: '《礼记》' },
    { text: '读书破万卷，下笔如有神。', author: '杜甫' },
    { text: '今天的努力，明天的收获。', author: '教育格言' },
  ];
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(() =>
    Math.floor(Math.random() * motivationalQuotes.length)
  );

  // 随机切换语录
  const refreshQuote = useCallback(() => {
    let newIndex: number;
    do {
      newIndex = Math.floor(Math.random() * motivationalQuotes.length);
    } while (newIndex === currentQuoteIndex && motivationalQuotes.length > 1);
    setCurrentQuoteIndex(newIndex);
  }, [currentQuoteIndex, motivationalQuotes.length]);

  // 进入页面时随机显示一条语录（仅在页面加载/刷新时触发一次）
  useEffect(() => {
    refreshQuote();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await authAPI.getStats();
        setStats(data);
      } catch (error) {
        console.error('获取用户统计失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // 获取通知列表
  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const data = await notificationAPI.list({ pageSize: 50 });
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // 面板切换时加载数据
  useEffect(() => {
    if (activePanel === 'messages') {
      fetchNotifications();
    }
  }, [activePanel, fetchNotifications]);

  // 标记通知为已读
  const markNotificationAsRead = async (id: number) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 标记所有通知为已读
  const markAllNotificationsAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
  };

  // 删除通知
  const deleteNotification = async (id: number) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  };

  const handleClosePanel = () => {
    setActivePanel('none');
    setActiveTab('none');
    setEditing(false);
  };

  // 头像上传处理
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setAvatarError('请上传图片文件');
      setTimeout(() => setAvatarError(''), 3000);
      return;
    }

    // 验证文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('图片大小不能超过5MB');
      setTimeout(() => setAvatarError(''), 3000);
      return;
    }

    setAvatarUploading(true);
    setAvatarError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const updatedUser = await authAPI.uploadAvatar(formData);
      updateUser(updatedUser);
    } catch (error) {
      console.error('头像上传失败:', error);
      setAvatarError('头像上传失败，请稍后重试');
      setTimeout(() => setAvatarError(''), 3000);
    } finally {
      setAvatarUploading(false);
      // 清空input值，允许重新上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEdit = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditSchool(user?.school || '');
    setEditing(true);
    setActivePanel('none');
    setSaveError('');
    setSaveSuccess(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setSaveError('');
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const updatedUser = await authAPI.updateProfile({
        name: editName || undefined,
        email: editEmail || undefined,
        school: editSchool || undefined
      });
      updateUser(updatedUser);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('保存失败:', error);
      setSaveError('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);

    try {
      await authAPI.deleteAccount();
      logout();
      navigate('/login');
    } catch (error) {
      console.error('注销账号失败:', error);
      alert('注销失败，请稍后重试');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess(false);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('请填写所有密码字段');
      setPasswordSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('新密码和确认密码不一致');
      setPasswordSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('新密码长度至少为6位');
      setPasswordSaving(false);
      return;
    }

    try {
      await authAPI.changePassword({
        oldPassword,
        newPassword
      });
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      console.error('修改密码失败:', error);
      const errorMessage = error.message || error.response?.data?.message || '修改密码失败，请稍后重试';
      setPasswordError(errorMessage);
    } finally {
      setPasswordSaving(false);
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 获取未读通知数量
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 筛选后的通知
  const filteredNotifications = notifications.filter(n => {
    if (notificationFilter === 'unread') return !n.isRead;
    if (notificationFilter === 'read') return n.isRead;
    return true;
  });

  const tabs: { id: 'profile' | 'settings'; label: string; icon: string }[] = [
    { id: 'profile', label: '个人信息', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'settings', label: '账号设置', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  const featureButtons = [
    { id: 'messages', label: '消息列表', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', badge: unreadCount },
  ];

  // 渲染通知类型图标
  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z';
      case 'favorite':
        return 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z';
      default:
        return 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9';
    }
  };

  return (
    <Layout
      title="个人中心"
      subtitle="管理您的个人信息和账号设置"
      breadcrumbs={[
        { label: '首页', path: '/' },
        { label: '个人中心' }
      ]}
      noScroll
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 h-[calc(100vh-120px)] overflow-hidden">
        {/* 左侧个人资料侧边栏 */}
        <div className="md:col-span-3">
          <div className="p-4 md:p-6 border-r border-border-pink">
            {/* 顶部头像和昵称 */}
            <div className="text-center mb-4 md:mb-6">
              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              {/* 头像 - 点击可上传 */}
              <div
                className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 cursor-pointer group"
                onClick={handleAvatarClick}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="头像"
                    className="w-full h-full rounded-full object-cover border-2 border-primary-200"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl md:text-3xl font-bold">
                      {user?.name?.charAt(0) || 'W'}
                    </span>
                  </div>
                )}
                {/* 悬浮遮罩 */}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {avatarUploading ? (
                    <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
              </div>
              {avatarError && (
                <p className="text-xs text-danger-500 mb-2">{avatarError}</p>
              )}
              <h3 className="text-base md:text-lg font-semibold text-text-dark">{user?.name}</h3>
              <p className="text-sm text-text-muted">{user?.account}</p>
            </div>

            {/* 功能按钮组 */}
            <div className="flex md:flex-col gap-2 mb-4 overflow-x-auto md:overflow-x-visible">
              {featureButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setActivePanel(btn.id as any)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all whitespace-nowrap ${
                    activePanel === btn.id
                      ? 'bg-primary-100 text-primary-600 border border-primary-300'
                      : 'text-text-muted hover:bg-primary-50 hover:text-primary-500 border border-transparent'
                  }`}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={btn.icon} />
                  </svg>
                  <span className="text-sm font-medium">{btn.label}</span>
                  {btn.badge > 0 && (
                    <span className="ml-auto bg-danger-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {btn.badge > 99 ? '99+' : btn.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-border-pink pt-4">
              {/* 导航按钮 */}
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as 'profile' | 'settings');
                      setActivePanel('none');
                      setEditing(false);
                    }}
                    className={`flex items-center justify-between px-4 py-2 md:py-3 rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === tab.id && activePanel === 'none'
                        ? 'bg-primary-100 text-primary-600'
                        : 'text-text-muted hover:bg-primary-50 hover:text-primary-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                      </svg>
                      <span className="text-sm font-medium">{tab.label}</span>
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧主内容区 */}
        <div className="md:col-span-9">
          {/* 默认空白区域 - 用户未点击任何功能按钮时显示 */}
          {activePanel === 'none' && activeTab === 'none' && (
            <div
              style={{
                backgroundColor: '#ffffff',
                width: '100%',
                height: 'calc(100vh - 120px)',
                maxHeight: 'calc(100vh - 120px)',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '40px 20px 20px',
              }}
            >
              {/* 语录显示在顶部居中 */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '600px',
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                <p
                  style={{
                    fontSize: '18px',
                    lineHeight: '1.8',
                    color: '#333333',
                    fontWeight: 500,
                    margin: '0 0 10px 0',
                    letterSpacing: '0.5px',
                  }}
                >
                  「{motivationalQuotes[currentQuoteIndex].text}」
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#888888',
                    margin: 0,
                    fontStyle: 'italic',
                  }}
                >
                  —— {motivationalQuotes[currentQuoteIndex].author}
                </p>
              </div>

              {/* 背景图片缩小放在底部 */}
              <div
                style={{
                  width: '100%',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: '10px',
                }}
              >
                <img
                  src="/background.png"
                  alt="装饰背景"
                  style={{
                    maxWidth: '72%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    opacity: 0.95,
                    pointerEvents: 'none',
                    position: 'relative',
                    zIndex: 1,
                  }}
                />
              </div>
            </div>
          )}

          {/* 有内容时显示的容器 */}
          {(activePanel !== 'none' || activeTab !== 'none') && (
          <div className="p-4 md:p-6">
            {/* 消息列表面板 */}
            {activePanel === 'messages' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text-dark">消息列表</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-sm text-primary-500 hover:text-primary-600"
                    >
                      全部已读
                    </button>
                    <button
                      onClick={handleClosePanel}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 筛选按钮 */}
                <div className="flex gap-2">
                  {(['all', 'unread', 'read'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setNotificationFilter(filter)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        notificationFilter === filter
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                      }`}
                    >
                      {filter === 'all' ? '全部' : filter === 'unread' ? '未读' : '已读'}
                    </button>
                  ))}
                </div>

                {/* 通知列表 */}
                {notificationsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-text-muted mt-4">加载中...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-text-muted">暂无消息</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          notification.isRead 
                            ? 'bg-white border-gray-200' 
                            : 'bg-primary-50 border-primary-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notification.isRead ? 'bg-gray-100' : 'bg-primary-100'
                          }`}>
                            <svg className={`w-5 h-5 ${notification.isRead ? 'text-gray-500' : 'text-primary-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={renderNotificationIcon(notification.type)} />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`font-medium ${notification.isRead ? 'text-text-dark' : 'text-primary-600'}`}>
                                {notification.title}
                              </p>
                              <span className="text-xs text-text-muted">{formatTime(notification.createdAt)}</span>
                            </div>
                            {notification.content && (
                              <p className="text-sm text-text-muted mt-1 line-clamp-2">{notification.content}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {!notification.isRead && (
                                <button
                                  onClick={() => markNotificationAsRead(notification.id)}
                                  className="text-xs text-primary-500 hover:text-primary-600"
                                >
                                  标记已读
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-xs text-danger-500 hover:text-danger-600"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 个人信息面板 */}
            {activePanel === 'none' && activeTab === 'profile' && (
              <div className="space-y-6">
                {/* 编辑模式提示 */}
                {editing && (
                  <div className="p-4 bg-primary-100 border-2 border-primary-400 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-primary-700">编辑模式</p>
                        <p className="text-sm text-primary-600">您可以修改以下信息，完成后请点击"保存"按钮</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text-dark">基本信息</h2>
                  <div className="flex items-center gap-2">
                    {!editing ? (
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        编辑资料
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                          取消
                        </Button>
                        <Button size="sm" onClick={handleSave} loading={saving}>
                          保存
                        </Button>
                      </>
                    )}
                    <button
                      onClick={handleClosePanel}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {saveSuccess && (
                  <div className="p-3 bg-success-50 border border-success-200 rounded-lg text-success-600 text-sm">
                    保存成功！
                  </div>
                )}

                {saveError && (
                  <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-600 text-sm">
                    {saveError}
                  </div>
                )}

                {/* 编辑模式下添加边框高亮 */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 ${editing ? 'p-4 bg-primary-50/50 border-2 border-primary-200 rounded-xl' : ''}`}>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">姓名</label>
                    {editing ? (
                      <Input
                        placeholder="请输入姓名"
                        value={editName}
                        onChange={setEditName}
                      />
                    ) : (
                      <p className="px-4 py-2.5 bg-primary-50 border border-border-pink rounded-lg text-text-dark">
                        {user?.name || '-'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">账号</label>
                    <p className="px-4 py-2.5 bg-gray-100 border border-border-pink rounded-lg text-text-dark">
                      {user?.account || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">邮箱</label>
                    {editing ? (
                      <Input
                        type="email"
                        placeholder="请输入邮箱"
                        value={editEmail}
                        onChange={setEditEmail}
                      />
                    ) : (
                      <p className="px-4 py-2.5 bg-primary-50 border border-border-pink rounded-lg text-text-dark">
                        {user?.email || '-'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">学校</label>
                    {editing ? (
                      <Input
                        placeholder="请输入学校"
                        value={editSchool}
                        onChange={setEditSchool}
                      />
                    ) : (
                      <p className="px-4 py-2.5 bg-primary-50 border border-border-pink rounded-lg text-text-dark">
                        {user?.school || '-'}
                      </p>
                    )}
                  </div>
                </div>

                {/* 编辑模式下隐藏统计信息 */}
                {!editing && (
                  <div className="pt-4 border-t border-border-pink">
                    <h3 className="text-sm font-semibold text-text-dark mb-4">统计信息</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                      <div className="text-center p-4 bg-primary-50 rounded-lg">
                        <p className="text-2xl font-bold text-primary-500">{loading ? '-' : stats.lessonCount}</p>
                        <p className="text-sm text-text-muted mt-1">教案数量</p>
                      </div>
                      <div className="text-center p-4 bg-primary-50 rounded-lg">
                        <p className="text-2xl font-bold text-primary-500">{loading ? '-' : stats.portfolioCount}</p>
                        <p className="text-sm text-text-muted mt-1">作品集</p>
                      </div>
                      <div className="text-center p-4 bg-primary-50 rounded-lg">
                        <p className="text-2xl font-bold text-primary-500">{loading ? '-' : stats.pptCount}</p>
                        <p className="text-sm text-text-muted mt-1">PPT数量</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 账号设置面板 */}
            {activePanel === 'none' && activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text-dark">账号设置</h2>
                  <button
                    onClick={handleClosePanel}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-text-dark">修改密码</h3>
                  
                  {passwordSuccess && (
                    <div className="p-3 bg-success-50 border border-success-200 rounded-lg text-success-600 text-sm">
                      密码修改成功！
                    </div>
                  )}
                  
                  {passwordError && (
                    <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-600 text-sm">
                      {passwordError}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="旧密码" 
                      type="password" 
                      placeholder="请输入旧密码" 
                      value={oldPassword}
                      onChange={setOldPassword}
                    />
                    <Input 
                      label="新密码" 
                      type="password" 
                      placeholder="请输入新密码" 
                      value={newPassword}
                      onChange={setNewPassword}
                    />
                    <Input 
                      label="确认密码" 
                      type="password" 
                      placeholder="请确认新密码" 
                      className="col-span-2"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                    />
                  </div>
                  <Button className="w-full" onClick={handleChangePassword} loading={passwordSaving}>
                    保存修改
                  </Button>
                </div>

                <div className="pt-4 border-t border-border-pink">
                  <h3 className="text-sm font-medium text-text-dark mb-4">危险操作</h3>
                  <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-danger-600">注销账号</p>
                        <p className="text-sm text-danger-500 mt-1">注销后所有数据将被永久删除</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-danger-300 text-danger-600 hover:bg-danger-100"
                        onClick={() => setShowDeleteModal(true)}
                      >
                        注销账号
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* 注销账号确认弹窗 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-text-dark mb-4">确认注销账号</h3>
            <p className="text-text-muted mb-6">
              确定要注销账号 <strong>{user?.account}</strong> 吗？此操作不可恢复，所有数据将被永久删除。
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                取消
              </Button>
              <Button
                className="flex-1 bg-danger-500 hover:bg-danger-600"
                onClick={handleDeleteAccount}
                loading={deleting}
              >
                确认注销
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Profile;
