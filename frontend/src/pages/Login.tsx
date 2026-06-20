import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { authAPI } from '../api';

const Login: React.FC = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordCode, setForgotPasswordCode] = useState('');
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState('');
  const [forgotPasswordConfirmPassword, setForgotPasswordConfirmPassword] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordCodeButtonText, setForgotPasswordCodeButtonText] = useState('发送验证码');
  const [forgotPasswordCodeButtonDisabled, setForgotPasswordCodeButtonDisabled] = useState(false);
  const [forgotPasswordCodeCountdown, setForgotPasswordCodeCountdown] = useState(0);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'reset'>('email');
  const forgotPasswordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIsLogin(location.pathname !== '/register');
  }, [location.pathname]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [codeButtonText, setCodeButtonText] = useState('发送验证码');
  const [codeButtonDisabled, setCodeButtonDisabled] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [loginMethod, setLoginMethod] = useState<'password' | 'code'>('password');

  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleOpenShowcase = () => {
    navigate('/showcase');
  };

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (codeCountdown > 0) {
      timerRef.current = setInterval(() => {
        setCodeCountdown(prev => {
          if (prev <= 1) {
            setCodeButtonText('发送验证码');
            setCodeButtonDisabled(false);
            return 0;
          }
          setCodeButtonText(`重新发送(${prev - 1}s)`);
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [codeCountdown]);

  // 忘记密码验证码倒计时
  useEffect(() => {
    if (forgotPasswordCodeCountdown > 0) {
      forgotPasswordTimerRef.current = setInterval(() => {
        setForgotPasswordCodeCountdown(prev => {
          if (prev <= 1) {
            setForgotPasswordCodeButtonText('发送验证码');
            setForgotPasswordCodeButtonDisabled(false);
            return 0;
          }
          setForgotPasswordCodeButtonText(`重新发送(${prev - 1}s)`);
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (forgotPasswordTimerRef.current) {
        clearInterval(forgotPasswordTimerRef.current);
        forgotPasswordTimerRef.current = null;
      }
    };
  }, [forgotPasswordCodeCountdown]);

  const handleSendVerificationCode = async () => {
    if (!email) {
      setError('请先输入邮箱');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入正确的邮箱格式');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authAPI.sendVerificationCode({ email });
      setCodeButtonDisabled(true);
      setCodeCountdown(60);
      setCodeButtonText('重新发送(60s)');
      setSuccessMessage('验证码已发送到您的邮箱，如果没有收到验证码，请查看垃圾邮箱');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送验证码失败，请稍后重试';
      setError(errorMessage);
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleSendLoginCode = async () => {
    if (!email) {
      setError('请先输入邮箱');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入正确的邮箱格式');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await authAPI.sendLoginCode({ email });
      setCodeButtonDisabled(true);
      setCodeCountdown(60);
      setCodeButtonText('重新发送(60s)');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送验证码失败，请稍后重试';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isLogin) {
        if (loginMethod === 'code') {
          if (!verificationCode) {
            setError('请输入验证码');
            setLoading(false);
            return;
          }
          await login(email, password, verificationCode);
        } else {
          await login(email, password);
        }
        navigate('/dashboard');
      } else {
        if (password !== confirmPassword) {
          setError('两次输入的密码不一致');
          return;
        }
        if (!verificationCode) {
          setError('请输入验证码');
          return;
        }
        await register(email, password, verificationCode);
        setIsLogin(true);
        setVerificationCode('');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (isLogin ? '邮箱或密码错误' : '注册失败，请稍后重试');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    const newMode = !isLogin;
    setIsLogin(newMode);
    setError('');
    setSuccessMessage('');
    setVerificationCode('');
    if (newMode) {
      navigate('/register', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row"
      style={{
        backgroundImage: 'linear-gradient(135deg, rgba(255, 228, 228, 0.86) 0%, rgba(255, 252, 251, 0.82) 50%, rgba(247, 190, 190, 0.86) 100%), url("/background.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
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
            {successMessage && !isLogin && (
              <div className="mb-3 p-2.5 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                label={isLogin ? '邮箱/账号' : '邮箱'}
                placeholder={isLogin ? '请输入邮箱或账号' : '请输入邮箱'}
                value={email}
                onChange={setEmail}
              />
              {isLogin && loginMethod === 'password' && (
                <Input
                  label="密码"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={setPassword}
                />
              )}
              {isLogin && loginMethod === 'code' && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      label="验证码"
                      placeholder="请输入验证码"
                      value={verificationCode}
                      onChange={setVerificationCode}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      style={{ height: '40px', marginTop: '18px' }}
                      disabled={codeButtonDisabled || loading}
                      onClick={handleSendLoginCode}
                    >
                      {codeButtonText}
                    </button>
                  </div>
                </div>
              )}
              {!isLogin && (
                <Input
                  label="密码"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={setPassword}
                />
              )}
              {!isLogin && (
                <>
                  <Input
                    label="确认密码"
                    type="password"
                    placeholder="请再次输入密码"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                  />
                  <div className="flex gap-3">
                    <Input
                      label="验证码"
                      placeholder="请输入验证码"
                      value={verificationCode}
                      onChange={setVerificationCode}
                    />
                    <div className="flex items-end">
                      <button
                        type="button"
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        style={{ height: '40px', marginTop: '18px' }}
                        disabled={codeButtonDisabled || loading}
                        onClick={handleSendVerificationCode}
                      >
                        {codeButtonText}
                      </button>
                    </div>
                  </div>
                </>
              )}
              {isLogin && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={`text-sm ${loginMethod === 'password' ? 'text-primary-500 font-medium' : 'text-text-muted hover:text-primary-500'}`}
                      onClick={() => { setLoginMethod('password'); setVerificationCode(''); setError(''); }}
                    >
                      密码登录
                    </button>
                    <span className="text-border-pink">|</span>
                    <button
                      type="button"
                      className={`text-sm ${loginMethod === 'code' ? 'text-primary-500 font-medium' : 'text-text-muted hover:text-primary-500'}`}
                      onClick={() => { setLoginMethod('code'); setPassword(''); setError(''); }}
                    >
                      验证码登录
                    </button>
                  </div>
                  {loginMethod === 'password' && (
                    <button type="button" className="text-primary-500 hover:text-primary-600 hover:underline" onClick={() => {
                      setShowForgotPasswordModal(true);
                      setForgotPasswordError('');
                      setForgotPasswordSuccess('');
                      setForgotPasswordStep('email');
                      setForgotPasswordEmail(email || '');
                      setForgotPasswordCode('');
                      setForgotPasswordNewPassword('');
                      setForgotPasswordConfirmPassword('');
                      setForgotPasswordCodeButtonText('发送验证码');
                      setForgotPasswordCodeButtonDisabled(false);
                      setForgotPasswordCodeCountdown(0);
                    }}>
                      忘记密码？
                    </button>
                  )}
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


      <button
        type="button"
        onClick={handleOpenShowcase}
        className="fixed bottom-1 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-primary-200 bg-white/70 px-2.5 py-1 text-[10px] font-medium text-text-dark shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/90 hover:text-primary-600 sm:bottom-2"
        aria-label="查看网师云开发教案"
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[9px] text-white">卷</span>
        <span>老师别点，这是开发教案</span>
      </button>

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
              本平台收集用户的基本信息（邮箱、账号、密码等）用于身份认证和服务提供。
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
      {/* 忘记密码模态框 */}
      <Modal
        isOpen={showForgotPasswordModal}
        onClose={() => {
          setShowForgotPasswordModal(false);
          setForgotPasswordError('');
          setForgotPasswordSuccess('');
          setForgotPasswordStep('email');
        }}
        title="重置密码"
      >
        <div className="space-y-4">
          {forgotPasswordError && (
            <div className="p-2.5 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 text-sm">
              {forgotPasswordError}
            </div>
          )}
          {forgotPasswordSuccess && (
            <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{forgotPasswordSuccess}</span>
            </div>
          )}

          {forgotPasswordStep === 'email' && (
            <>
              <p className="text-sm text-text-muted">请输入注册时使用的邮箱地址，我们将发送验证码帮助您重置密码。</p>
              <Input
                label="邮箱"
                placeholder="请输入邮箱"
                value={forgotPasswordEmail}
                onChange={setForgotPasswordEmail}
              />
              <div className="flex gap-3">
                <Input
                  label="验证码"
                  placeholder="请输入验证码"
                  value={forgotPasswordCode}
                  onChange={setForgotPasswordCode}
                />
                <div className="flex items-end">
                  <button
                    type="button"
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    style={{ height: '40px', marginTop: '18px' }}
                    disabled={forgotPasswordCodeButtonDisabled || forgotPasswordLoading}
                    onClick={async () => {
                      if (!forgotPasswordEmail) {
                        setForgotPasswordError('请先输入邮箱');
                        return;
                      }
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(forgotPasswordEmail)) {
                        setForgotPasswordError('请输入正确的邮箱格式');
                        return;
                      }
                      setForgotPasswordLoading(true);
                      setForgotPasswordError('');
                      setForgotPasswordSuccess('');
                      try {
                        await authAPI.sendResetPasswordCode({ email: forgotPasswordEmail });
                        setForgotPasswordCodeButtonDisabled(true);
                        setForgotPasswordCodeCountdown(60);
                        setForgotPasswordCodeButtonText('重新发送(60s)');
                        setForgotPasswordSuccess('验证码已发送到您的邮箱，如果没有收到验证码，请查看垃圾邮箱');
                      } catch (err) {
                        const errorMessage = err instanceof Error ? err.message : '发送验证码失败，请稍后重试';
                        setForgotPasswordError(errorMessage);
                      } finally {
                        setForgotPasswordLoading(false);
                      }
                    }}
                  >
                    {forgotPasswordCodeButtonText}
                  </button>
                </div>
              </div>
              <Input
                label="新密码"
                type="password"
                placeholder="请输入新密码（6-20个字符）"
                value={forgotPasswordNewPassword}
                onChange={setForgotPasswordNewPassword}
              />
              <Input
                label="确认新密码"
                type="password"
                placeholder="请再次输入新密码"
                value={forgotPasswordConfirmPassword}
                onChange={setForgotPasswordConfirmPassword}
              />
              <Button
                type="button"
                size="lg"
                loading={forgotPasswordLoading}
                className="w-full"
                onClick={async () => {
                  if (!forgotPasswordEmail) {
                    setForgotPasswordError('请输入邮箱');
                    return;
                  }
                  if (!forgotPasswordCode) {
                    setForgotPasswordError('请输入验证码');
                    return;
                  }
                  if (!forgotPasswordNewPassword) {
                    setForgotPasswordError('请输入新密码');
                    return;
                  }
                  if (forgotPasswordNewPassword.length < 6 || forgotPasswordNewPassword.length > 20) {
                    setForgotPasswordError('新密码长度必须在6-20个字符之间');
                    return;
                  }
                  if (forgotPasswordNewPassword !== forgotPasswordConfirmPassword) {
                    setForgotPasswordError('两次输入的密码不一致');
                    return;
                  }
                  setForgotPasswordLoading(true);
                  setForgotPasswordError('');
                  setForgotPasswordSuccess('');
                  try {
                    await authAPI.resetPassword({
                      email: forgotPasswordEmail,
                      verificationCode: forgotPasswordCode,
                      newPassword: forgotPasswordNewPassword,
                    });
                    setForgotPasswordSuccess('密码重置成功！请使用新密码登录');
                    setForgotPasswordError('');
                    setTimeout(() => {
                      setShowForgotPasswordModal(false);
                      setForgotPasswordSuccess('');
                      setForgotPasswordStep('email');
                    }, 2000);
                  } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : '密码重置失败，请稍后重试';
                    setForgotPasswordError(errorMessage);
                  } finally {
                    setForgotPasswordLoading(false);
                  }
                }}
              >
                重置密码
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Login;
