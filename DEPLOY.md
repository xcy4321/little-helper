# 💬 高情商回复小助手 - 部署说明

## 目录

- [1. 前端部署](#1-前端部署)
- [2. 后端部署](#2-后端部署)
- [3. 前后端联调](#3-前后端联调)
- [4. 自定义 System Prompt](#4-自定义-system-prompt)
- [5. 安全警告](#5-安全警告)

---

## 1. 前端部署

前端是纯静态 HTML 文件（`index.html`），可免费托管到以下平台。

### 方案 A：Vercel（推荐）

1. 登录 [vercel.com](https://vercel.com)（可用 GitHub 账号）
2. 点击 **Add New → Project**
3. 导入包含 `index.html` 的 Git 仓库，或使用 **Vercel CLI**：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 在 index.html 所在目录执行
vercel --prod
```

Vercel 会自动识别静态文件并部署，部署后会得到一个 `https://xxx.vercel.app` 域名。

### 方案 B：Netlify

1. 登录 [netlify.com](https://netlify.com)
2. 将 `index.html` 上传到任意 GitHub/GitLab 仓库
3. 点击 **Add new site → Import an existing project**
4. 选择仓库，构建命令留空，发布目录选根目录
5. 点击 **Deploy**

### 方案 C：GitHub Pages

1. 在 GitHub 上创建一个仓库（例如 `eq-reply`）
2. 将 `index.html` 推送到仓库
3. 进入 **Settings → Pages**，将 Source 设为 **Deploy from a branch**，Branch 选 `main`，目录选 `/ (root)`
4. 保存后等待几分钟，即可通过 `https://<你的用户名>.github.io/eq-reply` 访问

---

## 2. 后端部署

后端是 Cloudflare Worker（`worker.js`），需要先获取 DeepSeek API Key。

### 2.1 获取 DeepSeek API Key

1. 访问 [platform.deepseek.com](https://platform.deepseek.com) 并注册/登录
2. 进入 **API Keys** 页面，点击 **Create API key**
3. 复制生成的 Key（格式类似 `sk-xxxxxxxxxxxxxxxx`）

### 2.2 部署 Worker

#### 方式 A：Cloudflare Dashboard（可视化，推荐新手）

1. 登录 [dash.cloudflare.com](https://dash.cloudflare.com)
2. 进入 **Workers & Pages**
3. 点击 **Create application → Create Worker**
4. 给 Worker 命名（例如 `eq-reply-worker`）
5. 将 `worker.js` 的完整内容复制到代码编辑器中，覆盖默认代码
6. 点击 **Save and Deploy**

#### 方式 B：Wrangler CLI（适合开发者）

```bash
# 安装 wrangler
npm i -g wrangler

# 登录 Cloudflare 账号
wrangler login

# 部署
wrangler deploy worker.js --name eq-reply-worker
```

### 2.3 设置环境变量 DEEPSEEK_API_KEY

#### Dashboard 方式

1. 在 Worker 页面点击 **Settings → Variables**
2. 在 **Environment Variables** 下点击 **Add variable**
3. 变量名：`DEEPSEEK_API_KEY`
4. 值：粘贴你的 DeepSeek API Key
5. 点击 **Save**

#### Wrangler 方式

在项目目录创建 `wrangler.toml`：

```toml
name = "eq-reply-worker"
main = "worker.js"

[vars]
DEEPSEEK_API_KEY = "sk-xxxxxxxxxxxxxxxx"
```

然后运行：

```bash
wrangler deploy
```

### 2.4 获取 Worker 地址

部署完成后，你会获得一个类似以下的地址：

```
https://eq-reply-worker.<你的子域名>.workers.dev
```

将此地址记录下来，下一步需要用到。

---

## 3. 前后端联调

1. 打开 `index.html`
2. 找到这一行（约第 82 行）：

```js
const API_URL = 'https://eq-worker.yourdomain.workers.dev';
```

3. 将其替换为你的实际 Worker 地址，例如：

```js
const API_URL = 'https://eq-reply-worker.<你的子域名>.workers.dev';
```

4. 重新部署前端（参考第 1 节），或直接在本地打开 `index.html` 测试

### 请求格式说明

前端发送：

```json
{ "message": "今天被领导批评了" }
```

Worker 接收：

```json
{ "userInput": "今天被领导批评了" }
```

> Worker.js 中会读取 `userInput` 字段；前端 `index.html` 发送的是 `message` 字段。两者已在代码中通过 `body: JSON.stringify({ message: msg })` 发送，因此 Worker 端需要对齐。
>
> **如果不修改 Worker**：请将 `worker.js` 中 `body.userInput` 改为 `body.message`，或将前端 `{ message: msg }` 改为 `{ userInput: msg }`，保持一致即可。

---

## 4. 自定义 System Prompt

打开 `worker.js`，找到 `SYSTEM_PROMPT` 常量（文件顶部附近）：

```js
const SYSTEM_PROMPT = `你是一个高情商回复助手。请根据用户输入，生成一段温暖、共情、智慧的回复。
要求：
- 不要指责对方，不要用说教口吻
- 保持自然口语化
- 长度不超过 100 字
- 如果对方在抱怨，先表示理解再给建议
- 如果对方分享喜悦，热情祝贺`;
```

你可以自由修改这个 Prompt 来调整回复风格，例如：

| 场景 | 修改建议 |
|------|----------|
| 更幽默 | 增加 "适当加入幽默元素" |
| 更正式 | 改为 "使用正式、得体的商务语气" |
| 更简短 | 将字数限制改为 50 字 |
| 更温柔 | 增加 "多用语气词，如 啦、呀、呢" |

修改后重新部署 Worker 即可生效。

---

## 5. 安全警告

- **不要将 `DEEPSEEK_API_KEY` 硬编码在 `worker.js` 中**，必须通过环境变量传入
- **不要将 API Key 提交到公开的 Git 仓库**，建议将 `wrangler.toml` 加入 `.gitignore`
- `.gitignore` 参考内容：

```
node_modules/
.wrangler/
wrangler.toml
```

- `index.html` 中的 `API_URL` 是 Worker 地址，**不包含任何敏感信息**，提交到仓库是安全的
- 如果 API Key 意外泄露，请立即到 DeepSeek 平台删除并重新生成
