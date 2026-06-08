# 网师云 - GitHub 部署指南

## 📋 已完成的配置

- ✅ 代码已推送到 GitHub: `https://github.com/clinain/wangshiyun`
- ✅ 前端 `vite.config.ts` 已配置 GitHub Pages base 路径 (`/wangshiyun/`)
- ✅ `frontend/public/404.html` 已创建（SPA 路由支持）
- ✅ GitHub Actions 工作流已配置（`.github/workflows/deploy-frontend.yml`）

---

## 🚀 步骤 1：推送剩余代码（如网络不稳定）

如果之前推送因网络问题失败，等网络恢复后执行：

```bash
cd d:/Trae/demo-01
git push origin master
```

### 如果需要代理访问 GitHub：

```bash
# 设置 HTTP 代理（替换为你的代理端口）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 推送完成后取消代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```

---

## 🌐 步骤 2：启用 GitHub Pages

1. 打开浏览器访问: `https://github.com/clinain/wangshiyun`
2. 点击 **Settings**（设置）标签
3. 左侧菜单点击 **Pages**
4. 在 **Source** 部分：
   - Source 选择 **GitHub Actions**
5. 保存

### 配置环境变量（可选）

在 Settings → Pages 下方，或 Settings → Secrets and variables → Actions → Variables 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_API_URL` | `https://你的后端地址/api` | 后端 API 地址 |

---

## ⚡ 步骤 3：触发自动部署

代码推送到 `master` 分支后，GitHub Actions 会自动：
1. 检出代码
2. 安装前端依赖
3. 构建前端 (`npm run build`)
4. 部署到 GitHub Pages

### 查看部署状态

1. 访问 `https://github.com/clinain/wangshiyun/actions`
2. 查看 "部署前端到 GitHub Pages" 工作流的运行状态
3. 部署成功后，访问: **https://clinain.github.io/wangshiyun/**

---

## 🔧 步骤 4：后端部署方案

GitHub Pages 只能托管静态文件，后端需要单独部署。推荐方案：

### 方案 A：Render（免费，推荐）

1. 访问 [https://render.com](https://render.com) 注册账号
2. 点击 **New Web Service**
3. 连接 GitHub 仓库 `clinain/wangshiyun`
4. 配置：
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. 添加环境变量（参考 `backend/.env.example`）：

```
DB_HOST=你的数据库地址
DB_USER=数据库用户名
DB_PASSWORD=数据库密码
DB_NAME=数据库名
JWT_SECRET=你的密钥
PORT=3003
```

6. 部署后获取 URL（如 `https://wangshiyun-api.onrender.com`）

### 方案 B：Railway（免费额度）

1. 访问 [https://railway.app](https://railway.app)
2. 类似 Render 的配置流程

### 方案 C：自有服务器

如果有阿里云/腾讯云服务器：

```bash
# 1. SSH 连接服务器
ssh root@你的服务器IP

# 2. 克隆代码
git clone https://github.com/clinain/wangshiyun.git
cd wangshiyun/backend

# 3. 安装依赖
npm install --production

# 4. 配置环境变量
cp .env.example .env
nano .env  # 编辑配置

# 5. 使用 PM2 启动
npm install -g pm2
pm2 start server.js --name wangshiyun-api
pm2 save
pm2 startup
```

---

## 🔗 步骤 5：连接前端和后端

部署后端后，需要更新前端的 API 地址：

### 方法 1：修改环境变量

编辑 `frontend/.env.production`：

```env
VITE_API_URL=https://你的后端地址/api
```

然后重新提交推送：

```bash
git add frontend/.env.production
git commit -m "chore: 更新生产环境 API 地址"
git push origin master
```

### 方法 2：在 GitHub Actions 中配置

1. 进入仓库 Settings → Secrets and variables → Actions
2. 添加 Variable:
   - Name: `VITE_API_URL`
   - Value: `https://你的后端地址/api`
3. 下次部署时会自动使用

---

## 🗄️ 数据库部署

### 方案 A：PlanetScale（免费，MySQL 兼容）

1. 注册 [PlanetScale](https://planetscale.com)
2. 创建数据库
3. 导入 `backend/database/database_init.sql`
4. 获取连接字符串

### 方案 B：Supabase（免费，PostgreSQL）

1. 注册 [Supabase](https://supabase.com)
2. 创建项目
3. 在 SQL Editor 中执行建表语句

### 方案 C：Railway MySQL

1. 在 Railway 项目中添加 MySQL 插件
2. 获取连接信息

---

## 🐛 常见问题

### Q1: 页面显示 404

确保 GitHub Pages 设置中 Source 选择的是 **GitHub Actions**，不是 "Deploy from a branch"。

### Q2: API 请求失败（CORS 错误）

后端需要配置 CORS 允许前端域名。在 `backend/server.js` 中确保：

```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://clinain.github.io', 'http://localhost:5173'],
  credentials: true
}));
```

### Q3: 静态资源加载失败

确认 `frontend/vite.config.ts` 中 `base` 设置为 `/wangshiyun/`。

### Q4: GitHub Actions 部署失败

1. 检查 Actions 日志
2. 确保 `frontend/package-lock.json` 存在
3. 确保 Node.js 版本兼容

### Q5: 网络无法连接 GitHub

使用代理或通过 Gitee 同步：

```bash
# 添加 Gitee 远程仓库
git remote add gitee https://gitee.com/mugvin/wangshiyun.git
git push gitee master
```

---

## 📱 部署后测试清单

- [ ] 前端页面正常加载: `https://clinain.github.io/wangshiyun/`
- [ ] 登录/注册功能正常
- [ ] 课程列表加载正常
- [ ] API 请求指向正确的后端地址
- [ ] 静态资源（图片等）正常加载
- [ ] 路由刷新不会 404
