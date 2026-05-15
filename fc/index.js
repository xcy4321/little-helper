/**
 * 阿里云函数计算（Web 函数）- 高情商回复小助手 API 适配版
 *
 * Web 函数需要自行启动 HTTP 服务，平台将请求转发到监听端口。
 *
 * 部署方式：
 * 1. 在阿里云 FC 控制台创建 Web 函数
 *    - 运行环境: Node.js 18+
 *    - 启动命令: node index.js
 *    - 监听端口: 9000
 * 2. 触发器: HTTP 触发器（匿名，勾选 POST + OPTIONS）
 * 3. 在环境变量中添加 DEEPSEEK_API_KEY
 * 4. 将生成的 HTTP 触发 URL 更新到前端 index.html 的 API_URL
 *
 * 测试：
 *   curl -X POST https://<函数URL> \
 *     -H "Content-Type: application/json" \
 *     -d '{"userInput":"今天被领导批评了"}'
 */

const http = require('http');
const SYSTEM_PROMPT = `你是一个高情商回复助手。请根据用户输入，生成一段温暖、共情、智慧的回复。
要求：
- 不要指责对方，不要用说教口吻
- 保持自然口语化
- 长度不超过 100 字
- 如果对方在抱怨，先表示理解再给建议
- 如果对方分享喜悦，热情祝贺`;

const DAILY_LIMIT = 100;
const ipCounts = {};

function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(data));
}

function collectBody(req) {
  return new Promise((resolve) => {
    let chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });
}

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    jsonResponse(res, 405, { reply: '仅支持 POST 请求' });
    return;
  }

  let userInput;
  try {
    const body = JSON.parse(await collectBody(req));
    userInput = body.userInput;
  } catch {
    jsonResponse(res, 400, { reply: '请求格式错误' });
    return;
  }

  if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
    jsonResponse(res, 400, { reply: '请输入有效内容' });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || 'unknown';
  const today = new Date().toISOString().slice(0, 10);
  const key = `${ip}:${today}`;
  ipCounts[key] = (ipCounts[key] || 0) + 1;

  if (ipCounts[key] > DAILY_LIMIT) {
    jsonResponse(res, 429, { reply: '今日次数已用完（每日限 100 次），明天再来吧~' });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    jsonResponse(res, 500, { reply: '生成失败，请重试' });
    return;
  }

  try {
    const result = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userInput },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!result.ok) {
      console.error('DeepSeek API error:', result.status);
      jsonResponse(res, 200, { reply: '生成失败，请重试' });
      return;
    }

    const data = await result.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '生成失败，请重试';

    jsonResponse(res, 200, { reply });
  } catch (err) {
    console.error('Request failed:', err);
    jsonResponse(res, 200, { reply: '生成失败，请重试' });
  }
}).listen(9000, () => console.log('Server ready on 9000'));
