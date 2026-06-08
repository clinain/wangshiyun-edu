import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';

const Register: React.FC = () => {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    try {
      await register(account, password, name, email);
      navigate('/login');
    } catch (err) {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex"
      style={{
        background: 'linear-gradient(135deg, #ffe4e4 0%, #fffcfb 50%, #f7bebe 100%)',
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
      }}
    >
      <div className="w-[55%] flex flex-col p-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-md">
            <img 
              src="/logo.jpg" 
              alt="网师云Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-xl text-text-dark font-light tracking-widest">
            教与展 · 同步而生
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-8xl font-semibold text-text-dark mb-3" style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif', letterSpacing: '0.08em' }}>
            网师云
          </h1>
          <p className="text-4xl text-text-muted italic tracking-[0.2em]" style={{ fontFamily: '"WindSong", "Lucida Handwriting", "Brush Script MT", cursive', fontWeight: 400 }}>
            WISE EDUCATE YARD
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-300 to-primary-500 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-medium text-text-dark text-sm mb-1" style={{ letterSpacing: '0.01em' }}>AI智能生成教案</h3>
              <p className="text-xs text-text-muted leading-relaxed" style={{ fontWeight: 300 }}>输入课题关键词，AI自动生成完整教学方案</p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-300 to-primary-500 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-text-dark text-sm mb-1" style={{ letterSpacing: '0.01em' }}>一键生成PPT</h3>
              <p className="text-xs text-text-muted leading-relaxed" style={{ fontWeight: 300 }}>教案内容智能转换，快速生成专业教学演示文稿</p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-300 to-primary-500 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-medium text-text-dark text-sm mb-1" style={{ letterSpacing: '0.01em' }}>教案PPT双向同步</h3>
              <p className="text-xs text-text-muted leading-relaxed" style={{ fontWeight: 300 }}>编辑一方另一方实时更新，保持内容完全一致</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-[45%] flex items-center justify-center p-12">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-10 w-full max-w-md">
          <h2 className="text-3xl font-semibold text-text-dark text-center mb-2" style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif', letterSpacing: '0.05em' }}>创建账号</h2>
          <p className="text-text-muted text-center mb-6" style={{ fontWeight: 300 }}>开始您的备课之旅</p>

          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="姓名"
              placeholder="请输入姓名"
              value={name}
              onChange={setName}
            />
            <Input
              label="账号"
              placeholder="请输入账号"
              value={account}
              onChange={setAccount}
            />
            <Input
              label="邮箱"
              type="email"
              placeholder="请输入邮箱"
              value={email}
              onChange={setEmail}
            />
            <Input
              label="密码"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={setPassword}
            />
            <Input
              label="确认密码"
              type="password"
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            <Button type="submit" size="lg" loading={loading} className="w-full">
              注册
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border-pink">
            <p className="text-center text-text-muted">
              已有账号？
              <button
                onClick={() => navigate('/login')}
                className="text-primary-500 hover:text-primary-600 font-medium ml-1"
              >
                立即登录
              </button>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-border-pink">
            <p className="text-center text-xs text-text-muted">
              注册即表示您同意我们的
              <button className="text-primary-500 hover:underline mx-1">服务条款</button>
              和
              <button className="text-primary-500 hover:underline mx-1">隐私政策</button>
            </p>
          </div>
        </div>

        <div className="absolute bottom-6 text-center">
          <p className="text-text-muted text-sm leading-relaxed">
            2026网师云.保留所有权利<br />
            仅用于师范生教学辅助，不替代真实课堂实践<br />
            遵守《个人信息保护法》
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
