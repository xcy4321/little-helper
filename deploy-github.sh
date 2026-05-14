#!/usr/bin/env bash
set -euo pipefail

# ============================================
# 高情商回复小助手 - GitHub Pages 一键部署脚本
# ============================================

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  💬 高情商回复小助手 - 部署脚本${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 1. 初始化 Git 仓库
if [ ! -d ".git" ]; then
  echo -e "${YELLOW}[1/4] 初始化 Git 仓库...${NC}"
  git init
  git checkout -b main
else
  echo -e "${YELLOW}[1/4] Git 仓库已存在，跳过初始化${NC}"
fi

# 2. 添加并提交
echo -e "${YELLOW}[2/4] 添加文件并提交...${NC}"
git add .
git commit -m "feat: 高情商回复小助手 - 初版" || true

# 3. 推送到远程
echo -e "${YELLOW}[3/4] 推送到 GitHub 远程仓库...${NC}"
echo ""
echo -e "请输入你的 GitHub 仓库地址（例如 ${GREEN}https://github.com/你的用户名/eq-reply.git${NC}）："
read -p "仓库地址: " REPO_URL

if [ -z "$REPO_URL" ]; then
  echo -e "\033[0;31m❌ 仓库地址不能为空，脚本终止${NC}"
  exit 1
fi

# 如果 remote origin 已存在，先删除
if git remote get-url origin &>/dev/null 2>&1; then
  git remote remove origin
fi

git remote add origin "$REPO_URL"
git push -u origin main

echo ""
echo -e "${GREEN}✅ 推送成功！${NC}"
echo ""

# 4. 提示开启 GitHub Pages
echo -e "${YELLOW}[4/4] 接下来请手动完成以下操作：${NC}"
echo ""
echo -e "  1. 打开浏览器，进入你的 GitHub 仓库："
echo -e "     ${CYAN}$REPO_URL${NC}"
echo ""
echo -e "  2. 点击 ${YELLOW}Settings → Pages${NC}"
echo ""
echo -e "  3. 在 ${YELLOW}Build and deployment${NC} 区域："
echo -e "     - ${YELLOW}Source${NC} 选择 ${GREEN}GitHub Actions${NC}"
echo ""
echo -e "  4. 回到仓库 ${YELLOW}Actions${NC} 页面，"
echo -e "     等待名为 ${GREEN}\"Deploy to GitHub Pages\"${NC} 的工作流运行完成"
echo ""
echo -e "  5. 工作流完成后，你的页面将在以下地址可用："
echo -e "     ${CYAN}https://<你的用户名>.github.io/<仓库名>/${NC}"
echo ""
echo -e "========================================"
echo -e " ${GREEN}🎉 部署流程完成！${NC}"
echo -e "========================================"
