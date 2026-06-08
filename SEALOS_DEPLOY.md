# Sealos 一键部署指南

## 第一步：注册并登录

1. 打开浏览器访问 **https://sealos.io**
2. 点击右上角 **"登录"**
3. 用**手机号**注册并登录

## 第二步：创建数据库

1. 登录后进入 **"应用部署"** 或 **"控制台"**
2. 点击 **"+"** 或 **"新建应用"**
3. 选择 **"数据库"** → **"MySQL"**
4. 配置：
   - 名称：`wangshiyun-db`
   - 版本：`8.0`
   - 内存：`256MB`（免费额度内）
5. 点击 **"部署"**
6. 等待数据库启动，记下连接信息：
   - 主机地址（类似 `mysql-xxx.cluster-xxx.svc`）
   - 端口：`3306`
   - 用户名：`root`
   - 密码：（自动生成的）

## 第三步：部署后端

1. 点击 **"+"** → **"从 Git 仓库部署"**
2. 仓库地址：`https://gitee.com/mugvin/wangshiyun.git`
3. 选择 **"Dockerfile"** 部署方式
4. 构建目录：`backend`
5. 添加环境变量：

| 变量名 | 值 |
|--------|-----|
| NODE_ENV | production |
| PORT | 3003 |
| DB_HOST | （第二步的主机地址） |
| DB_PORT | 3306 |
| DB_NAME | wangshiyun |
| DB_USER | root |
| DB_PASSWORD | （第二步的密码） |
| JWT_SECRET | my_super_secret_key_2024 |
| CORS_ORIGIN | * |

6. 点击 **"部署"**
7. 部署成功后，记下后端的公网 URL

## 第四步：部署前端

1. 点击 **"+"** → **"从 Git 仓库部署"**
2. 仓库地址：`https://gitee.com/mugvin/wangshiyun.git`
3. 选择 **"静态网站"** 或 **"Vite"** 模板
4. 构建目录：`frontend`
5. 构建命令：`npm run build`
6. 输出目录：`dist`
7. 添加环境变量：
   - `VITE_API_URL` = （第三步后端的公网 URL）/api
8. 点击 **"部署"**

## 第五步：访问网站

部署成功后，Sealos 会给你一个公网 URL，例如：
`https://xxx.app.sealos.io`

把这个链接分享给任何人，他们就能访问你的网站了！

---

## 常见问题

### Q: 部署失败怎么办？
A: 查看应用日志，检查环境变量是否正确配置。

### Q: 数据库连接不上？
A: 确保 DB_HOST 使用的是 Sealos 内部地址，不是 localhost。

### Q: 免费额度用完了？
A: Sealos 新用户有免费额度，用完后可以升级或等待重置。
