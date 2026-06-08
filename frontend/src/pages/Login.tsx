import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';

const Login: React.FC = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    setIsLogin(location.pathname !== '/register');
  }, [location.pathname]);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(phone, password);
        navigate('/dashboard');
      } else {
        if (password !== confirmPassword) {
          setError('两次输入的密码不一致');
          return;
        }
        await register(phone, password);
        setIsLogin(true);
      }
    } catch (err) {
      setError(isLogin ? '手机号或密码错误' : '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    const newMode = !isLogin;
    setIsLogin(newMode);
    setError('');
    if (newMode) {
      navigate('/login', { replace: true });
    } else {
      navigate('/register', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row"
      style={{
        background: 'linear-gradient(135deg, #ffe4e4 0%, #fffcfb 50%, #f7bebe 100%)',
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
      }}
    >
      <div className="w-full md:w-[55%] flex flex-col p-6 md:p-12">
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden bg-white shadow-md">
            <img
              src="/logo.jpg"
              alt="网师云Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-base md:text-xl text-text-dark font-light tracking-widest">
            教与展 · 同步而生
          </span>
        </div>

        <div className="hidden md:flex flex-1 flex-col items-center justify-center">
          <h1 className="text-8xl font-semibold text-text-dark mb-3" style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif', letterSpacing: '0.08em' }}>
            网师云
          </h1>
          <p className="text-4xl text-text-muted italic tracking-[0.2em]" style={{ fontFamily: '"WindSong", "Lucida Handwriting", "Brush Script MT", cursive', fontWeight: 400 }}>
            WISE EDUCATE YARD
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6 mt-4 md:mt-8">
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

      <div className="w-full md:w-[45%] flex items-center justify-center p-4 md:p-12">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-md min-h-auto md:min-h-[620px] max-h-none md:max-h-[85vh] overflow-y-auto flex flex-col">
          <h2 className="text-2xl md:text-3xl font-semibold text-text-dark text-center mb-2" style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif', letterSpacing: '0.05em' }}>
            {isLogin ? '欢迎回到网师云' : '创建账号'}
          </h2>
          {isLogin && (
            <p className="text-text-muted text-center mb-6" style={{ fontWeight: 300 }}>
              请登录你的账号，开始您的备课之旅
            </p>
          )}
          {!isLogin && <div className="mb-6" />}
          
          <div className="flex-1 flex flex-col">
            {error && (
              <div className="mb-3 p-2.5 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                label="手机号/账号"
                placeholder="请输入手机号或账号"
                value={phone}
                onChange={setPhone}
              />
              <Input
                label="密码"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={setPassword}
              />
              {!isLogin && (
                <Input
                  label="确认密码"
                  type="password"
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
              )}
              {isLogin && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-text-muted cursor-pointer">
                    <input type="checkbox" className="rounded border-border-pink text-primary-500 focus:ring-primary-300 cursor-pointer" />
                    <span className="select-none">记住我</span>
                  </label>
                  <button type="button" className="text-primary-500 hover:text-primary-600 hover:underline">
                    忘记密码？
                  </button>
                </div>
              )}
              <Button type="submit" size="lg" loading={loading} className="w-full">
                {isLogin ? '登录' : '注册'}
              </Button>
            </form>

            <div className="mt-5 pt-5 border-t border-border-pink">
              <p className="text-center text-text-muted">
                {isLogin ? '还没有账号？' : '已有账号？'}
                <button
                  onClick={toggleMode}
                  className="text-primary-500 hover:text-primary-600 font-medium ml-1"
                >
                  {isLogin ? '立即注册' : '立即登录'}
                </button>
              </p>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-border-pink">
            <p className="text-center text-xs text-text-muted">
              {isLogin ? '登录' : '注册'}即表示您同意我们的
              <button 
                onClick={() => setShowTermsModal(true)}
                className="text-primary-500 hover:underline mx-1 cursor-pointer"
              >
                服务条款
              </button>
              和
              <button 
                onClick={() => setShowPrivacyModal(true)}
                className="text-primary-500 hover:underline mx-1 cursor-pointer"
              >
                隐私政策
              </button>
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border-pink">
            <p className="text-center text-xs text-text-muted leading-relaxed">
              2026网师云.保留所有权利<br />
              仅用于师范生教学辅助，不替代真实课堂实践<br />
              遵守《个人信息保护法》
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="服务条款"
      >
        <div className="text-sm text-text-dark space-y-4 max-h-[60vh] overflow-y-auto">
          <h4 className="text-lg font-semibold text-primary-500 mb-3">网师云服务条款</h4>
          
          <section>
            <h5 className="font-medium text-gray-800 mb-2">一、服务概述</h5>
            <p className="text-gray-600 leading-relaxed">
              网师云（以下简称"本平台"）是一个面向师范生的备课辅助系统，提供AI智能教案生成、PPT制作、作品集管理等服务。
            </p>
          </section>

          <section>
            <h5 className="font-medium text-gray-800 mb-2">二、用户权利与义务</h5>
            <ul className="text-gray-600 leading-relaxed list-disc list-inside space-y-1">
              <li>用户有权使用本平台提供的各项服务功能</li>
              <li>用户应妥善保管账号和密码，不得泄露给他人</li>
              <li>用户应遵守国家法律法规和本平台规则</li>
              <li>用户不得利用本平台进行违法违规活动</li>
            </ul>
          </section>

          <section>
            <h5 className="font-medium text-gray-800 mb-2">三、服务条款的变更</h5>
            <p className="text-gray-600 leading-relaxed">
              本平台有权随时修改本服务条款，修改后的条款将在平台公告后生效。用户继续使用本平台服务即表示同意修改后的条款。
            </p>
          </section>

          <section>
            <h5 className="font-medium text-gray-800 mb-2">四、服务的终止</h5>
            <p className="text-gray-600 leading-relaxed">
              用户违反本条款或法律法规时，本平台有权暂停或终止用户的服务使用权限。
            </p>
          </section>

          <section>
            <h5 className="font-medium text-gray-800 mb-2">五、免责声明</h5>
            <p className="text-gray-600 leading-relaxed">
              本平台提供的教案、PPT等内容仅供教学参考，不构成正式教学指导。用户应自行判断内容的适用性。
            </p>
          </section>

          <section>
            <h5 className="font-medium text-gray-800 mb-2">六、联系方式</h5>
            <p className="text-gray-600 leading-relaxed">
              如有任何疑问或建议，请通过以下渠道联系我们：
            </p>
            <ul className="text-gray-600 leading-relaxed list-disc list-inside space-y-1 mt-2">
              <li>客服电话：18920162983（联系人：cheng）</li>
            </ul>
          </section>

          <p className="text-xs text-gray-400 mt-4 text-center">
            本条款自2026年1月1日起生效
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="隐私政策"
      >
        <div className="text-sm text-text-dark space-y-4 max-h-[60vh] overflow-y-auto">
          <h4 className="text-lg font-semibold text-primary-500 mb-3">网师云隐私政策</h4>
          
          <section>
            <h5 className="font-medium text-gray-800 mb-2">一、信息收集</h5>
            <p className="text-gray-600 leading-relaxed">
              本平台收集用户的基本信息（手机号、账号、密码等）用于身份认证和服务提供。
            </p>
          </section>

          <section>
            <h5 className="font-medium text-gray-800 mb-2">二、信息使用</h5>
            <ul className="text-gray-600 leading-relaxed list-disc list-inside space-y-1">
              <li>提供和维护本平台服务</li>
              <li>个性化用户体验和推荐</li>
              <li>安全保障和反欺诈</li>
              <li>改进产品和服务</li>
            </ul>
          </section>

          <section>
            <h5 className="font-medium text-gray-800 mb-2">三、信息保护</h5>
            <p className="text-gray-600 leading-relaxed">
              本平台采用行业标准的安全措施保护用户信息，防止未经授权的访问、使用或泄露。
            </p>
          </section>

          <section>
            <h5 className="font-medium text-gray-800 mb-2">四、信息共享</h5>
            <p className="text-gray-600 leading-relaxed">
              本平台不会向第三方出售用户信息。仅在法律要求或用户授权的情况下才会披露信息。
            </p>
          </section>

          <section>
            <h5 className="font-medium text-gray-800 mb-2">五、用户权利</h5>
            <ul className="text-gray-600 leading-relaxed list-disc list-inside space-y-1">
              <li>访问个人信息的权利</li>
              <li>更正个人信息的权利</li>
              <li>删除个人信息的权利</li>
              <li>撤回同意的权利</li>
            </ul>
          </section>

          <section>
            <h5 className="font-medium text-gray-800 mb-2">六、Cookie政策</h5>
            <p className="text-gray-600 leading-relaxed">
              本平台使用Cookie提升用户体验。用户可以通过浏览器设置管理Cookie偏好。
            </p>
          </section>

          <section>
            <h5 className="font-medium text-gray-800 mb-2">七、政策更新</h5>
            <p className="text-gray-600 leading-relaxed">
              本隐私政策可能不定期更新，更新后将在平台公告。
            </p>
          </section>

          <p className="text-xs text-gray-400 mt-4 text-center">
            本政策自2026年1月1日起生效
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Login;