# 网师云 — 师范生备课辅助系统

> 基于 React + Node.js + MySQL 的师范生备课辅助系统，集成 AI 智能生成、PPT 制作、文档协作等功能。

---

## 项目架构

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

## 技术栈

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

---

## 项目目录结构

```
demo-01/
├── backend/                    # 后端服务
│   ├── server.js               # 入口文件
│   ├── Dockerfile              # Docker 配置
│   ├── .env.example            # 环境变量模板
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
└── 新课标/                      # 课程标准 PDF 文件
```

---

## 数据库设计

系统采用 MySQL 数据库，支持多用户场景。核心表结构：

| 表名 | 说明 |
|------|------|
| `users` | 用户信息（账号、密码、角色、学校等） |
| `lessons` | 教案（标题、学科、年级、教学目标、教学过程等） |
| `user_ppt_records` | PPT 记录（关联教案、内容 JSON、页数等） |
| `portfolios` | 作品集（教案/PPT 组合，可公开/私有） |
| `resources` | 教学资源（文档、视频、图片等） |
| `user_favorites` | 用户收藏 |

SQL 初始化脚本见 `backend/database/database_init.sql`。

---

## AI 能力

系统集成多个免费大模型 API，支持智能切换与备用：

| 提供商 | 模型 |
|--------|------|
| **智谱 AI（主）** | GLM-4-Flash |
| **阿里云 DashScope** | Qwen-Plus |
| **腾讯混元** | Hunyuan-Lite |
| **百度文心一言** | — |
| **豆包 API** | — |

AI 服务核心文件：`backend/src/services/aiService.js`、`backend/src/config/aiConfig.js`

---

## 快速开始

### 环境要求

| 组件 | 最低要求 |
|------|----------|
| Node.js | ≥ 16.0.0 |
| MySQL | ≥ 5.7 |

### 本地开发

```bash
# 1. 克隆项目
git clone <仓库地址>
cd wangshiyun

# 2. 配置后端环境变量
cd backend
cp .env.example .env
# 编辑 .env，填写数据库密码等配置

# 3. 初始化数据库
mysql -u root -p < database/database_init.sql

# 4. 安装依赖并启动后端
npm install
npm run dev

# 5. 安装依赖并启动前端（新终端）
cd ../frontend
npm install
npm run dev
```

前端访问：`http://localhost:5173`，后端 API：`http://localhost:3003`

### 环境变量配置

**后端关键配置（backend/.env）：**

| 变量 | 说明 | 必填 |
|------|------|------|
| `NODE_ENV` | 环境（production/development） | ✅ |
| `PORT` | 后端端口 | ✅ |
| `DB_HOST` | 数据库地址 | ✅ |
| `DB_PASSWORD` | 数据库密码 | ✅ |
| `JWT_SECRET` | JWT 密钥（必须随机强密钥） | ✅ |
| `CORS_ORIGIN` | 允许的前端域名 | ✅ |
| `VOLCENGINE_API_KEY` | 火山引擎 API Key | ✅ |
| `ZHIPU_API_KEY` | 智谱 API Key（备用） | 推荐 |

**前端关键配置（frontend/.env）：**

| 变量 | 说明 | 必填 |
|------|------|------|
| `VITE_API_URL` | 后端 API 地址 | ✅ |

---

## 部署指南

### 方案一：Docker 部署（推荐）

```bash
docker-compose up -d
docker-compose ps
docker-compose logs -f
```

### 方案二：手动部署

```bash
# 后端
cd backend
npm install --production
npm install -g pm2
pm2 start server.js --name wangshiyun-api
pm2 save
pm2 startup

# 前端
cd frontend
npm install
npm run build
# 将 dist 目录部署到 Nginx
```

### 方案三：免费方案

- **前端**：部署到 [Vercel](https://vercel.com)（免费，全球加速）
- **后端**：部署到 [Render](https://render.com)（免费）
- **数据库**：使用 [PlanetScale](https://planetscale.com)（MySQL 兼容，免费额度）

### 方案四：Sealos 一键部署

1. 注册 [Sealos](https://sealos.io)
2. 创建 MySQL 数据库
3. 从 Git 仓库部署后端（Dockerfile 方式）
4. 部署前端（静态网站方式）

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name 你的域名.com;

    location / {
        root /var/www/wangshiyun;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
        client_max_body_size 100m;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3003;
        expires 30d;
    }
}
```

---

## 安全指南

### API 密钥安全

1. **不要**将 API 密钥硬编码在代码中
2. 使用 `.env` 文件存储敏感信息（已加入 `.gitignore`）
3. 使用 `.env.example` 作为模板，部署时复制为 `.env` 并填入真实密钥
4. 使用 GitHub Secrets 存储 CI/CD 中的密钥

### 部署安全检查清单

- [ ] `JWT_SECRET` 已替换为随机强密钥
- [ ] `DB_PASSWORD` 已替换为强密码
- [ ] `CORS_ORIGIN` 已设置为具体域名（非 `*`）
- [ ] 所有 AI API Key 已确认有效
- [ ] MySQL 已禁用 root 远程登录
- [ ] 防火墙只开放 80/443 端口
- [ ] Nginx 已配置 SSL
- [ ] `.env` 文件权限设为 600

---

## 常见问题

| 问题 | 排查方法 |
|------|----------|
| API 500 错误 | 查看后端日志 |
| 数据库连接失败 | 检查 `DB_HOST`、`DB_PASSWORD`，确认 MySQL 已启动 |
| AI 生成失败 | 检查 API Key 是否有效，查看日志中的超时错误 |
| 文件上传失败 | 检查 `uploads/` 目录权限，确认 `client_max_body_size` |
| CORS 错误 | 检查 `CORS_ORIGIN` 是否匹配前端域名 |
| OnlyOffice 无法编辑 | 确认 8080 端口开放，Docker 容器运行中 |

---

## 运维命令

```bash
# 查看后端日志
pm2 logs wangshiyun-api

# 重启后端
pm2 restart wangshiyun-api

# 查看后端状态
pm2 status

# 更新前端
cd frontend && npm run build && sudo cp -r dist/* /var/www/wangshiyun/

# 更新后端
cd backend && npm install --production && pm2 restart wangshiyun-api
```
