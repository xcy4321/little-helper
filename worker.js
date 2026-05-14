/**
 * Cloudflare Worker - 高情商回复小助手 API 代理
 *
 * 部署方式：
 * 1. 将本文件部署到 Cloudflare Workers
 * 2. 在 Worker 的设置页面添加环境变量 DEEPSEEK_API_KEY
 *    或通过 wrangler.toml 配置:
 *    ```
 *    [vars]
 *    DEEPSEEK_API_KEY = "sk-xxxxxxxxxxxxxxxx"
 *    ```
 * 3. 部署完成后将 Worker 域名更新到前端 index.html 的 API_URL 即可
 *
 * 本地开发 / 测试:
 *   npx wrangler dev
 *   curl -X POST http://localhost:8787 \
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

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ reply: '仅支持 POST 请求' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let userInput;
  try {
    const body = await request.json();
    userInput = body.userInput;
  } catch {
    return new Response(JSON.stringify({ reply: '请求格式错误，请发送 JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
    return new Response(JSON.stringify({ reply: '请输入有效内容' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ reply: '生成失败，请重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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
      console.error('DeepSeek API error:', resp.status, await resp.text());
      return new Response(JSON.stringify({ reply: '生成失败，请重试' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '生成失败，请重试';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Request failed:', err);
    return new Response(JSON.stringify({ reply: '生成失败，请重试' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
