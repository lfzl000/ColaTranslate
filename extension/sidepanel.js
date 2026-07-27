// ====== State ======
let currentStyle = 'auto';
let useStream = false;
let userPickedTarget = false;  // 用户是否手动选择了目标语言

// ====== DOM Elements ======
const sourceLang = document.getElementById('sourceLang');
const targetLang = document.getElementById('targetLang');
const sourceText = document.getElementById('sourceText');
const targetText = document.getElementById('targetText');
const translateBtn = document.getElementById('translateBtn');
const swapBtn = document.getElementById('swapBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const pasteBtn = document.getElementById('pasteBtn');
const streamToggle = document.getElementById('streamToggle');
const sourceCount = document.getElementById('sourceCount');
const targetCount = document.getElementById('targetCount');
const toast = document.getElementById('toast');

// ====== Theme System ======
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsClose = document.getElementById('settingsClose');
const settingsSave = document.getElementById('settingsSave');
const settingsBtn = document.getElementById('settingsBtn');
const apiKeyInput = document.getElementById('apiKeyInput');
const apiKeyHint = document.getElementById('apiKeyHint');

let currentTheme = localStorage.getItem('ai-translator-theme') || 'system';
let currentProvider = localStorage.getItem('ai-translator-provider') || 'deepseek';

// Apply theme (system-aware)
function applyTheme(mode) {
    if (mode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.dataset.theme = prefersDark ? 'dark' : 'light';
    } else {
        document.body.dataset.theme = mode;
    }
    document.querySelectorAll('.settings-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === mode);
    });
}

applyTheme(currentTheme);

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme === 'system') applyTheme('system');
});

// Settings modal
settingsBtn.addEventListener('click', () => {
    document.querySelectorAll('.settings-option[data-theme]').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === currentTheme);
    });
    const cfg = loadProviderConfig(currentProvider);
    currentApiBase = cfg.apiBase;
    currentApiKey = cfg.apiKey;
    currentModel = cfg.model;
    apiKeyInput.value = currentApiKey;
    document.getElementById('apiBaseInput').value = currentApiBase;
    document.getElementById('modelInput').value = currentModel;
    updateProviderUI();
    updateApiKeyHint();
    settingsOverlay.style.display = 'flex';
    apiKeyInput.focus();
});

function updateProviderUI() {
    const isOpenAI = currentProvider === 'openai';
    document.querySelectorAll('#providerOptions .settings-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.provider === currentProvider);
    });
    document.getElementById('apiBaseGroup').style.display = isOpenAI ? '' : 'none';
    document.getElementById('modelGroup').style.display = isOpenAI ? '' : 'none';
    document.getElementById('fetchModelsBtn').style.display = isOpenAI ? '' : 'none';
    document.getElementById('modelSelect').style.display = 'none';
    document.getElementById('modelInput').style.display = '';
}

// Fetch available models from API
document.getElementById('fetchModelsBtn').addEventListener('click', async () => {
    const base = document.getElementById('apiBaseInput').value.trim().replace(/\/+$/, '');
    const key = apiKeyInput.value.trim();
    if (!base) { showToast('请先填写 API 请求地址', 'error'); return; }
    if (!key) { showToast('请先填写 API Key', 'error'); return; }

    const btn = document.getElementById('fetchModelsBtn');
    const hint = document.getElementById('modelHint');
    btn.classList.add('loading');
    btn.textContent = '⏳ 获取中...';
    hint.style.display = 'none';

    try {
        const res = await fetch(`${base}/models`, {
            headers: { 'Authorization': `Bearer ${key}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const models = (data.data || []).map(m => m.id).filter(id => !id.includes('embedding') && !id.includes('moderation')).slice(0, 20);

        if (models.length) {
            const select = document.getElementById('modelSelect');
            select.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
            select.style.display = '';
            document.getElementById('modelInput').style.display = 'none';
            select.addEventListener('change', () => {
                document.getElementById('modelInput').value = select.value;
            });
            select.value = models[0];
            document.getElementById('modelInput').value = models[0];
            hint.textContent = `✅ 找到 ${models.length} 个可用模型`;
            hint.style.color = 'var(--success)';
        } else {
            hint.textContent = '⚠️ 未找到可用模型，请手动输入';
            hint.style.color = 'var(--danger)';
        }
        hint.style.display = '';
    } catch (err) {
        hint.textContent = `❌ 获取失败: ${err.message}`;
        hint.style.color = 'var(--danger)';
        hint.style.display = '';
    } finally {
        btn.classList.remove('loading');
        btn.textContent = '🔄 获取可用模型';
    }
});

settingsClose.addEventListener('click', () => { settingsOverlay.style.display = 'none'; });
settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) settingsOverlay.style.display = 'none';
    // Provider option click
    const popt = e.target.closest('#providerOptions .settings-option');
    if (popt) {
        currentProvider = popt.dataset.provider;
        const cfg = loadProviderConfig(currentProvider);
        currentApiBase = cfg.apiBase;
        currentApiKey = cfg.apiKey;
        currentModel = cfg.model;
        apiKeyInput.value = currentApiKey;
        document.getElementById('apiBaseInput').value = currentApiBase;
        document.getElementById('modelInput').value = currentModel;
        document.getElementById('modelSelect').style.display = 'none';
        document.getElementById('modelInput').style.display = '';
        document.getElementById('modelHint').style.display = 'none';
        updateProviderUI();
        updateApiKeyHint();
        return;
    }
    // Theme option click
    const topt = e.target.closest('.settings-option');
    if (topt && topt.dataset.theme) {
        currentTheme = topt.dataset.theme;
        document.querySelectorAll('.settings-option[data-theme]').forEach(o => o.classList.remove('active'));
        topt.classList.add('active');
    }
});

// Theme option click
settingsOverlay.addEventListener('click', (e) => {
    const opt = e.target.closest('.settings-option');
    if (!opt) return;
    currentTheme = opt.dataset.theme;
    document.querySelectorAll('.settings-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
});

// API key hint
apiKeyInput.addEventListener('input', updateApiKeyHint);
function updateApiKeyHint() {
    const val = apiKeyInput.value.trim();
    if (!val) apiKeyHint.textContent = '';
    else if (val.startsWith('sk-') && val.length > 20) apiKeyHint.textContent = '✅ 密钥格式正确';
    else apiKeyHint.textContent = '⚠️ 密钥应以 sk- 开头';
    apiKeyHint.style.color = val.startsWith('sk-') && val.length > 20 ? 'var(--success)' : 'var(--danger)';
}

// Save settings
settingsSave.addEventListener('click', () => {
    const newTheme = currentTheme;
    const newKey = apiKeyInput.value.trim();
    const isOpenAI = currentProvider === 'openai';
    const newBase = isOpenAI
        ? ((document.getElementById('apiBaseInput')?.value || '').trim() || 'https://api.openai.com/v1')
        : 'https://api.deepseek.com/v1';
    const newModel = isOpenAI
        ? ((document.getElementById('modelInput')?.value || '').trim() || 'gpt-4o-mini')
        : 'deepseek-v4-flash';

    currentApiKey = newKey;
    currentApiBase = newBase;
    currentModel = newModel;
    saveProviderConfig(currentProvider, newKey, newBase, newModel);
    localStorage.setItem('ai-translator-provider', currentProvider);
    localStorage.setItem('ai-translator-theme', newTheme);

    applyTheme(newTheme);
    updateModelBadge();
    settingsOverlay.style.display = 'none';
    showToast('设置已保存 ✓', 'success');
});

// Esc to close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsOverlay.style.display === 'flex') {
        settingsOverlay.style.display = 'none';
    }
});

// ====== Style Chips ======
document.querySelectorAll('.style-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.style-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentStyle = chip.dataset.style;
    });
});

// ====== Stream Toggle ======
streamToggle.addEventListener('click', () => {
    useStream = !useStream;
    streamToggle.style.borderColor = useStream ? 'var(--accent)' : 'var(--border)';
    streamToggle.style.color = useStream ? 'var(--accent)' : 'var(--text-secondary)';
    showToast(useStream ? '流式模式：逐字输出翻译结果' : '普通模式：一次性返回翻译结果');
});

// ====== Swap Languages ======
swapBtn.addEventListener('click', () => {
    if (sourceLang.value === 'auto') return;
    const tmp = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = tmp;
    // Swap text if both have content
    if (sourceText.value && targetText.textContent) {
        const tmpText = sourceText.value;
        sourceText.value = targetText.textContent;
        targetText.textContent = tmpText;
        updateCounts();
    }
});

// ====== Clear ======
clearBtn.addEventListener('click', () => {
    sourceText.value = '';
    targetText.textContent = '';
    updateCounts();
    sourceText.focus();
});

// ====== Copy ======
copyBtn.addEventListener('click', async () => {
    const text = targetText.textContent.trim();
    if (!text) { showToast('没有可复制的内容', 'error'); return; }
    try {
        await navigator.clipboard.writeText(text);
        showToast('已复制到剪贴板 ✓', 'success');
    } catch {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('已复制到剪贴板 ✓', 'success');
    }
});

// ====== Paste ======
pasteBtn.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            sourceText.value = text;
            updateCounts();
            showToast('已粘贴剪贴板内容');
        }
    } catch {
        showToast('无法访问剪贴板，请手动粘贴', 'error');
    }
});

// ====== Auto-Detect Language & Switch Target ======
let detectTimer;
sourceText.addEventListener('input', () => {
    updateCounts();
    // 用户已手动选了目标语言就不再自动切换
    if (userPickedTarget) return;
    clearTimeout(detectTimer);
    const text = sourceText.value.trim();
    if (text.length < 2) return;  // 太短不检测
    detectTimer = setTimeout(() => detectAndAutoTarget(text), 500);
});

function detectAndAutoTarget(text) {
    if (userPickedTarget) return;
    const lang = detectTextLanguage(text);
    if (lang === 'zh' && targetLang.value !== 'en') {
        targetLang.value = 'en';
        showToast('检测到中文 → 自动切换目标语言为 English');
    } else if (lang === 'en' && targetLang.value !== 'zh') {
        targetLang.value = 'zh';
        showToast('检测到 English → 自动切换目标语言为 中文');
    }
}

function detectTextLanguage(text) {
    let cjk = 0, latin = 0;
    for (const ch of text) {
        const code = ch.codePointAt(0);
        if ((code >= 0x4E00 && code <= 0x9FFF) ||   // CJK Unified
            (code >= 0x3400 && code <= 0x4DBF) ||    // CJK Extension A
            (code >= 0xF900 && code <= 0xFAFF)) {     // CJK Compat
            cjk++;
        } else if ((code >= 0x41 && code <= 0x5A) ||  // A-Z
                   (code >= 0x61 && code <= 0x7A)) {   // a-z
            latin++;
        }
    }
    const total = cjk + latin;
    if (total === 0) return null;
    if (cjk / total > 0.5) return 'zh';
    if (latin / total > 0.5) return 'en';
    return null;
}

// 用户手动选择目标语言时，记住选择，不再自动切换
targetLang.addEventListener('change', () => {
    userPickedTarget = true;
});
// 用户手动选择源语言（非 auto）时，也设为手动模式
sourceLang.addEventListener('change', () => {
    if (sourceLang.value !== 'auto') userPickedTarget = true;
});

// 清空时重置手动选择标记
const originalClearHandler = clearBtn.onclick;
clearBtn.addEventListener('click', () => {
    userPickedTarget = false;
});

// ====== Char Count ======
function updateCounts() {
    sourceCount.textContent = `${sourceText.value.length} 字符`;
    targetCount.textContent = `${targetText.textContent.length} 字符`;
}

// ====== Keyboard Shortcuts ======
sourceText.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        translate();
    }
});

// ====== Translate ======
translateBtn.addEventListener('click', translate);

async function translate() {
    const text = sourceText.value.trim();
    if (!text) {
        showToast('请先输入要翻译的文本', 'error');
        sourceText.focus();
        return;
    }

    if (!ensureApiKey()) return;

    const src = sourceLang.value;
    const tgt = targetLang.value;

    if (src !== 'auto' && src === tgt) {
        showToast('源语言和目标语言不能相同', 'error');
        return;
    }

    translateBtn.classList.add('loading');
    translateBtn.disabled = true;
    targetText.textContent = '';
    targetText.classList.remove('streaming-cursor');

    try {
        if (useStream) {
            await streamTranslate(text, src, tgt);
        } else {
            await normalTranslate(text, src, tgt);
        }
    } catch (err) {
        targetText.textContent = `❌ 翻译失败: ${err.message}`;
        showToast(`错误: ${err.message}`, 'error');
    } finally {
        translateBtn.classList.remove('loading');
        translateBtn.disabled = false;
        updateCounts();
    }
}

// ====== API Config ======
function loadProviderConfig(provider) {
    if (provider === 'openai') {
        return {
            apiBase: localStorage.getItem('ai-openai-api-base') || 'https://api.openai.com/v1',
            apiKey: localStorage.getItem('ai-openai-api-key') || '',
            model: localStorage.getItem('ai-openai-model') || 'gpt-4o-mini'
        };
    }
    return {
        apiBase: 'https://api.deepseek.com/v1',
        apiKey: localStorage.getItem('ai-deepseek-api-key') || '',
        model: 'deepseek-v4-flash'
    };
}

function saveProviderConfig(provider, apiKey, apiBase, model) {
    if (provider === 'openai') {
        localStorage.setItem('ai-openai-api-base', apiBase);
        localStorage.setItem('ai-openai-api-key', apiKey);
        localStorage.setItem('ai-openai-model', model);
    } else {
        localStorage.setItem('ai-deepseek-api-key', apiKey);
    }
}

const defaultCfg = loadProviderConfig('deepseek');
let currentApiBase = defaultCfg.apiBase;
let currentApiKey = defaultCfg.apiKey;
let currentModel = defaultCfg.model;

function getApiUrl() {
    const base = currentApiBase.replace(/\/+$/, '');
    return `${base}/chat/completions`;
}

// ====== API Helpers ======

const LANG_NAMES = {
    'zh': 'Chinese', 'en': 'English', 'ja': 'Japanese',
    'ko': 'Korean', 'fr': 'French', 'de': 'German',
    'es': 'Spanish', 'pt': 'Portuguese', 'ru': 'Russian',
    'ar': 'Arabic', 'th': 'Thai', 'vi': 'Vietnamese',
    'it': 'Italian', 'nl': 'Dutch', 'pl': 'Polish'
};

function buildTranslatePrompt(text, src, tgt, style) {
    const srcName = LANG_NAMES[src] || src || 'Auto';
    const tgtName = LANG_NAMES[tgt] || tgt;
    const styleGuide = style === 'formal' ? '使用正式、专业的语气。' :
                       style === 'casual' ? '使用口语化、自然的语气。' :
                       style === 'academic' ? '使用学术化、严谨的语气。' :
                       style === 'developer' ? '面向开发者场景：准确翻译编程术语、技术文档、代码注释。保留代码中的变量名、函数名、API名称不翻译。对于技术术语优先使用行业通用译法。' : '';
    return `你是一个专业的翻译助手。请将以下文本从${srcName}翻译成${tgtName}。
${styleGuide}
要求：
1. 保持原文的语义和语境
2. 确保翻译自然流畅，符合目标语言的表达习惯
3. 如果有专业术语，保持准确
4. 只返回翻译结果，不要添加任何解释或说明`;
}

async function normalTranslate(text, src, tgt) {
    const res = await fetch(getApiUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentApiKey}`
        },
        body: JSON.stringify({
            model: currentModel,
            messages: [
                { role: 'system', content: buildTranslatePrompt(text, src, tgt, currentStyle) },
                { role: 'user', content: text }
            ],
            temperature: 0.3,
            max_tokens: 4096
        })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const translated = data.choices?.[0]?.message?.content?.trim() || '';
    targetText.textContent = translated;
    addHistory('translate', text, translated, src, tgt);
    showToast(`翻译完成 · 消耗 ${data.usage?.total_tokens || '?'} tokens`, 'success');
}

async function streamTranslate(text, src, tgt) {
    targetText.classList.add('streaming-cursor');
    let fullText = '';

    const res = await fetch(getApiUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentApiKey}`
        },
        body: JSON.stringify({
            model: currentModel,
            messages: [
                { role: 'system', content: buildTranslatePrompt(text, src, tgt, currentStyle) },
                { role: 'user', content: text }
            ],
            temperature: 0.3,
            max_tokens: 4096,
            stream: true
        })
    });

    if (!res.ok) {
        targetText.classList.remove('streaming-cursor');
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
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
                if (data === '[DONE]') continue;
                try {
                    const parsed = safeJSONParse(data, null);
                    if (!parsed) continue;
                    const content = parsed.choices?.[0]?.delta?.content || '';
                    if (content) {
                        fullText += content;
                        targetText.textContent = fullText;
                        updateCounts();
                        targetText.scrollTop = targetText.scrollHeight;
                    }
                } catch (e) {
                    // skip unparseable
                }
            }
        }
    }

    targetText.classList.remove('streaming-cursor');
    addHistory('translate', text, fullText, src, tgt);
    showToast('流式翻译完成 ✓', 'success');
}

// ====== Toast ======
let toastTimer;
function showToast(msg, type = '') {
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    requestAnimationFrame(() => toast.classList.add('show'));
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ====== Mode Tabs ======
const modeTabs = document.querySelectorAll('.mode-tab');
const translatorCard = document.querySelector('.translator-card');
const namingCard = document.getElementById('namingCard');
const namingInput = document.getElementById('namingInput');
const namingPlaceholder = document.getElementById('namingPlaceholder');
const namingResults = document.getElementById('namingResults');
const pageFooter = document.getElementById('pageFooter');
let currentMode = 'translate';
let namingFormat = localStorage.getItem('ai-translator-naming-format') || 'all';
const mdTranslateCard = document.getElementById('mdTranslateCard');

// Hide all cards except active
function hideAllCards() {
    translatorCard.style.display = 'none';
    namingCard.classList.remove('active');
    mdTranslateCard.classList.remove('active');
}

modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        modeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentMode = tab.dataset.mode;

        hideAllCards();
        switch (currentMode) {
            case 'translate':
                translatorCard.style.display = '';
                pageFooter.textContent = '快捷键：Ctrl+Enter 翻译 · 支持 15 种语言 · 基于 DeepSeek 大模型';
                sourceText.focus();
                break;
            case 'naming':
                namingCard.classList.add('active');
                pageFooter.textContent = '输入中文短语（单行详细推荐，多行批量生成） · 支持4种命名格式';
                namingInput.focus();
                break;
            case 'mdTranslate':
                mdTranslateCard.classList.add('active');
                pageFooter.textContent = '翻译 Markdown 内容，保留代码块/表格/链接格式';
                document.getElementById('mdSourceText').focus();
                break;
        }
    });
});

// ====== Code Naming ======
let namingTimer;
namingInput.addEventListener('keydown', (e) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generateName();
    }
});

async function generateName() {
    const text = namingInput.value.trim();
    if (!text) {
        showToast('请输入中文短语', 'error');
        return;
    }

    if (!ensureApiKey()) return;

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 1) {
        await doBatchNaming(lines);
        return;
    }

    namingPlaceholder.style.display = 'none';
    namingResults.style.display = 'block';
    namingResults.innerHTML = '<div class="naming-placeholder" style="padding:1.5rem">⏳ 正在生成命名方案...</div>';

    try {
        const res = await fetch(getApiUrl(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentApiKey}`
            },
            body: JSON.stringify({
                model: currentModel,
                messages: [
                    { role: 'system', content: `你是一个专业的代码命名助手。用户输入一个中文词语或短语，你需要给出 3~5 个不同的英文代码命名方案。

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
}` },
                    { role: 'user', content: text }
                ],
                temperature: 0.3,
                max_tokens: 512,
                response_format: { type: 'json_object' }
            })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim() || '';
        const result = safeJSONParse(content, { candidates: [] });
        window._lastCandidates = result.candidates || [];
        renderCandidates(window._lastCandidates);
        // Save to history
        const namingText = window._lastCandidates.map(c => `${c.label || '方案'}：${c.camelCase} / ${c.PascalCase} / ${c.snake_case} / ${c['kebab-case']} - ${c.explanation}`).join('\n');
        addHistory('naming', text, namingText, 'zh', 'en');
    } catch (err) {
        namingResults.innerHTML = `<div class="naming-placeholder" style="padding:1.5rem;color:var(--danger)">❌ ${err.message}</div>`;
    }
}

function renderCandidates(candidates) {
    if (!candidates.length) {
        namingResults.innerHTML = '<div class="naming-placeholder" style="padding:1.5rem">未能生成命名建议，请尝试其他短语</div>';
        document.getElementById('formatSelector').style.display = 'none';
        return;
    }

    // Show format selector, sync active state
    const formatSelector = document.getElementById('formatSelector');
    formatSelector.style.display = 'flex';
    document.querySelectorAll('.format-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.format === namingFormat);
    });

    const allCasings = [
        { key: 'camelCase', emoji: '🐫', label: 'camel' },
        { key: 'PascalCase', emoji: '🏛️', label: 'Pascal' },
        { key: 'snake_case', emoji: '🐍', label: 'snake' },
        { key: 'kebab-case', emoji: '🍢', label: 'kebab' }
    ];

    // Filter casings if a specific format is selected
    const casings = namingFormat === 'all'
        ? allCasings
        : allCasings.filter(cs => cs.key === namingFormat);

    const html = candidates.map((c, i) => {
        const isRecommend = c.label === '推荐' || i === 0;
        const labelClass = isRecommend ? 'recommend' : 'alt';
        const labelText = c.label || (isRecommend ? '推荐' : '备选');

        const chips = casings.map(cs => {
            const val = c[cs.key] || '-';
            return `<span class="casing-chip" data-value="${escapeHtml(val)}" title="点击复制">
                <span class="case-type">${cs.emoji} ${cs.label}</span> ${escapeHtml(val)}
            </span>`;
        }).join('');

        return `<div class="candidate-card">
            <div class="candidate-header">
                <span class="candidate-label ${labelClass}">${labelText}</span>
            </div>
            <div class="candidate-casings">${chips}</div>
            <div class="candidate-explanation">💡 ${escapeHtml(c.explanation || '')}</div>
        </div>`;
    }).join('');

    namingResults.innerHTML = html;
    showToast(`已生成 ${candidates.length} 个命名方案`, 'success');
}

// ====== Format Selector ======
document.getElementById('formatSelector').addEventListener('click', (e) => {
    const chip = e.target.closest('.format-chip');
    if (!chip) return;
    namingFormat = chip.dataset.format;
    localStorage.setItem('ai-translator-naming-format', namingFormat);
    document.querySelectorAll('.format-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    // Re-render with cached data
    if (window._lastCandidates) renderCandidates(window._lastCandidates);
    else if (window._lastBatchResults) renderBatchResults(window._lastBatchResults);
});

// ====== Batch Naming (called from generateName for multi-line) ======
async function doBatchNaming(lines) {
    namingPlaceholder.style.display = 'none';
    namingResults.style.display = 'block';
    namingResults.innerHTML = `<div class="naming-placeholder" style="padding:1.5rem">⏳ 正在批量生成 ${lines.length} 个命名方案...</div>`;
    document.getElementById('formatSelector').style.display = 'none';

    try {
        const res = await fetch(getApiUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
            body: JSON.stringify({
                model: currentModel,
                messages: [{ role: 'system', content: `针对用户输入的每一行中文，给出对应的英文代码命名。严格按 JSON 格式返回：
{ "items": [{"chinese": "中文", "camelCase": "...", "PascalCase": "...", "snake_case": "...", "kebab-case": "..."}] }
每个 item 对应一行输入。` }, { role: 'user', content: lines.join('\n') }],
                temperature: 0.3, max_tokens: 4096, response_format: { type: 'json_object' }
            })
        });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || res.statusText); }
        const data = await res.json();
        const result = safeJSONParse(data.choices?.[0]?.message?.content?.trim() || '', { items: [] });
        window._lastBatchResults = result.items || [];
        window._lastCandidates = null;
        renderBatchResults(window._lastBatchResults);
        const batchText = window._lastBatchResults.map(item => `${item.chinese} → ${item.camelCase} / ${item.PascalCase} / ${item.snake_case} / ${item['kebab-case']}`).join('\n');
        addHistory('naming', lines.join('\n'), batchText, 'zh', 'en');
        showToast(`已生成 ${window._lastBatchResults.length} 个命名方案`, 'success');
    } catch (err) {
        namingResults.innerHTML = `<div class="naming-placeholder" style="padding:1.5rem;color:var(--danger)">❌ ${err.message}</div>`;
    }
}

function renderBatchResults(items) {
    document.getElementById('formatSelector').style.display = 'flex';
    document.querySelectorAll('#formatSelector .format-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.format === namingFormat);
    });
    if (!items.length) { namingResults.innerHTML = '<div class="naming-placeholder" style="padding:1.5rem">无结果</div>'; return; }
    const casings = namingFormat === 'all' ? ['camelCase','PascalCase','snake_case','kebab-case'] : [namingFormat];
    const labels = { camelCase: '🐫 camel', PascalCase: '🏛️ Pascal', snake_case: '🐍 snake', 'kebab-case': '🍢 kebab' };
    const html = items.map(item => `
        <div class="naming-row" style="flex-wrap:wrap;gap:0.5rem">
            <span style="font-weight:600;min-width:80px;color:var(--text);font-size:0.85rem">${escapeHtml(item.chinese)}</span>
            ${casings.map(c => `<span class="casing-chip" data-value="${escapeHtml(item[c] || '-')}"><span class="case-type">${labels[c]}</span> ${escapeHtml(item[c] || '-')}</span>`).join('')}
        </div>
    `).join('');
    namingResults.innerHTML = html;
}

// ====== Markdown Translate ======
const mdSourceText = document.getElementById('mdSourceText');
const mdTargetText = document.getElementById('mdTargetText');
const mdTranslateBtn = document.getElementById('mdTranslateBtn');
const mdSourceLang = document.getElementById('mdSourceLang');
const mdTargetLang = document.getElementById('mdTargetLang');
const mdSourceCount = document.getElementById('mdSourceCount');
const mdTargetCount = document.getElementById('mdTargetCount');

mdSourceText.addEventListener('input', () => mdSourceCount.textContent = `${mdSourceText.value.length} 字符`);

document.getElementById('mdSwapBtn').addEventListener('click', () => {
    if (mdSourceLang.value === 'auto') return;
    [mdSourceLang.value, mdTargetLang.value] = [mdTargetLang.value, mdSourceLang.value];
    if (mdSourceText.value && mdTargetText.textContent) {
        [mdSourceText.value, mdTargetText.textContent] = [mdTargetText.textContent, mdSourceText.value];
        mdSourceCount.textContent = `${mdSourceText.value.length} 字符`;
        mdTargetCount.textContent = `${mdTargetText.textContent.length} 字符`;
    }
});

document.getElementById('mdClearBtn').addEventListener('click', () => {
    mdSourceText.value = ''; mdTargetText.textContent = '';
    mdSourceCount.textContent = '0 字符'; mdTargetCount.textContent = '0 字符';
    mdSourceText.focus();
});

document.getElementById('mdCopyBtn').addEventListener('click', async () => {
    const t = mdTargetText.textContent.trim();
    if (!t) { showToast('没有可复制的内容', 'error'); return; }
    await navigator.clipboard.writeText(t);
    showToast('已复制', 'success');
});

mdTranslateBtn.addEventListener('click', async () => {
    const text = mdSourceText.value.trim();
    if (!text) { showToast('请粘贴 Markdown 内容', 'error'); return; }
    if (!ensureApiKey()) return;

    const srcName = LANG_NAMES[mdSourceLang.value] || mdSourceLang.value || 'Auto';
    const tgtName = LANG_NAMES[mdTargetLang.value] || mdTargetLang.value;
    mdTranslateBtn.classList.add('loading'); mdTranslateBtn.disabled = true;
    mdTargetText.textContent = '';

    try {
        const res = await fetch(getApiUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
            body: JSON.stringify({
                model: currentModel,
                messages: [{ role: 'system', content: `你是 Markdown 翻译助手。将以下 Markdown 内容从${srcName}翻译成${tgtName}。
规则：
1. 保留所有 Markdown 语法（# 标题、**加粗**、\`代码\`、表格、链接、列表等）原样不动
2. 只翻译正文文本内容，不翻译代码块内的代码
3. 代码块使用 \`\`\` 标记的部分，内部完全不翻译
4. 保持表格对齐、缩进、空行等排版
5. 只返回翻译后的 Markdown，不要任何解释` }, { role: 'user', content: text }],
                temperature: 0.3, max_tokens: 8192
            })
        });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || res.statusText); }
        const data = await res.json();
        mdTargetText.textContent = data.choices?.[0]?.message?.content?.trim() || '';
        mdTargetCount.textContent = `${mdTargetText.textContent.length} 字符`;
        addHistory('mdTranslate', text, mdTargetText.textContent, mdSourceLang.value, mdTargetLang.value);
        showToast('Markdown 翻译完成', 'success');
    } catch (err) {
        mdTargetText.textContent = `❌ 翻译失败: ${err.message}`;
    } finally {
        mdTranslateBtn.classList.remove('loading'); mdTranslateBtn.disabled = false;
    }
});

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Safe JSON parse with repair for common AI response issues
function safeJSONParse(str, fallback) {
    try {
        return JSON.parse(str);
    } catch (e) {
        // Try to fix common issues: unescaped quotes inside strings, trailing commas
        const cleaned = str
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');
        try { return JSON.parse(cleaned); } catch (e2) {}
        return fallback;
    }
}

// Ensure API Key is set before any operation
function ensureApiKey() {
    if (!currentApiKey) {
        showToast('⚠️ 请先设置 DeepSeek API Key', 'error');
        // Open settings modal
        document.querySelectorAll('.settings-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === currentTheme);
        });
        apiKeyInput.value = '';
        updateApiKeyHint();
        settingsOverlay.style.display = 'flex';
        setTimeout(() => apiKeyInput.focus(), 300);
        return false;
    }
    return true;
}

// Naming chip copy
namingResults.addEventListener('click', (e) => {
    const chip = e.target.closest('.casing-chip');
    if (!chip) return;
    const value = chip.dataset.value;
    if (!value || value === '-') return;
    navigator.clipboard.writeText(value).then(() => {
        chip.classList.add('copied');
        const original = chip.innerHTML;
        chip.innerHTML = '✓ 已复制';
        showToast(`已复制: ${value}`, 'success');
        setTimeout(() => {
            chip.classList.remove('copied');
            chip.innerHTML = original;
        }, 1500);
    });
});

// ====== History ======
const HISTORY_KEY = 'ai-translator-history';
const HISTORY_DAYS = 7;
const historyOverlay = document.getElementById('historyOverlay');
const historyList = document.getElementById('historyList');
const historyBtn = document.getElementById('historyBtn');

function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch { return []; }
}

function saveHistory(items) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function cleanHistory() {
    const now = Date.now();
    const expire = HISTORY_DAYS * 24 * 60 * 60 * 1000;
    const items = loadHistory().filter(item => (now - item.timestamp) < expire);
    if (items.length !== loadHistory().length) saveHistory(items);
    return items;
}

function addHistory(mode, sourceText, targetText, sourceLang, targetLang) {
    const items = cleanHistory();
    items.unshift({
        id: Date.now(),
        mode,
        sourceText: sourceText.slice(0, 200),
        targetText: targetText.slice(0, 500),
        sourceLang,
        targetLang,
        timestamp: Date.now()
    });
    // Keep max 50
    if (items.length > 50) items.length = 50;
    saveHistory(items);
}

function renderHistory() {
    const items = cleanHistory();
    if (!items.length) {
        historyList.innerHTML = '<div class="history-empty">暂无翻译记录</div>';
        return;
    }
    const langNames = { zh: '中文', en: 'English', ja: '日本語', ko: '한국어', fr: 'Français', de: 'Deutsch', es: 'Español', auto: '自动' };
    const modeNames = { translate: '🌐', naming: '💻', mdTranslate: '📄' };
    historyList.innerHTML = items.map(item => {
        const d = new Date(item.timestamp);
        const time = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        const srcLabel = langNames[item.sourceLang] || item.sourceLang || '自动';
        const tgtLabel = langNames[item.targetLang] || item.targetLang;
        return `<div class="history-item" data-id="${item.id}">
            <button class="history-delete" data-action="delete">✕</button>
            <div class="history-meta">
                <span>${modeNames[item.mode] || ''}</span>
                <span class="history-lang">${srcLabel} → ${tgtLabel}</span>
                <span class="history-time">${time}</span>
            </div>
            <div class="history-source">${escapeHtml(item.sourceText)}</div>
            <div class="history-target">${escapeHtml(item.targetText)}</div>
        </div>`;
    }).join('');
}

// History panel
historyBtn.addEventListener('click', () => {
    renderHistory();
    historyOverlay.style.display = 'flex';
});
document.getElementById('historyClose').addEventListener('click', () => {
    historyOverlay.style.display = 'none';
});
historyOverlay.addEventListener('click', (e) => {
    if (e.target === historyOverlay) historyOverlay.style.display = 'none';
});
document.getElementById('historyClearAll').addEventListener('click', () => {
    if (confirm('确定清空全部历史记录？')) {
        localStorage.removeItem(HISTORY_KEY);
        renderHistory();
        showToast('历史已清空');
    }
});

// Click history item to restore
historyList.addEventListener('click', (e) => {
    if (e.target.dataset.action === 'delete') {
        e.stopPropagation();
        const id = parseInt(e.target.closest('.history-item').dataset.id);
        const items = loadHistory().filter(i => i.id !== id);
        saveHistory(items);
        renderHistory();
        return;
    }
    const itemEl = e.target.closest('.history-item');
    if (!itemEl) return;
    const id = parseInt(itemEl.dataset.id);
    const items = loadHistory();
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Switch to correct mode tab
    const tab = document.querySelector(`.mode-tab[data-mode="${item.mode}"]`);
    if (tab) tab.click();

    // Restore content
    setTimeout(() => {
        if (item.mode === 'translate') {
            sourceText.value = item.sourceText;
            targetText.textContent = item.targetText;
            sourceLang.value = item.sourceLang || 'auto';
            targetLang.value = item.targetLang || 'en';
            updateCounts();
        } else if (item.mode === 'naming') {
            namingInput.value = item.sourceText;
            namingPlaceholder.style.display = 'none';
            namingResults.style.display = 'block';
            namingResults.innerHTML = `<div class="naming-placeholder" style="padding:1rem;color:var(--text-secondary);font-size:0.85rem">📋 历史记录（无法重新渲染结构化结果）</div><div class="naming-row" style="flex-wrap:wrap;gap:0.5rem;margin-top:0.5rem"><span style="font-size:0.85rem;color:var(--text);white-space:pre-wrap">${escapeHtml(item.targetText)}</span></div>`;
        } else if (item.mode === 'mdTranslate') {
            mdSourceText.value = item.sourceText;
            mdTargetText.textContent = item.targetText;
            mdSourceCount.textContent = `${item.sourceText.length} 字符`;
            mdTargetCount.textContent = `${item.targetText.length} 字符`;
        }
        historyOverlay.style.display = 'none';
        showToast('已恢复历史记录');
    }, 100);
});

// ====== Init ======
function updateModelBadge() {
    const badge = document.getElementById('modelBadge');
    const short = currentModel.length > 15 ? currentModel.slice(0, 14) + '…' : currentModel;
    badge.textContent = short;
    badge.title = `${currentProvider === 'deepseek' ? 'DeepSeek' : 'OpenAI'} · ${currentModel}`;
}
updateModelBadge();
updateCounts();
sourceText.focus();