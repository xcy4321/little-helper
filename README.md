# 💬 高情商回复小助手

一个纯前端的 AI 回复生成工具，帮你写出温暖、共情、高情商的回复。后端由 Cloudflare Worker 代理调用 DeepSeek API。

## 项目结构

```
.
├── index.html              # 前端页面（深色主题，移动端适配）
├── worker.js               # Cloudflare Worker 后端代理
├── DEPLOY.md               # 前后端详细部署说明
├── TEST_CASES.md           # 测试用例（含 6 种场景）
├── deploy-github.sh        # GitHub Pages 一键部署脚本 (bash)
├── scf/
│   └── index.js            # 腾讯云函数适配版（可选后端）
├── fc/
│   └── index.js            # 阿里云函数计算适配版（可选后端）
└── .github/workflows/
    └── deploy-pages.yml    # GitHub Actions 自动部署工作流
```

## 快速开始

### 1. 部署后端（Cloudflare Worker）

详见 [DEPLOY.md](./DEPLOY.md#2-后端部署)。

简要步骤：
1. 获取 [DeepSeek API Key](https://platform.deepseek.com)
2. 将 `worker.js` 部署到 Cloudflare Workers
3. 设置环境变量 `DEEPSEEK_API_KEY`
4. 记录下 Worker 地址

### 2. 配置前端

打开 `index.html`，将 `API_URL` 替换为你的 Worker 地址：

```js
const API_URL = 'https://你的-worker.workers.dev';
```

### 3. 部署前端到 GitHub Pages

本项目已内置 GitHub Actions 工作流，推送即可自动部署。

#### 方式一：一键脚本部署（推荐）

```bash
# 在项目根目录执行
chmod +x deploy-github.sh
./deploy-github.sh
```

脚本会完成：初始化仓库 → 提交 → 推送到远程，之后去 GitHub 仓库 **Settings → Pages** 选择 **GitHub Actions** 作为部署源即可。

#### 方式二：手动推送

```bash
git init
git checkout -b main
git add .
git commit -m "feat: 高情商回复小助手"
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

推送完成后，进入 GitHub 仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**，等待 Actions 自动部署完成即可。

#### 访问地址

部署完成后，页面将在以下地址可用：

```
https://<你的用户名>.github.io/<仓库名>/
```

其他平台（Vercel / Netlify）部署方式请参考 [DEPLOY.md](./DEPLOY.md#1-前端部署)。

## 自定义 Prompt

修改 `worker.js` 中的 `SYSTEM_PROMPT` 常量即可调整回复风格。示例：

```js
const SYSTEM_PROMPT = `你是一个高情商回复助手。请根据用户输入，生成一段温暖、共情、智慧的回复。
要求：
- 不要指责对方，不要用说教口吻
- 保持自然口语化
- 长度不超过 100 字
- 如果对方在抱怨，先表示理解再给建议
- 如果对方分享喜悦，热情祝贺`;
```

## 测试

参考 [TEST_CASES.md](./TEST_CASES.md) 中的 6 个测试用例验证功能。

## 安全提醒

- API Key 通过环境变量传入 Worker，**不要硬编码在代码中**
- 不要将 API Key 提交到公开仓库
- `index.html` 中的 `API_URL` 不包含敏感信息，可安全提交

## License

MIT
