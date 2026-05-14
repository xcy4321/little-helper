/**
 * 腾讯云函数 - 高情商回复小助手 API 适配版
 *
 * 部署方式：
 * 1. 在腾讯云 SCF 控制台创建 Node.js 18+ 云函数
 * 2. 将本文件内容上传/粘贴作为函数代码
 * 3. 开启 函数 URL → 免鉴权 → 响应集成（必须开启）
 * 4. 在环境变量中添加 DEEPSEEK_API_KEY
 * 5. 将生成的函数 URL 更新到前端 index.html 的 API_URL 即可
 *
 * 测试：
 *   curl -X POST https://<函数URL> \
 *     -H "Content-Type: application/json" \
 *     -d '{"userInput":"今天被领导批评了"}'
 */

const SYSTEM_PROMPT = `你是一个高情商回复助手。请根据用户输入，生成一段温暖、共情、智慧的回复。
要求：
- 不要指责对方，不要用说教口吻
- 保持自然口语化
- 长度不超过 100 字
- 如果对方在抱怨，先表示理解再给建议
- 如果对方分享喜悦，热情祝贺`;

const DAILY_LIMIT = 100;
const ipCounts = {};

exports.main_handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: '仅支持 POST 请求' }),
    };
  }

  const body = JSON.parse(event.body || '{}');
  const userInput = body.userInput;

  if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: '请输入有效内容' }),
    };
  }

  const ip = (event.headers?.['X-Forwarded-For'] || '').split(',')[0] || 'unknown';
  const today = new Date().toISOString().slice(0, 10);
  const key = `${ip}:${today}`;
  ipCounts[key] = (ipCounts[key] || 0) + 1;

  if (ipCounts[key] > DAILY_LIMIT) {
    return {
      statusCode: 429,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: '今日次数已用完（每日限 100 次），明天再来吧~' }),
    };
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: '生成失败，请重试' }),
    };
  }

  try {
    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
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

    if (!resp.ok) {
      console.error('DeepSeek API error:', resp.status);
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: '生成失败，请重试' }),
      };
    }

    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '生成失败，请重试';

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error('Request failed:', err);
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: '生成失败，请重试' }),
    };
  }
};
