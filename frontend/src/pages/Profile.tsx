import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import Button from '../components/Button';
import Input from '../components/Input';
import { authAPI } from '../api';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [stats, setStats] = useState({
    lessonCount: 0,
    pptCount: 0,
    portfolioCount: 0,
    favoriteCount: 0
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

  const handleEdit = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditSchool(user?.school || '');
    setEditing(true);
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

  const tabs = [
    { id: 'profile', label: '个人信息' },
    { id: 'settings', label: '账号设置' },
  ];

  return (
    <Layout 
      title="个人中心" 
      subtitle="管理您的个人信息和账号设置"
      breadcrumbs={[
        { label: '首页', path: '/' },
        { label: '个人中心' }
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-card border border-border-pink p-4 md:p-6">
            <div className="text-center mb-4 md:mb-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary-200 to-primary-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl md:text-3xl font-bold">
                  {user?.name?.charAt(0) || 'W'}
                </span>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-text-dark">{user?.name}</h3>
              <p className="text-sm text-text-muted">{user?.account}</p>
            </div>
            
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between px-4 py-2 md:py-3 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-text-muted hover:bg-primary-50 hover:text-primary-500'
                  }`}
                >
                  <span className="text-sm font-medium">{tab.label}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-9">
          <div className="bg-white rounded-xl shadow-card border border-border-pink p-4 md:p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text-dark">基本信息</h2>
                  {!editing ? (
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      编辑资料
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancel}>
                        取消
                      </Button>
                      <Button size="sm" onClick={handleSave} loading={saving}>
                        保存
                      </Button>
                    </div>
                  )}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">角色</label>
                    <p className="px-4 py-2.5 bg-primary-50 border border-border-pink rounded-lg text-text-dark">
                      师范生
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-pink">
                  <h3 className="text-sm font-semibold text-text-dark mb-4">统计信息</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="text-center p-4 bg-primary-50 rounded-lg">
                      <p className="text-2xl font-bold text-primary-500">{loading ? '-' : stats.lessonCount}</p>
                      <p className="text-sm text-text-muted mt-1">教案数量</p>
                    </div>
                    <div className="text-center p-4 bg-primary-50 rounded-lg">
                      <p className="text-2xl font-bold text-primary-500">{loading ? '-' : stats.portfolioCount}</p>
                      <p className="text-sm text-text-muted mt-1">作品集</p>
                    </div>
                    <div className="text-center p-4 bg-primary-50 rounded-lg">
                      <p className="text-2xl font-bold text-primary-500">{loading ? '-' : stats.favoriteCount}</p>
                      <p className="text-sm text-text-muted mt-1">收藏资源</p>
                    </div>
                    <div className="text-center p-4 bg-primary-50 rounded-lg">
                      <p className="text-2xl font-bold text-primary-500">{loading ? '-' : stats.pptCount}</p>
                      <p className="text-sm text-text-muted mt-1">PPT数量</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text-dark">账号设置</h2>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-text-dark">修改密码</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="旧密码" type="password" placeholder="请输入旧密码" />
                    <Input label="新密码" type="password" placeholder="请输入新密码" />
                    <Input label="确认密码" type="password" placeholder="请确认新密码" className="col-span-2" />
                  </div>
                  <Button className="w-full">保存修改</Button>
                </div>

                <div className="pt-4 border-t border-border-pink">
                  <h3 className="text-sm font-medium text-text-dark mb-4">安全设置</h3>
                  <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                    <div>
                      <p className="font-medium text-text-dark">双重认证</p>
                      <p className="text-sm text-text-muted">开启后登录需要验证手机</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-200 transition-colors">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
                    </button>
                  </div>
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
        </div>
      </div>

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
