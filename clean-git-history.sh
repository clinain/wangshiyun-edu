#!/bin/bash
# ============================================
# 清除Git历史中敏感信息的脚本
# 使用方法: bash clean-git-history.sh
# 
# 注意: 此脚本需要在Git Bash或Linux/Mac终端中运行
# Windows用户请使用Git Bash: 右键 → Git Bash Here
# ============================================

set -e

echo "🔐 开始清除Git历史中的敏感信息..."
echo ""

# 需要清除的敏感信息
SECRET1="18f4bc4ed69b4a3a8305085ea235cecf.vzCP1QZcaXnx6WrS"
SECRET2="ark-663f84d6-503e-44a0-9792-badf6a1865e7-787f5"

# 检查当前目录是否有.git
if [ ! -d ".git" ]; then
    echo "❌ 错误: 当前目录不是Git仓库"
    echo "请切换到项目根目录后重试"
    exit 1
fi

# 显示警告
echo "⚠️  警告: 此操作将重写Git历史！"
echo "   - 所有包含敏感信息的提交将被修改"
echo "   - 这是破坏性操作，请确保已备份"
echo ""
read -p "确认执行? (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "已取消操作"
    exit 0
fi

echo ""
echo "📝 正在重写Git历史..."

# 设置环境变量抑制警告
export FILTER_BRANCH_SQUELCH_WARNING=1

# 使用git filter-branch清除敏感信息
git filter-branch --force --tree-filter '
if [ -f backend/src/config/aiConfig.js ]; then
    sed -i "s/18f4bc4ed69b4a3a8305085ea235cecf\.vzCP1QZcaXnx6WrS//g" backend/src/config/aiConfig.js 2>/dev/null || \
    sed -i '' "s/18f4bc4ed69b4a3a8305085ea235cecf\.vzCP1QZcaXnx6WrS//g" backend/src/config/aiConfig.js
fi
if [ -f backend/.env.production ]; then
    sed -i "s/ark-663f84d6-503e-44a0-9792-badf6a1865e7-787f5//g" backend/.env.production 2>/dev/null || \
    sed -i '' "s/ark-663f84d6-503e-44a0-9792-badf6a1865e7-787f5//g" backend/.env.production
fi
' -- --all

echo ""
echo "🧹 正在清理旧引用和垃圾对象..."

# 清理引用
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ 敏感信息清除完成！"
echo ""
echo "📋 验证结果:"
echo "   搜索智谱密钥: git log -p --all -S \"$SECRET1\""
echo "   搜索火山密钥: git log -p --all -S \"$SECRET2\""
echo ""
echo "⚠️  请执行以下命令将更改推送到远程仓库:"
echo "   git push --force --all"
echo "   git push --force --tags"
echo ""
echo "💡 提示: 如果GitHub上仍有密钥，可能需要等待缓存过期或联系GitHub支持"
