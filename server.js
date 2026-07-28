const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// DeepSeek API 代理
app.post('/api/translate', async (req, res) => {
    const { text, sourceLang, targetLang, style } = req.body;

    if (!text || !targetLang) {
        return res.status(400).json({ error: '缺少必要参数：text 和 targetLang' });
    }

    const apiKey = req.body.apiKey || process.env.DEEPSEEK_API_KEY;
    const apiBase = req.body.apiBase || 'https://api.deepseek.com/v1';
    const model = req.body.model || 'deepseek-v4-flash';
    if (!apiKey || apiKey === 'sk-your-api-key-here') {
        return res.status(401).json({
            error: '请先配置 DEEPSEEK_API_KEY',
            hint: '复制 .env.example 为 .env，填入你的 DeepSeek API Key'
        });
    }

    const langNames = {
        'zh': 'Chinese', 'en': 'English', 'ja': 'Japanese',
        'ko': 'Korean', 'fr': 'French', 'de': 'German',
        'es': 'Spanish', 'pt': 'Portuguese', 'ru': 'Russian',
        'ar': 'Arabic', 'th': 'Thai', 'vi': 'Vietnamese',
        'it': 'Italian', 'nl': 'Dutch', 'pl': 'Polish'
    };

    const srcName = langNames[sourceLang] || sourceLang || 'Auto';
    const tgtName = langNames[targetLang] || targetLang;

    const styleGuide = style === 'formal' ? '使用正式、专业的语气。' :
                       style === 'casual' ? '使用口语化、自然的语气。' :
                       style === 'academic' ? '使用学术化、严谨的语气。' :
                       style === 'developer' ? '面向开发者场景：准确翻译编程术语、技术文档、代码注释。保留代码中的变量名、函数名、API名称不翻译。对于技术术语优先使用行业通用译法。' : '';

    const systemPrompt = `你是一个专业的翻译助手。请将以下文本从${srcName}翻译成${tgtName}。
${styleGuide}
要求：
1. 保持原文的语义和语境
2. 确保翻译自然流畅，符合目标语言的表达习惯
3. 如果有专业术语，保持准确
4. 只返回翻译结果，不要添加任何解释或说明`;

    try {
        const response = await fetch(`${apiBase.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                temperature: 0.3,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            return res.status(response.status).json({
                error: 'DeepSeek API 调用失败',
                detail: errData.error?.message || response.statusText
            });
        }

        const data = await response.json();
        const translated = data.choices?.[0]?.message?.content?.trim() || '';

        res.json({
            success: true,
            translated,
            sourceLang: srcName,
            targetLang: tgtName,
            model: data.model,
            usage: data.usage
        });
    } catch (err) {
        console.error('翻译请求失败:', err.message);
        res.status(500).json({
            error: '服务器内部错误',
            detail: err.message
        });
    }
});

// 流式翻译（SSE）
app.post('/api/translate/stream', async (req, res) => {
    const { text, sourceLang, targetLang, style } = req.body;

    if (!text || !targetLang) {
        return res.status(400).json({ error: '缺少必要参数' });
    }

    const apiKey = req.body.apiKey || process.env.DEEPSEEK_API_KEY;
    const apiBase = req.body.apiBase || 'https://api.deepseek.com/v1';
    const model = req.body.model || 'deepseek-v4-flash';
    if (!apiKey || apiKey === 'sk-your-api-key-here') {
        return res.status(401).json({ error: '请先配置 DEEPSEEK_API_KEY' });
    }

    const langNames = {
        'zh': 'Chinese', 'en': 'English', 'ja': 'Japanese',
        'ko': 'Korean', 'fr': 'French', 'de': 'German',
        'es': 'Spanish', 'pt': 'Portuguese', 'ru': 'Russian',
        'ar': 'Arabic', 'th': 'Thai', 'vi': 'Vietnamese',
        'it': 'Italian', 'nl': 'Dutch', 'pl': 'Polish'
    };

    const srcName = langNames[sourceLang] || sourceLang || 'Auto';
    const tgtName = langNames[targetLang] || targetLang;

    const styleGuide = style === 'formal' ? '使用正式、专业的语气。' :
                       style === 'casual' ? '使用口语化、自然的语气。' :
                       style === 'academic' ? '使用学术化、严谨的语气。' :
                       style === 'developer' ? '面向开发者场景：准确翻译编程术语、技术文档、代码注释。保留代码中的变量名、函数名、API名称不翻译。对于技术术语优先使用行业通用译法。' : '';

    const systemPrompt = `你是一个专业的翻译助手。请将以下文本从${srcName}翻译成${tgtName}。
${styleGuide}
要求：
1. 保持原文的语义和语境
2. 确保翻译自然流畅，符合目标语言的表达习惯
3. 如果有专业术语，保持准确
4. 只返回翻译结果，不要添加任何解释或说明`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const response = await fetch(`${apiBase.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                temperature: 0.3,
                max_tokens: 4096,
                stream: true
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            res.write(`data: ${JSON.stringify({ error: errData.error?.message || response.statusText })}\n\n`);
            res.end();
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') {
                        res.write('data: [DONE]\n\n');
                        continue;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content || '';
                        if (content) {
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    } catch {
                        // skip unparseable chunks
                    }
                }
            }
        }
        res.end();
    } catch (err) {
        console.error('流式翻译失败:', err.message);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
    }
});

// 代码命名：中文短语 → 代码属性/方法名
app.post('/api/name-code', async (req, res) => {
    const { text } = req.body;

    if (!text || !text.trim()) {
        return res.status(400).json({ error: '请输入中文短语' });
    }

    const apiKey = req.body.apiKey || process.env.DEEPSEEK_API_KEY;
    const apiBase = req.body.apiBase || 'https://api.deepseek.com/v1';
    const model = req.body.model || 'deepseek-v4-flash';
    if (!apiKey || apiKey === 'sk-your-api-key-here') {
        return res.status(401).json({ error: '请先配置 DEEPSEEK_API_KEY' });
    }

    const systemPrompt = `你是一个专业的代码命名助手。用户输入一个中文词语或短语，你需要给出 3~5 个不同的英文代码命名方案。

命名规则：
1. 使用简洁、语义准确的英文
2. 遵循常见编程命名约定（如 get/set/is/has 等前缀用于方法，名词用于属性）
3. 对于较长的中文短语，提取核心含义，不要逐字直译
4. 如果是方法/动作类，使用动词开头；如果是属性/名词类，使用名词
5. 每个方案从不同角度命名（如不同的英文词汇、不同的抽象层级、不同的命名风格）
6. 第一个方案作为"推荐"方案，应该是业界最常用的命名方式

请严格按以下 JSON 格式返回，不要添加任何其他内容：
{
  "candidates": [
    {
      "camelCase": "驼峰命名",
      "PascalCase": "帕斯卡命名",
      "snake_case": "蛇形命名",
      "kebab-case": "短横线命名",
      "explanation": "这个方案的含义和适用场景",
      "label": "推荐"
    }
  ]
}`;

    try {
        const response = await fetch(`${apiBase.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                temperature: 0.3,
                max_tokens: 512,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            return res.status(response.status).json({
                error: 'DeepSeek API 调用失败',
                detail: errData.error?.message || response.statusText
            });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim() || '';
        const result = JSON.parse(content);

        res.json({
            success: true,
            candidates: result.candidates || [],
            usage: data.usage
        });
    } catch (err) {
        console.error('代码命名失败:', err.message);
        res.status(500).json({
            error: '生成命名失败',
            detail: err.message
        });
    }
});

// 通用代理端点 — 转发到用户自定义 API
app.post('/api/proxy', async (req, res) => {
    const { apiBase, apiKey, model, messages, temperature, max_tokens, response_format, stream } = req.body;

    if (!apiKey) {
        return res.status(401).json({ error: '请先设置 API Key' });
    }

    const base = (apiBase || 'https://api.deepseek.com/v1').replace(/\/+$/, '');
    const url = `${base}/chat/completions`;

    // 提取用户消息用于日志
    const userMsg = (messages || []).find(m => m.role === 'user')?.content || '';
    const srcPreview = userMsg.length > 80 ? userMsg.slice(0, 80) + '…' : userMsg;
    const startTime = Date.now();

    console.log(`\n📨 [${new Date().toLocaleTimeString()}] 翻译请求`);
    console.log(`   模型: ${model || 'default'}  |  字数: ${userMsg.length}  |  ${stream ? '流式' : '普通'}`);
    console.log(`   内容: ${srcPreview.replace(/\n/g, '↵')}`);

    try {
        const fetchRes = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'deepseek-v4-flash',
                messages,
                temperature: temperature ?? 0.3,
                max_tokens: max_tokens || 4096,
                ...(response_format ? { response_format } : {}),
                ...(stream ? { stream: true } : {})
            })
        });

        if (!fetchRes.ok) {
            const err = await fetchRes.json().catch(() => ({}));
            console.error(`   ❌ HTTP ${fetchRes.status}: ${err.error?.message || fetchRes.statusText}`);
            return res.status(fetchRes.status).json({ error: err.error?.message || fetchRes.statusText });
        }

        if (stream) {
            const reader = fetchRes.body.getReader();
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                    console.log(`   ✅ 流式完成  |  耗时: ${elapsed}s`);
                    res.end();
                    break;
                }
                res.write(value);
            }
        } else {
            const data = await fetchRes.json();
            const content = data.choices?.[0]?.message?.content?.trim() || '';
            const tokens = data.usage?.total_tokens || '?';
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`   ✅ 完成  |  tokens: ${tokens}  |  耗时: ${elapsed}s  |  结果: ${content.length} 字`);
            res.json(data);
        }
    } catch (err) {
        console.error(`   ❌ 代理请求失败: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🌐 AI 翻译工具已启动: http://localhost:${PORT}`);
    console.log(`📡 DeepSeek API 代理就绪`);
    if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === 'sk-your-api-key-here') {
        console.warn('⚠️  请先配置 .env 中的 DEEPSEEK_API_KEY');
    }
});
