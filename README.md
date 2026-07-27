# 🐕 可乐翻译助手 (ColaTranslate)

基于大模型的智能翻译与代码命名工具，支持 DeepSeek、OpenAI 及任何兼容接口。

## ✨ 功能

### 🌐 AI 翻译
- 支持 **15 种语言** 互译（中/英/日/韩/法/德/西/葡/俄/阿/泰/越/意/荷/波兰）
- **智能语言检测**：输入中文自动翻英文，输入英文自动翻中文
- **流式输出**：逐字展示翻译结果，即时可见
- **5 种翻译风格**：自动 / 正式 / 口语 / 学术 / 开发者
- **快捷键**：`Ctrl + Enter` 翻译，`Enter` 换行

### 💻 代码命名
- 输入中文短语，AI 生成 3~5 个候选方案
- **单行** → 详细推荐（含说明），**多行** → 批量生成
- 支持 **4 种命名格式**：camelCase / PascalCase / snake_case / kebab-case
- 格式筛选器，一键切换只显示需要的格式

### 📄 Markdown 翻译
- 翻译 Markdown 文档，保留代码块、表格、链接等格式
- 代码块内内容**完全不翻译**

### 📜 历史记录
- 自动保存翻译结果，保留 **7 天**
- 点击历史条目一键恢复原文和译文

### ⚙️ 多模型支持
- **DeepSeek**：官方接口，填入 Key 即用
- **OpenAI 兼容**：支持任意兼容接口（OpenAI / 自定义代理 / 本地服务）
- 一键 **获取可用模型列表**
- 各提供商的配置**独立存储**，切换不丢失

### 🎨 界面
- 玻璃拟态设计风格
- 亮色 / 深色 / 跟随系统 三种主题
- 翻译区域自动适应内容高度
- **Chrome 侧边栏插件** — 不离开网页即可使用

## 🚀 快速开始

### Web 版（后端代理，推荐）

```bash
npm install
npm start
# 访问 http://localhost:3456
# 点击右上角 ⚙️ 填入 API Key 即可使用
```

### 浏览器插件

1. 打开 Chrome → `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」→ 选择 `extension/` 目录
4. 点击工具栏图标，侧边栏出现翻译助手

## 📁 项目结构

```
ColaTranslate/
├── public/
│   └── index.html       # Web 版前端
├── extension/            # Chrome 插件
│   ├── manifest.json
│   ├── background.js
│   ├── sidepanel.html
│   ├── sidepanel.js
│   └── icons/
├── server.js             # Node.js 后端（API 代理）
├── package.json
├── .env.example
└── README.md
```

## 🛠️ 技术栈

- **前端**：原生 HTML/CSS/JS，玻璃拟态 UI
- **后端**（可选）：Node.js + Express（解决 CORS，转发 API 请求）
- **支持模型**：DeepSeek V3/R1、GPT-4o、GPT-3.5 等任何 OpenAI 兼容模型
- **部署**：支持静态站点部署（CloudStudio），也支持 Node.js 服务部署（Render 等）

## 📄 License

MIT
