import React from 'react';
import { useNavigate } from 'react-router-dom';

const sourceFiles = [
  "/backend/database/database_init.sql",
  "/backend/database/fix_lessons_table.sql",
  "/backend/database/fix_users_table.sql",
  "/backend/database/init_sqlite.sql",
  "/backend/database/migrations/001_fix_comments_and_roles.js",
  "/backend/database/migrations/001_fix_comments_and_roles_rollback.js",
  "/backend/database/migrations/add_lesson_ppt_is_public.sql",
  "/backend/database/migrations/add_portfolio_id_to_comments.sql",
  "/backend/database/migrations/add_portfolio_stage.sql",
  "/backend/database/migrations/add_portfolio_subject_grade.sql",
  "/backend/database/migrations/add_source_uploader_id.sql",
  "/backend/database/migrations/add_unified_resource_stats.sql",
  "/backend/database/migrations/create_admin_tables.sql",
  "/backend/database/migrations/create_comments_table.sql",
  "/backend/database/migrations/update_favorites_table.sql",
  "/backend/src/config/aiConfig.js",
  "/backend/src/config/auth.js",
  "/backend/src/config/curriculumStandards.js",
  "/backend/src/config/database.js",
  "/backend/src/config/initDatabase.js",
  "/backend/src/config/subjectsConfig.js",
  "/backend/src/controllers/adminController.js",
  "/backend/src/controllers/authController.js",
  "/backend/src/controllers/commentController.js",
  "/backend/src/controllers/lessonController.js",
  "/backend/src/controllers/notificationController.js",
  "/backend/src/controllers/portfolioController.js",
  "/backend/src/controllers/pptController.js",
  "/backend/src/controllers/resourceController.js",
  "/backend/src/middleware/auth.js",
  "/backend/src/middleware/upload.js",
  "/backend/src/models/AdminOperationLog.js",
  "/backend/src/models/Comment.js",
  "/backend/src/models/Favorite.js",
  "/backend/src/models/Lesson.js",
  "/backend/src/models/Notification.js",
  "/backend/src/models/PPTRecord.js",
  "/backend/src/models/Portfolio.js",
  "/backend/src/models/Resource.js",
  "/backend/src/models/User.js",
  "/backend/src/routes/admin.js",
  "/backend/src/routes/ai.js",
  "/backend/src/routes/auth.js",
  "/backend/src/routes/comments.js",
  "/backend/src/routes/knowledgeBase.js",
  "/backend/src/routes/lessons.js",
  "/backend/src/routes/notifications.js",
  "/backend/src/routes/portfolios.js",
  "/backend/src/routes/ppt.js",
  "/backend/src/routes/resources.js",
  "/backend/src/routes/standard.js",
  "/backend/src/routes/users.js",
  "/backend/src/services/aiService.js",
  "/backend/src/services/curriculumStandardService.js",
  "/backend/src/services/emailService.js",
  "/backend/src/services/exportService.js",
  "/backend/src/services/htmlDeckService.js",
  "/backend/src/services/imageSearchService.js",
  "/backend/src/services/knowledgeBaseService.js",
  "/backend/src/services/lessonPlanService.js",
  "/backend/src/services/pdfExportService.js",
  "/backend/src/services/pptService.js",
  "/backend/src/services/teachingProcessAdapter.js",
  "/backend/src/services/verificationCodeService.js",
  "/backend/src/utils/codeGenerator.js",
  "/frontend/public/404.html",
  "/frontend/public/background.png",
  "/frontend/public/logo.jpg",
  "/frontend/public/背景.png",
  "/frontend/src/App.tsx",
  "/frontend/src/api/index.ts",
  "/frontend/src/components/Button.tsx",
  "/frontend/src/components/CommentSection.tsx",
  "/frontend/src/components/CuteAnimals.tsx",
  "/frontend/src/components/DocxPreview.tsx",
  "/frontend/src/components/GeneratingProgressModal.tsx",
  "/frontend/src/components/HtmlDeckFullscreenModal.tsx",
  "/frontend/src/components/HtmlDeckPreview.tsx",
  "/frontend/src/components/Input.tsx",
  "/frontend/src/components/Layout/Header.tsx",
  "/frontend/src/components/Layout/Layout.tsx",
  "/frontend/src/components/Layout/Sidebar.tsx",
  "/frontend/src/components/Modal.tsx",
  "/frontend/src/components/NotificationBell.tsx",
  "/frontend/src/components/PPTModalPreview.tsx",
  "/frontend/src/components/PPTPreview.tsx",
  "/frontend/src/components/PptxLocalPreview.tsx",
  "/frontend/src/components/PptxOnlinePreview.tsx",
  "/frontend/src/context/AuthContext.tsx",
  "/frontend/src/index.css",
  "/frontend/src/main.tsx",
  "/frontend/src/pages/Admin/UserManagement.tsx",
  "/frontend/src/pages/Dashboard.tsx",
  "/frontend/src/pages/KnowledgeBase.tsx",
  "/frontend/src/pages/Lessons/Create.tsx",
  "/frontend/src/pages/Lessons/Detail.tsx",
  "/frontend/src/pages/Lessons/Edit.tsx",
  "/frontend/src/pages/Lessons/Generate.tsx",
  "/frontend/src/pages/Lessons/SyncEdit.tsx",
  "/frontend/src/pages/Login.tsx",
  "/frontend/src/pages/PPT.tsx",
  "/frontend/src/pages/PPTDetail.tsx",
  "/frontend/src/pages/PortfolioView.tsx",
  "/frontend/src/pages/Portfolios.tsx",
  "/frontend/src/pages/Profile.tsx",
  "/frontend/src/pages/Resources.tsx",
  "/frontend/src/pages/Showcase.tsx",
  "/frontend/src/pages/TeachingPreparation.tsx",
  "/frontend/src/types/index.ts",
  "/frontend/src/utils/dateTime.ts",
  "/frontend/src/utils/exportPptx.ts",
  "/frontend/src/utils/teachingGoalsHelper.ts",
  "/scripts/start.sh",
  "/scripts/status.sh",
  "/scripts/stop.sh"
];

const metrics = {
  "files": 115,
  "sourceLines": "33,905",
  "backendSrc": "50",
  "frontendSrc": "43",
  "scripts": "3",
  "databaseFiles": "15",
  "publicAssets": "4"
};

const featureBlocks = [
  {
    label: '课题',
    title: '网师云 Sealos 适配与交付',
    text: '将朋友的教学辅助系统整理为可运行、可备份、可继续开发的在线版本。',
  },
  {
    label: '学情',
    title: '真实部署环境优先',
    text: '以 Sealos DevBox 为主环境，隔离 TeamTrace 项目，避免测试端、生产端和 Git 仓库互相影响。',
  },
  {
    label: '目标',
    title: '稳定完成备课闭环',
    text: '覆盖账号、教案、PPT、资源、作品集、通知、管理员和知识库等核心路径。',
  },
];

const lessonSteps = [
  '梳理旧代码和新 GitHub 代码差异，以新代码为准恢复项目结构。',
  '将运行数据切换为 SQLite，补齐初始化脚本、迁移字段和 Sealos 配置。',
  '接入火山引擎主 AI、阿里云 DirectMail 邮件验证码和公网访问域名。',
  '修复注册登录、资源中心、作品集、PPT 列表、教案导出、时间显示和移动端适配。',
  '完成 GitHub 分支清理，仅保留主分支和最新备份分支。',
];

const moduleCards = [
  { title: '认证与用户', text: '注册、登录、邮箱验证码、密码重置、个人资料、头像、账号注销、管理员用户管理。' },
  { title: '教案工作流', text: 'AI 生成、手动创建、同步编辑、详情查看、导出、标题查重、分页搜索。' },
  { title: 'PPT 设计', text: '从教案生成 PPT、同步更新、HTML 预览、PPTX/HTML 导出、列表分页与删除。' },
  { title: '资源中心', text: '上传、预览、下载、收藏、评论、复制到个人资源，区分公开资源和个人副本。' },
  { title: '作品集', text: '创建、关联教案/PPT、公开分享、评论、收藏、导出、删除，支持公开访问页。' },
  { title: '知识库与课标', text: '内置义务教育新课标 PDF 与 JSON 知识库，支持学科、章节和课标检测。' },
  { title: 'AI 与邮件', text: '火山引擎主模型，智谱和 DashScope 备用，阿里云 DirectMail 发送验证码。' },
  { title: '部署脚本', text: 'Sealos 启动、停止、状态检查，Python 静态代理前端并转发后端 API。' },
];

const repoFacts = [
  { name: 'GitHub 仓库', value: 'clinain/wangshiyun-edu', href: 'https://github.com/clinain/wangshiyun-edu' },
  { name: '主分支', value: 'master' },
  { name: '备份分支', value: 'backup/sealos-current-20260619' },
  { name: '备份提交', value: '280e3da' },
  { name: 'Sealos 本地提交', value: '0ad4b9b' },
  { name: '运行端口', value: '3003 API + 8088 Web' },
];

const metricCards = [
  { label: '交付文件', value: metrics.files, unit: '个' },
  { label: '源码与脚本', value: metrics.sourceLines, unit: '行' },
  { label: '后端源码', value: metrics.backendSrc, unit: '个文件' },
  { label: '前端源码', value: metrics.frontendSrc, unit: '个文件' },
  { label: '数据库脚本', value: metrics.databaseFiles, unit: '个' },
  { label: '公开资源', value: metrics.publicAssets, unit: '个' },
];

const acceptanceItems = [
  { name: '前端构建', value: 'vite build 通过' },
  { name: '后端健康', value: 'api/database healthy' },
  { name: '运行方式', value: 'Sealos DevBox' },
  { name: '备份策略', value: 'master + 最新备份分支' },
];

const Showcase: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main
      className="h-screen overflow-y-auto overscroll-contain px-4 py-6 text-text-dark sm:px-8 lg:px-12"
      style={{
        backgroundImage: 'linear-gradient(135deg, rgba(255, 228, 228, 0.9) 0%, rgba(255, 252, 251, 0.86) 48%, rgba(247, 190, 190, 0.9) 100%), url("/background.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
      }}
    >
      <div className="mx-auto max-w-6xl pb-12">
        <header className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white/70 p-5 shadow-card backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 overflow-hidden rounded-2xl bg-white shadow-md">
              <img src="/logo.jpg" alt="网师云Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-primary-600">Development Lesson</p>
              <h1 className="text-2xl font-semibold tracking-[0.08em] sm:text-3xl" style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
                网师云开发教案
              </h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="rounded-full border border-border-pink bg-white/75 px-5 py-2 text-sm font-medium text-text-muted shadow-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-600"
          >
            返回登录页
          </button>
        </header>

        <section className="mb-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] bg-white/72 p-7 shadow-card backdrop-blur-md sm:p-10">
            <p className="mb-3 text-sm font-medium text-primary-600">一份把系统修到能交付的备课记录</p>
            <h2 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl" style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
              从“能跑”到“能交付”
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-text-muted">
              这不是普通展示页，而是一份教案式开发说明：把需求当课题，把环境当学情，把修复过程当教学过程，把最终部署和 GitHub 备份当作课堂小结。
            </p>
          </div>

          <div className="grid gap-4">
            {featureBlocks.map((item) => (
              <article key={item.label} className="rounded-3xl bg-white/68 p-5 shadow-card backdrop-blur-md">
                <div className="mb-3 inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                  {item.label}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-6 text-text-muted">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-[2rem] bg-white/72 p-6 shadow-card backdrop-blur-md sm:p-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">项目实测数据</p>
              <h2 className="text-3xl font-semibold" style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
                真实交付规模
              </h2>
            </div>
            <a
              href="https://github.com/clinain/wangshiyun-edu"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600"
            >
              打开 GitHub 仓库
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {metricCards.map((item) => (
              <div key={item.label} className="rounded-3xl bg-white/75 p-4 shadow-sm">
                <p className="text-xs text-text-muted">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-text-dark">{item.value}</p>
                <p className="text-xs text-primary-600">{item.unit}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] bg-white/72 p-6 shadow-card backdrop-blur-md sm:p-8">
            <p className="text-sm font-medium text-primary-600">仓库与分支</p>
            <h2 className="mb-5 text-3xl font-semibold" style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
              交付凭证
            </h2>
            <div className="space-y-3">
              {repoFacts.map((item) => (
                <div key={item.name} className="rounded-2xl bg-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs text-text-muted">{item.name}</p>
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noreferrer" className="break-all text-sm font-semibold text-primary-700 hover:underline">
                      {item.value}
                    </a>
                  ) : (
                    <p className="break-all text-sm font-semibold text-text-dark">{item.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/72 p-6 shadow-card backdrop-blur-md sm:p-8">
            <p className="text-sm font-medium text-primary-600">系统模块</p>
            <h2 className="mb-5 text-3xl font-semibold" style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
              功能覆盖面
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {moduleCards.map((item) => (
                <article key={item.title} className="rounded-3xl bg-primary-50/70 p-4">
                  <h3 className="mb-2 text-base font-semibold">{item.title}</h3>
                  <p className="text-sm leading-6 text-text-muted">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[2rem] bg-white/72 p-6 shadow-card backdrop-blur-md sm:p-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">教学过程</p>
              <h2 className="text-3xl font-semibold" style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
                开发路径复盘
              </h2>
            </div>
            <p className="text-sm text-text-muted">以当前 Sealos 线上版本为准</p>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            {lessonSteps.map((step, index) => (
              <div key={step} className="rounded-3xl border border-border-pink bg-primary-50/70 p-4">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500 text-sm font-bold text-white shadow-sm">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-text-muted">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-[2rem] bg-white/72 p-6 shadow-card backdrop-blur-md sm:p-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">完整文件清单</p>
              <h2 className="text-3xl font-semibold" style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
                本次交付包含的 115 个文件
              </h2>
            </div>
            <p className="text-xs text-text-muted">不展示 .env、数据库运行文件、上传文件和日志</p>
          </div>
          <div className="max-h-[360px] overflow-y-auto rounded-3xl border border-border-pink bg-white/70 p-4 font-mono text-xs leading-6 text-text-muted">
            {sourceFiles.map((file) => (
              <div key={file} className="break-all border-b border-primary-100/70 py-1 last:border-b-0">
                {file}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-white/72 p-6 shadow-card backdrop-blur-md sm:p-8">
            <p className="text-sm font-medium text-primary-600">板书设计</p>
            <h2 className="mb-5 text-3xl font-semibold" style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
              交付清单
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {moduleCards.slice(0, 8).map((item) => (
                <div key={item.title} className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-text-muted shadow-sm">
                  {item.title}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/72 p-6 shadow-card backdrop-blur-md sm:p-8">
            <p className="text-sm font-medium text-primary-600">课堂小结</p>
            <h2 className="mb-5 text-3xl font-semibold" style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
              验收结果
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {acceptanceItems.map((item) => (
                <div key={item.name} className="rounded-3xl bg-white/75 p-5 shadow-sm">
                  <p className="mb-2 text-sm text-text-muted">{item.name}</p>
                  <p className="text-lg font-semibold text-text-dark">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-3xl bg-primary-500 px-5 py-4 text-sm leading-7 text-white shadow-card">
              结论：当前系统已经完成 Sealos 适配、核心功能修复、运行验证和 GitHub 备份，可作为朋友继续开发的稳定起点。
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Showcase;
