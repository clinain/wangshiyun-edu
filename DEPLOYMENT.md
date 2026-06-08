# 网师云 - 部署指南

## 一、服务器环境要求

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| 操作系统 | Ubuntu 20.04 / CentOS 7+ | Ubuntu 22.04 LTS |
| Node.js | ≥ 16.0.0 | 18.x LTS |
| MySQL | ≥ 5.7 | 8.0 |
| 内存 | 2GB | 4GB+ |
| 磁盘 | 20GB | 50GB+（含上传文件） |
| OnlyOffice | Document Server 7.x | 最新稳定版 |

## 二、快速部署（Docker）

### 1. 克隆项目

```bash
git clone <仓库地址> wangshiyun
cd wangshiyun
```

### 2. 配置环境变量

```bash
# 后端配置
cp backend/.env.production backend/.env
# ⚠️ 编辑 backend/.env，修改所有密钥和密码

# 前端配置
cp frontend/.env.production frontend/.env
# ⚠️ 编辑 frontend/.env，修改 API 地址
```

### 3. 一键启动

```bash
# 使用 Docker Compose（推荐）
docker-compose up -d

# 或手动启动
cd backend && npm install --production && npm start
cd frontend && npm install && npm run build
```

## 三、手动部署

### 步骤 1：安装系统依赖

```bash
# Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# MySQL 8.0
sudo apt-get install -y mysql-server
sudo mysql_secure_installation
```

### 步骤 2：创建数据库

```bash
mysql -u root -p
```

```sql
CREATE DATABASE wangshiyun CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wangshiyun_app'@'localhost' IDENTIFIED BY '请替换为强密码';
GRANT ALL PRIVILEGES ON wangshiyun.* TO 'wangshiyun_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 步骤 3：初始化数据库表

```bash
cd backend
cp .env.production .env
# 编辑 .env 填写数据库密码等配置
node init_db.js
```

### 步骤 4：部署后端

```bash
cd backend
npm install --production

# 使用 PM2 管理进程（推荐）
npm install -g pm2
pm2 start server.js --name wangshiyun-api
pm2 save
pm2 startup  # 设置开机自启

# 查看日志
pm2 logs wangshiyun-api
```

### 步骤 5：部署前端

```bash
cd frontend
npm install
npm run build

# 将 dist 目录部署到 Nginx
sudo cp -r dist/* /var/www/wangshiyun/
```

### 步骤 6：配置 Nginx

```nginx
# /etc/nginx/sites-available/wangshiyun

server {
    listen 80;
    server_name 你的域名.com;
    
    # 强制 HTTPS（推荐）
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 你的域名.com;

    # SSL 证书（Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/你的域名.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/你的域名.com/privkey.pem;

    # 前端静态文件
    root /var/www/wangshiyun;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;  # AI 生成可能耗时较长
        client_max_body_size 100m;
    }

    # 上传文件访问
    location /uploads/ {
        proxy_pass http://127.0.0.1:3003;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # OnlyOffice Document Server 代理
    location /onlyoffice/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/wangshiyun /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 步骤 7：安装 OnlyOffice Document Server（Docker）

```bash
docker run -i -t -d -p 8080:80 \
  --name onlyoffice-document-server \
  --restart=always \
  onlyoffice/documentserver
```

### 步骤 8：申请 SSL 证书

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名.com
```

## 四、环境变量说明

### 后端关键配置（backend/.env）

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
| `UNSLASH_ACCESS_KEY` | Unsplash API Key（PPT 配图） | 可选 |

### 前端关键配置（frontend/.env）

| 变量 | 说明 | 必填 |
|------|------|------|
| `VITE_API_URL` | 后端 API 地址 | ✅ |

## 五、安全检查清单

- [ ] `JWT_SECRET` 已替换为随机强密钥
- [ ] `DB_PASSWORD` 已替换为强密码
- [ ] `CORS_ORIGIN` 已设置为具体域名（非 `*`）
- [ ] 所有 AI API Key 已确认有效
- [ ] MySQL 已禁用 root 远程登录
- [ ] 防火墙只开放 80/443 端口
- [ ] Nginx 已配置 SSL
- [ ] `.env` 文件权限设为 600（`chmod 600 .env`）
- [ ] `uploads/` 目录权限正确（755）
- [ ] PM2 已配置开机自启

## 六、常用运维命令

```bash
# 查看后端日志
pm2 logs wangshiyun-api

# 重启后端
pm2 restart wangshiyun-api

# 查看后端状态
pm2 status

# 查看数据库
mysql -u wangshiyun_app -p wangshiyun

# 检查 Nginx 配置
sudo nginx -t

# 更新前端
cd frontend && npm run build && sudo cp -r dist/* /var/www/wangshiyun/

# 更新后端
cd backend && npm install --production && pm2 restart wangshiyun-api
```

## 七、故障排查

| 问题 | 排查方法 |
|------|----------|
| API 500 错误 | `pm2 logs wangshiyun-api` 查看日志 |
| 数据库连接失败 | 检查 `DB_HOST`、`DB_PASSWORD`，确认 MySQL 已启动 |
| AI 生成失败 | 检查 API Key 是否有效，查看日志中的超时错误 |
| 文件上传失败 | 检查 `uploads/` 目录权限，确认 `client_max_body_size` |
| OnlyOffice 无法编辑 | 确认 8080 端口开放，Docker 容器运行中 |
| CORS 错误 | 检查 `CORS_ORIGIN` 是否匹配前端域名 |
