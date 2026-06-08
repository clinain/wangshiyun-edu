# 网师云 - 师范生备课辅助系统 项目分析

## 一、项目概述

**网师云**是一个面向师范生的备课辅助系统，旨在帮助师范生完成教案编写、PPT生成、新课标对照、作品集整理等备课全流程工作。系统集成了多个免费AI大模型API，支持AI智能生成教案和PPT，并实现教案与PPT的双向同步。

---

## 二、技术架构

### 整体架构图

```
┌─────────────────────────────────────────────┐
│                  前端 (React)                 │
│  Vite + TypeScript + React 18 + TailwindCSS  │
│  react-router-dom v6 (前端路由)               │
│  axios (HTTP请求)                            │
└──────────────────┬──────────────────────────┘
                   │ HTTP / REST API
┌──────────────────┴──────────────────────────┐
│                 后端 (Node.js)                │
│  Express + Sequelize ORM + MySQL             │
│  JWT 认证 / bcryptjs 加密 / multer 文件上传   │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────┴────┐          ┌────┴────┐
   │  MySQL  │          │ AI APIs │
   │ 数据库   │          │ 智谱/阿里云│
   └─────────┘          │ 等多模型  │
                        └─────────┘
```

### 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | UI框架 |
| TypeScript | 5.3.0 | 类型安全 |
| Vite | 5.1.0 | 构建工具 |
| TailwindCSS | 3.4.1 | 样式框架 |
| react-router-dom | 6.22.0 | 前端路由 |
| axios | 1.6.7 | HTTP客户端 |

### 后端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | >=16.0.0 | 运行环境 |
| Express | 4.18.2 | Web框架 |
| Sequelize | 6.35.2 | ORM框架 |
| MySQL | - | 数据库 |
| JWT | 9.0.2 | 身份认证 |
| bcryptjs | 2.4.3 | 密码加密 |
| multer | 2.1.1 | 文件上传 |
| archiver | 8.0.0 | 文件压缩导出 |
| Joi | 17.11.0 | 数据验证 |

### AI服务集成
| AI提供商 | 模型 | 状态 |
|----------|------|------|
| 智谱GLM | glm-4-flash | 主提供商（已配置） |
| 阿里云DashScope | qwen-plus | 已配置 |
| 腾讯混元 | hunyuan-lite | 可选 |
| 百度文心一言 | ernie-3.5-turbo | 可选 |
| 豆包 | doubao-3 | 可选 |
| 零一万物 | yi-34b-chat | 可选 |
| 火山引擎 | Doubao-3 | 可选 |

---

## 三、数据库设计

系统共包含 **8张核心表**，使用 MySQL + InnoDB 引擎，字符集 utf8mb4。

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| users | 用户表 | id, username, password, name, phone, role, status |
| lessons | 教案表 | id, user_id, title, subject, grade, teaching_goals, teaching_process |
| user_ppt_records | PPT记录表 | id, user_id, lesson_id, title, content_json, status |
| portfolios | 作品集表 | id, user_id, name, lesson_ids, ppt_ids, is_public |
| resources | 资源表 | id, uploader_id, title, type, file_url, subject, grade |
| user_favorites | 收藏表 | id, user_id, resource_id |
| ppt_templates | PPT模板表 | id, name, config_json, thumbnail_url |
| portfolio_access_logs | 作品集访问日志 | id, portfolio_id, visitor_id, access_type |

### 表关系

```
users 1:N lessons
users 1:N user_ppt_records
users 1:N portfolios
users 1:N resources
users 1:N user_favorites
lessons 1:N user_ppt_records
resources 1:N user_favorites
portfolios 1:N portfolio_access_logs
```

---

## 四、API路由结构

| 路由前缀 | 控制器 | 功能 |
|----------|--------|------|
| /api/auth | authController | 登录、注册、个人信息、统计数据 |
| /api/users | users | 用户管理 |
| /api/lessons | lessonController | 教案CRUD、AI生成、导出、新课标检测 |
| /api/ppt | pptController | PPT生成、同步、CRUD、导出 |
| /api/resources | resourceController | 资源上传、下载、收藏、CRUD |
| /api/portfolios | portfolioController | 作品集管理、分享、公开列表 |
| /api/ai | aiController | AI状态、切换、测试、聊天 |
| /api/standard | standard | 新课标检测 |

---

## 五、前端页面结构

### 路由与页面映射

| 路由 | 页面组件 | 说明 |
|------|----------|------|
| /login, /register | Login | 登录/注册（共用组件） |
| /dashboard | Dashboard | 首页功能展示 |
| /lessons | Lessons/Index | 教案列表 |
| /lessons/create | Lessons/Create | 创建教案 |
| /lessons/:id | Lessons/Detail | 教案详情 |
| /lessons/:id/edit | Lessons/Edit | 编辑教案 |
| /lessons/sync, /lessons/:id/sync | Lessons/SyncEdit | 教案-PPT同步编辑 |
| /lessons/generate | Lessons/Generate | AI生成教案 |
| /ppt | PPT | PPT列表 |
| /ppt/:id | PPTDetail | PPT详情 |
| /resources | Resources | 资源中心 |
| /portfolios | Portfolios | 作品集列表 |
| /portfolios/:id/view | PortfolioView | 作品集预览 |
| /profile | Profile | 个人中心 |

### 侧边栏导航

```
首页
我的备课
  ├── 教案编写
  ├── PPT设计
  └── 同步设计
资源中心
作品集
个人中心
```

---

## 六、核心业务功能

### 1. AI生成教案
- 用户输入学科、年级、课题等信息
- 系统调用AI大模型生成完整的教案内容
- 支持学科感知的智能生成（根据学科特点调整生成内容）
- 生成内容包含：教学目标、教学重点、教学过程、课后作业

### 2. 一键生成PPT
- 基于教案数据自动转换为PPT结构
- 支持多种模板风格：default、modern、academic
- PPT结构包含：封面页、目录页、教学目标页、重难点页、教学过程页、作业页、结束页
- 前端通过 PPTPreview 和 PPTModalPreview 组件渲染预览

### 3. 教案与PPT双向同步
- 修改教案时PPT自动同步更新
- 修改PPT时教案同步更新
- 通过 SyncEdit 页面实现

### 4. 新课标对照检查
- 基于 curriculumStandards 配置
- 自动对照最新课程标准检查教案合规性
- 通过 curriculumStandardService 实现

### 5. 资源中心
- 支持多种资源类型：document、video、audio、image、other
- 资源上传、下载、收藏
- 按学科、年级、类型分类筛选

### 6. 作品集管理
- 将教案和PPT打包为作品集
- 支持公开/私有设置
- 支持分享和导出
- 访问日志记录

---

## 七、认证与安全

- **JWT Token 认证**：登录后颁发JWT token，有效期7天
- **密码加密**：使用 bcryptjs 进行密码哈希
- **路由保护**：前端 ProtectedRoute 组件拦截未登录访问
- **请求拦截**：axios 拦截器自动附加 Authorization header
- **401处理**：响应拦截器检测401状态码，自动清除token并跳转登录页

---

## 八、项目目录结构总结

```
demo-01/
├── database_design.md          # 数据库设计文档
├── logo.jpg                    # 系统Logo
├── backend/                    # 后端项目
│   ├── server.js               # 入口文件
│   ├── .env                    # 环境变量配置
│   ├── Dockerfile              # Docker配置
│   ├── init_db.js              # 数据库初始化
│   ├── database/               # SQL脚本
│   │   ├── database_init.sql
│   │   ├── fix_*.sql
│   │   └── migrations/
│   ├── src/
│   │   ├── config/             # 配置文件（数据库、AI、课标、学科）
│   │   ├── controllers/        # 控制器（auth、lesson、ppt、resource、portfolio）
│   │   ├── middleware/         # 中间件（auth认证、upload文件上传）
│   │   ├── models/             # 数据模型（User、Lesson、PPTRecord、Resource、Portfolio、Favorite）
│   │   ├── routes/             # 路由定义
│   │   └── services/           # 业务服务（AI、PPT生成、教案、课标、导出）
│   └── uploads/                # 上传文件存储
└── frontend/                   # 前端项目
    ├── vite.config.ts          # Vite配置
    ├── tailwind.config.js      # TailwindCSS配置
    ├── src/
    │   ├── App.tsx             # 路由配置
    │   ├── api/index.ts        # API请求封装
    │   ├── types/index.ts      # TypeScript类型定义
    │   ├── context/            # React Context（AuthContext）
    │   ├── components/         # 公共组件
    │   │   ├── Layout/         # 布局组件（Header、Sidebar、Layout）
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Modal.tsx
    │   │   ├── PPTPreview.tsx  # PPT预览组件
    │   │   └── PPTModalPreview.tsx  # PPT弹窗预览
    │   └── pages/              # 页面组件
    │       ├── Dashboard.tsx
    │       ├── Login.tsx / Register.tsx
    │       ├── Profile.tsx
    │       ├── Resources.tsx
    │       ├── Portfolios.tsx / PortfolioView.tsx
    │       ├── PPT.tsx / PPTDetail.tsx
    │       └── Lessons/        # 教案相关页面
    │           ├── Index.tsx   # 教案列表
    │           ├── Create.tsx  # 创建教案
    │           ├── Detail.tsx  # 教案详情
    │           ├── Edit.tsx    # 编辑教案
    │           ├── Generate.tsx # AI生成
    │           ├── List.tsx    # 教案列表(另一版本)
    │           └── SyncEdit.tsx # 同步编辑
```

---

## 九、运行配置

- **后端端口**: 3003
- **前端开发**: Vite默认端口 5173
- **API基础地址**: http://localhost:3003/api
- **数据库**: MySQL, 数据库名 wangshiyun, 用户名 root/root
- **AI主提供商**: 智谱GLM-4-Flash（已配置API Key）

---

## 十、总结

网师云是一个功能完整的师范生备课辅助系统，核心特色在于：
1. **AI驱动** - 集成7个AI大模型，支持智能生成教案和PPT
2. **双向同步** - 教案与PPT内容实时同步
3. **新课标对照** - 自动检查教案是否符合最新课程标准
4. **全流程覆盖** - 从教案编写到PPT生成到作品集整理的完整备课流程
5. **多用户支持** - 基于角色的用户体系，支持教案和资源的私有/公开管理
