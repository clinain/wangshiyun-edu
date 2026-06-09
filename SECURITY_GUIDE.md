# 🔐 API密钥安全指南

## ⚠️ 重要提醒

你的API密钥已经暴露在GitHub仓库中，必须立即执行以下操作：

---

## 第一步：立即轮换所有暴露的API密钥

以下密钥需要立即在对应平台重新生成：

### 1. 智谱AI API密钥
- **暴露位置**: `backend/src/config/aiConfig.js`（已修复）
- **操作**: 登录 [智谱AI开放平台](https://open.bigmodel.cn/) → API密钥管理 → 重新生成密钥

### 2. 火山引擎 API密钥
- **暴露位置**: `backend/.env.production`（已修复）
- **操作**: 登录 [火山引擎控制台](https://console.volcengine.com/) → API密钥管理 → 重新生成密钥

---

## 第二步：从Git历史中清除敏感信息

**警告**: 仅修改文件并重新提交是不够的，Git历史中仍保留着旧的密钥。

### 方法1：使用 BFG Repo-Cleaner（推荐）

```bash
# 1. 下载 BFG（需要Java环境）
# https://rtyley.github.io/bfg-repo-cleaner/

# 2. 克隆仓库的镜像副本
git clone --mirror https://github.com/你的用户名/你的仓库名.git

# 3. 使用BFG清除敏感信息
bfg --replace-text secrets.txt your-repo.git

# 4. 创建 secrets.txt 文件，内容格式：
# 现有密钥==>***REMOVED***
```

### 方法2：使用项目提供的脚本（最简单）

```bash
# 在项目根目录，使用 Git Bash 执行
bash clean-git-history.sh
```

> **Windows用户注意**: 请使用 Git Bash 右键菜单打开终端执行，不要使用 cmd 或 PowerShell

### 方法3：使用 git filter-branch

```bash
# 从所有历史中删除特定文件
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/.env.production' \
  --prune-empty --tag-name-filter cat -- --all

# 清理引用
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 方法4：使用 git-filter-repo（Python工具，推荐）

```bash
# 安装
pip install git-filter-repo

# 克隆镜像
git clone --mirror https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名.git

# 清除 .env.production 文件
git filter-repo --path backend/.env.production --invert-paths

# 清除特定内容（替换实际密钥）
git filter-repo --replace-text <(echo "你的实际密钥==>***REMOVED***")
```

---

## 第三步：强制推送更新

```bash
# 推送清理后的历史（会覆盖远程仓库）
git push --force --all
git push --force --tags
```

---

## 第四步：更新 .gitignore

已更新 `.gitignore` 文件，添加了以下忽略规则：

```gitignore
# 环境变量文件（包含敏感信息）
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.production          # 新增
backend/.env.production  # 新增
frontend/.env.production # 新增
```

---

## 第五步：创建 .env.example 模板

在部署时使用模板文件，不要直接使用包含真实密钥的 `.env.production`：

```bash
# 部署时的操作步骤：
cp backend/.env.example backend/.env.production
# 然后编辑 .env.production 填入新的API密钥
```

---

## 第六步：使用GitHub Secrets（推荐）

对于GitHub Actions部署，将密钥存储在仓库的 Secrets 中：

1. 进入 GitHub 仓库 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. 添加以下密钥：
   - `ZHIPU_API_KEY`: 你的新智谱API密钥
   - `VOLCENGINE_API_KEY`: 你的新火山引擎API密钥
   - `DB_PASSWORD`: 数据库密码
   - `JWT_SECRET`: JWT密钥

---

## 第七步：验证修复

### 检查当前代码
```bash
# 搜索可能遗漏的硬编码密钥
grep -r "api_key\|secret\|token\|password" --include="*.js" --include="*.ts" backend/ frontend/
```

### 检查Git历史
```bash
# 搜索Git历史中的敏感信息
git log -p | grep -E "(你的旧密钥|API_KEY|SECRET)" 
```

---

## 📋 检查清单

- [ ] 智谱AI API密钥已重新生成
- [ ] 火山引擎 API密钥已重新生成
- [ ] `.gitignore` 已更新（已自动完成）
- [ ] `backend/src/config/aiConfig.js` 硬编码密钥已移除（已自动完成）
- [ ] `backend/.env.production` 真实密钥已替换为占位符（已自动完成）
- [ ] Git历史中的敏感信息已清除
- [ ] 所有环境变量已配置到部署平台
- [ ] 本地开发环境 `.env` 文件已创建

---

## 🚨 紧急联系

如果你的API密钥被恶意使用：
1. 立即在对应平台禁用/删除该密钥
2. 检查API使用记录，确认是否有异常调用
3. 联系平台客服报告密钥泄露情况
