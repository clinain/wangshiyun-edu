# 网师云 - 部署上线指南

## 方案一：免费方案（推荐先试试）

### 前端部署到 Vercel（免费，全球加速）

1. 注册 [Vercel](https://vercel.com) 账号（可用 GitHub 登录）
2. 点击 "Import Project" → 选择你的 GitHub/Gitee 仓库
3. 选择 `frontend` 目录作为根目录
4. 构建命令：`npm run build`
5. 输出目录：`dist`
6. 点击 Deploy

### 后端部署到 Render（免费）

1. 注册 [Render](https://render.com) 账号
2. 点击 "New Web Service"
3. 连接你的代码仓库
4. 选择 `backend` 目录
5. 构建命令：`npm install`
6. 启动命令：`node server.js`
7. 添加环境变量（参考 backend/.env）

### 数据库使用 PlanetScale 或 Supabase（免费）

- [PlanetScale](https://planetscale.com) - MySQL 兼容，免费额度
- [Supabase](https://supabase.com) - PostgreSQL，免费额度

---

## 方案二：国内云服务器（推荐，稳定快速）

### 推荐：阿里云学生机（9.9元/月）

1. 访问 [https://developer.aliyun.com/plan/student](https://developer.aliyun.com/plan/student)
2. 实名认证后购买学生机（2核2G，约9.9元/月）
3. 选择 Ubuntu 22.04 系统

### 部署步骤

```bash
# 1. 连接服务器
ssh root@你的服务器IP

# 2. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 安装 MySQL
sudo apt-get install -y mysql-server
sudo mysql_secure_installation

# 4. 安装 PM2（进程管理）
sudo npm install -g pm2

# 5. 克隆代码
git clone https://gitee.com/mugvin/wangshiyun.git
cd wangshiyun

# 6. 配置后端
cd backend
cp .env.example .env
# 编辑 .env 文件，修改数据库密码等配置
nano .env

# 7. 安装依赖
npm install --production

# 8. 初始化数据库
mysql -u root -p < database/database_init.sql

# 9. 启动后端
pm2 start server.js --name wangshiyun-api
pm2 save
pm2 startup

# 10. 构建前端
cd ../frontend
npm install
npm run build

# 11. 安装 Nginx
sudo apt-get install -y nginx

# 12. 配置 Nginx
sudo nano /etc/nginx/sites-available/wangshiyun
```

### Nginx 配置文件

```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    # 前端静态文件
    location / {
        root /root/wangshiyun/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传文件代理
    location /uploads {
        proxy_pass http://127.0.0.1:3003;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/wangshiyun /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 域名配置

1. 购买域名（阿里云/腾讯云/GoDaddy）
2. 在域名服务商处添加 A 记录，指向你的服务器 IP
3. 在 Nginx 配置中修改 `server_name` 为你的域名

### SSL 证书（HTTPS）

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 自动配置 HTTPS
sudo certbot --nginx -d your-domain.com
```

---

## 方案三：Docker 部署（推荐）

```bash
# 构建并启动
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

---

## 访问地址

部署成功后，通过以下地址访问：
- 前端：http://你的服务器IP 或 http://你的域名
- 后端 API：http://你的服务器IP/api
- 健康检查：http://你的服务器IP/health

---

## 注意事项

1. **安全配置**：修改 backend/.env 中的 JWT_SECRET 和数据库密码
2. **防火墙**：开放 80、443、3003 端口
3. **数据备份**：定期备份 MySQL 数据库
4. **监控**：使用 PM2 或 Docker 的日志功能监控运行状态
