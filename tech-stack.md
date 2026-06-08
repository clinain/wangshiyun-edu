# 网师云 — 师范生备课辅助系统 · 技术栈一览

> 本文档整理自项目源码与配置文件，最后更新：2026-06-04

---

## 1. 项目整体架构

```
┌─────────────────────────────────────────────────────┐
│                    前端 (Frontend)                    │
│   React 18 + TypeScript + Vite + Tailwind CSS       │
│   运行端口：5173  →  代理 → 后端 :3003               │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / REST API
┌──────────────────────▼──────────────────────────────┐
│                    后端 (Backend)                     │
│   Node.js + Express 4 + mysql2 连接池                │
│   运行端口：3003                                     │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐   ┌──────────┐   ┌───────────┐
   │  MySQL   │   │  智谱 AI  │   │ OnlyOffice│
   │  数据库   │   │ GLM-4    │   │ Doc Server│
   └─────────┘   └──────────┘   └───────────┘
```

---

## 2. 前端技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **框架** | React | ^18.2.0 | UI 构建库 |
| **语言** | TypeScript | ^5.3.0 | 类型安全 |
| **构建工具** | Vite | ^5.1.0 | 快速开发服务器与打包 |
| **路由** | React Router DOM | ^6.22.0 | SPA 路由管理 |
| **HTTP 客户端** | Axios | ^1.6.7 | API 请求 |
| **CSS 框架** | Tailwind CSS | ^3.4.1 | 原子化 CSS 样式 |
| **PostCSS** | PostCSS + Autoprefixer | ^8.4.35 | CSS 后处理 |
| **PPT 导出** | pptxgenjs | ^4.0.1 | 前端生成 PPTX 文件 |
| **代码规范** | ESLint + @typescript-eslint | ^8.56.0 | 代码质量检查 |
| **React 插件** | @vitejs/plugin-react | ^4.2.0 | Vite React 支持 |

### 前端关键配置
- **路径别名**：`@` → `./src`（[`vite.config.ts`](frontend/vite.config.ts:8)）
- **开发代理**：`/api` 和 `/uploads` 代理到 `http://localhost:3003`（[`vite.config.ts`](frontend/vite.config.ts:15)）
- **自定义主题色**：primary 色系（[`tailwind.config.js`](frontend/tailwind.config.js:9)）

---

## 3. 后端技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **运行时** | Node.js | ≥16.0.0 | 服务端 JavaScript 运行时 |
| **Web 框架** | Express | ^4.18.2 | HTTP 服务框架 |
| **语言** | JavaScript (CommonJS) | — | 后端使用 JS |
| **数据库驱动** | mysql2 | ^3.6.5 | MySQL 连接池 |
| **ORM** | Sequelize | ^6.35.2 | 数据库建模（依赖已安装） |
| **认证** | jsonwebtoken (JWT) | ^9.0.2 | Token 认证 |
| **密码加密** | bcryptjs | ^2.4.3 | 密码哈希 |
| **参数校验** | Joi | ^17.11.0 | 请求参数验证 |
| **文件上传** | Multer | ^2.1.1 | multipart/form-data 处理 |
| **HTTP 客户端** | Axios | ^1.6.2 | 调用外部 AI API |
| **跨域** | CORS | ^2.8.5 | 跨域资源共享 |
| **速率限制** | express-rate-limit | ^7.1.5 | API 限流保护 |
| **压缩归档** | archiver | ^8.0.0 | 文件打包下载 |
| **ZIP 处理** | jszip | ^3.10.1 | ZIP 文件操作 |
| **环境变量** | dotenv | ^16.3.1 | .env 配置加载 |
| **终端美化** | chalk | ^4.1.2 | 日志输出着色 |
| **开发热重载** | nodemon | ^3.0.2 | 开发自动重启 |

---

## 4. 数据库

| 项 | 值 |
|----|-----|
| **数据库** | MySQL |
| **驱动** | mysql2（连接池模式） |
| **字符集** | utf8mb4 |
| **时区** | +08:00 |
| **连接池** | 最大 10 连接，支持自动重连与重试 |
| **数据库名** | wangshiyun |

数据库配置详见 [`database.js`](backend/src/config/database.js:14)，SQL 初始化脚本见 [`database_init.sql`](backend/database/database_init.sql)。

---

## 5. AI 能力（多模型集成）

系统集成了多个免费大模型 API，支持智能切换与备用机制：

| 提供商 | 模型 | API 地址 |
|--------|------|----------|
| **智谱 AI（主）** | GLM-4-Flash | `https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| **阿里云 DashScope** | Qwen-Plus | `https://dashscope.aliyuncs.com/...` |
| **腾讯混元** | Hunyuan-Lite | `https://api.tencent.com/v1/...` |
| **百度文心一言** | — | — |
| **豆包 API** | — | — |
| **零一万物** | — | — |
| **火山引擎** | — | — |

AI 服务核心文件：[`aiService.js`](backend/src/services/aiService.js:1)、[`aiConfig.js`](backend/src/config/aiConfig.js:1)

---

## 6. 文档协作（OnlyOffice）

| 项 | 值 |
|----|-----|
| **文档编辑器** | ONLYOFFICE Document Server |
| **前端组件** | [`OnlyOfficeEditor.tsx`](frontend/src/components/OnlyOfficeEditor.tsx:1) |
| **后端回调** | [`onlyoffice.js`](backend/src/routes/onlyoffice.js:1) |
| **支持格式** | PPTX、DOCX、PDF 等 |

---

## 7. 认证与安全

| 项 | 技术 | 说明 |
|----|------|------|
| **认证方式** | JWT (Bearer Token) | Token 有效期 7 天，刷新 30 天 |
| **密码存储** | bcryptjs | 加盐哈希 |
| **API 限流** | express-rate-limit | 15 分钟内最多 100 次请求 |
| **CORS** | cors 中间件 | 可配置允许的来源 |
| **文件类型校验** | Multer + 自定义过滤 | 仅允许图片/文档/视频 |

---

## 8. 部署与容器化

| 项 | 说明 |
|----|------|
| **容器化** | Docker（[`Dockerfile`](backend/Dockerfile:1)） |
| **基础镜像** | `node:16-alpine` |
| **暴露端口** | 3000 |
| **启动命令** | `npm run dev`（nodemon） |

---

## 9. 项目目录结构

```
demo-01/
├── backend/                    # 后端服务
│   ├── server.js               # 入口文件
│   ├── Dockerfile              # Docker 配置
│   ├── database/               # SQL 脚本
│   ├── uploads/                # 上传文件存储
│   │   ├── images/
│   │   ├── documents/
│   │   ├── videos/
│   │   └── pptx/
│   └── src/
│       ├── config/             # 配置（数据库、AI、课程标准等）
│       ├── controllers/        # 控制器
│       ├── middleware/         # 中间件（认证、上传）
│       ├── models/             # 数据模型
│       ├── routes/             # 路由定义
│       └── services/           # 业务服务
├── frontend/                   # 前端应用
│   ├── index.html              # HTML 入口
│   ├── vite.config.ts          # Vite 配置
│   ├── tailwind.config.js      # Tailwind 配置
│   └── src/
│       ├── App.tsx             # 路由入口
│       ├── main.tsx            # React 入口
│       ├── api/                # API 封装
│       ├── components/         # 组件（Layout、PPT编辑器、OnlyOffice等）
│       ├── context/            # Context（Auth）
│       ├── pages/              # 页面
│       ├── types/              # TypeScript 类型
│       └── utils/              # 工具函数（PPT导出等）
├── plans/                      # 项目计划文档
└── database_design.md          # 数据库设计文档
```

---

## 10. 技术栈速查表

| 层 | 技术 |
|----|------|
| 前端框架 | React 18 + TypeScript |
| 前端构建 | Vite 5 |
| 前端样式 | Tailwind CSS 3 |
| 前端路由 | React Router 6 |
| 前端 HTTP | Axios |
| PPT 生成 | pptxgenjs |
| 后端框架 | Express 4 |
| 后端运行时 | Node.js ≥16 |
| 数据库 | MySQL（mysql2 连接池） |
| ORM | Sequelize 6 |
| 认证 | JWT + bcryptjs |
| AI 模型 | 智谱 GLM-4-Flash（主）+ 多家备用 |
| 文档协作 | OnlyOffice Document Server |
| 文件上传 | Multer |
| 参数校验 | Joi |
| 容器化 | Docker (node:16-alpine) |
