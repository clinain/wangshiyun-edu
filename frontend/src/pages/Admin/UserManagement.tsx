import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api';
import { AdminUser, AdminStats, AdminPagination } from '../../types';
import Layout from '../../components/Layout/Layout';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | ''>('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result: any = await adminAPI.getUsers({
        page,
        pageSize: pagination.pageSize,
        keyword,
        role: roleFilter || undefined,
        status: statusFilter !== '' ? statusFilter : undefined,
      });
      setUsers(result.users);
      setPagination(result.pagination);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [keyword, roleFilter, statusFilter, pagination.pageSize]);

  const fetchStats = async () => {
    try {
      const result: any = await adminAPI.getStats();
      setStats(result);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const handleSearch = () => {
    fetchUsers(1);
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const newStatus = user.status === 1 ? 0 : 1;
    const action = newStatus === 0 ? '禁用' : '启用';
    
    if (!confirm(`确定要${action}用户 ${user.name || user.username} 吗？`)) {
      return;
    }

    try {
      await adminAPI.toggleUserStatus(user.id, newStatus);
      alert(`${action}成功`);
      fetchUsers(pagination.page);
      fetchStats();
    } catch (error) {
      alert(`${action}失败`);
    }
  };

  const handleChangeRole = async (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'student' : 'admin';
    const roleNames: Record<string, string> = {
      student: '用户',
      admin: '管理员',
    };
    
    if (!confirm(`确定要将 ${user.name || user.username} 的角色从「${roleNames[user.role]}」修改为「${roleNames[newRole]}」吗？`)) {
      return;
    }

    try {
      await adminAPI.changeUserRole(user.id, newRole);
      alert('角色修改成功');
      fetchUsers(pagination.page);
      fetchStats();
    } catch (error) {
      alert('角色修改失败');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      const result: any = await adminAPI.resetPassword(selectedUser.id);
      setTempPassword(result.temporaryPassword);
      setShowResetModal(true);
    } catch (error) {
      alert('重置密码失败');
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`确定要删除用户 ${user.name || user.username} 吗？此操作不可恢复！`)) {
      return;
    }

    try {
      await adminAPI.deleteUser(user.id);
      alert('删除成功');
      fetchUsers(pagination.page);
      fetchStats();
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleViewDetail = async (user: AdminUser) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const roleNames: Record<string, string> = {
    student: '用户',
    admin: '管理员',
  };

  const roleColors: Record<string, string> = {
    student: 'bg-blue-100 text-blue-800',
    admin: 'bg-purple-100 text-purple-800',
  };

  return (
    <Layout title="管理后台" subtitle="用户管理" breadcrumbs={[{ label: '首页', path: '/dashboard' }, { label: '管理后台' }, { label: '用户管理' }]}>
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">用户管理</h1>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">总用户数</div>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">普通用户</div>
            <div className="text-2xl font-bold text-blue-600">{stats.studentCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">管理员</div>
            <div className="text-2xl font-bold text-purple-600">{stats.adminCount}</div>
          </div>
        </div>
      )}

      {/* 搜索栏 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="搜索账号/姓名/邮箱/手机"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部角色</option>
            <option value="student">用户</option>
            <option value="admin">管理员</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            <option value="1">正常</option>
            <option value="0">禁用</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">账号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">邮箱</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">手机</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  加载中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${roleColors[user.role]}`}>
                      {roleNames[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.status === 1 ? '正常' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleViewDetail(user)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      详情
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`${user.status === 1 ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'} mr-3`}
                    >
                      {user.status === 1 ? '禁用' : '启用'}
                    </button>
                    <button
                      onClick={() => { setSelectedUser(user); handleResetPassword(); }}
                      className="text-yellow-600 hover:text-yellow-800 mr-3"
                    >
                      重置密码
                    </button>
                    <button
                      onClick={() => handleChangeRole(user)}
                      className="text-purple-600 hover:text-purple-800 mr-3"
                    >
                      改角色
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-red-600 hover:text-red-800"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 分页 - 始终显示 */}
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <span className="text-sm text-gray-500">
            共 {pagination.total} 条记录，第 {pagination.page}/{pagination.totalPages || 1} 页
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            <button
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || pagination.totalPages <= 1}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      {/* 用户详情模态框 */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">用户详情</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-3">
              <div><span className="text-gray-500">账号：</span>{selectedUser.username}</div>
              <div><span className="text-gray-500">姓名：</span>{selectedUser.name || '-'}</div>
              <div><span className="text-gray-500">邮箱：</span>{selectedUser.email || '-'}</div>
              <div><span className="text-gray-500">手机：</span>{selectedUser.phone || '-'}</div>
              <div><span className="text-gray-500">角色：</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${roleColors[selectedUser.role]}`}>
                  {roleNames[selectedUser.role]}
                </span>
              </div>
              <div><span className="text-gray-500">学校：</span>{selectedUser.school || '-'}</div>
              <div><span className="text-gray-500">状态：</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${selectedUser.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {selectedUser.status === 1 ? '正常' : '禁用'}
                </span>
              </div>
              <div><span className="text-gray-500">注册时间：</span>{selectedUser.created_at}</div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* 重置密码模态框 */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">密码重置成功</h2>
              <button onClick={() => setShowResetModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 mb-2">请将以下临时密码发送给用户：</p>
              <code className="block p-2 bg-white rounded border text-lg font-mono">{tempPassword}</code>
              <p className="text-xs text-yellow-600 mt-2">⚠️ 此密码仅显示一次，请妥善保存</p>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowResetModal(false)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
};

export default UserManagement;
