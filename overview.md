# AI 网页翻译工具 - 项目概览

## 已完成

成功构建了一个完整的 **AI 网页翻译工具**，基于 DeepSeek API 实现智能翻译。

### 项目结构
```
zl_fanyi/
├── server.js           # Node.js 后端 (Express + DeepSeek API 代理)
├── package.json        # 项目依赖
├── .env                # API Key 配置
├── .env.example        # 配置模板
└── public/
    └── index.html      # 前端翻译界面
```

### 核心功能
- **AI 翻译**：接入 DeepSeek API，智能翻译 15 种语言
- **流式输出**：支持流式模式，逐字展示翻译结果（SSE）
- **翻译风格**：自动/正式/口语/学术 4 种风格切换
- **语言互换**：一键交换源语言和目标语言
- **剪贴板**：复制翻译结果 / 粘贴待翻译文本
- **暗色模式**：亮/暗主题切换，自动保存偏好
- **快捷键**：Ctrl+Enter 快速翻译

### 技术栈
- 后端：Node.js + Express（API 代理保护密钥安全）
- CSS：玻璃拟态 + 动态背景 + 平滑过渡动效
- API：DeepSeek Chat API（deepseek-chat 模型）

### 启动方式
```bash
cd zl_fanyi
npm install
# 编辑 .env 填入 DEEPSEEK_API_KEY
npm start
```
访问 http://localhost:3456

## 待配置
- [ ] 用户需在 `.env` 中填入 DeepSeek API Key
