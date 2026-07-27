# 🐕 可乐翻译助手 (ColaTranslate)

基于 DeepSeek 大模型的智能翻译与代码命名工具。

## ✨ 功能

### 🌐 AI 翻译
- 支持 **15 种语言** 互译（中/英/日/韩/法/德/西/葡/俄/阿/泰/越/意/荷/波兰）
- **智能语言检测**：输入中文自动翻译为英文，输入英文自动翻译为中文
- **流式输出**：SSE 逐字展示翻译结果，即时可见
- **4 种翻译风格**：自动 / 正式 / 口语 / 学术 / 开发者
- **快捷键**：`Ctrl + Enter` 一键翻译

### 💻 代码命名
- 输入中文短语，自动生成代码命名方案
- 每次给出 **3~5 个候选方案**，可自由挑选
- 支持 **4 种命名格式**：camelCase / PascalCase / snake_case / kebab-case
- **格式筛选**：可设置只显示指定格式
- 点击即可**一键复制**

### 🎨 界面
- 玻璃拟态（Glass Morphism）设计风格
- 亮色 / 深色 / 跟随系统 三种主题
- 面向前端 API Key 设置，密钥仅保存在浏览器本地

## 🚀 快速开始

### 方式一：纯前端（推荐）

1. 打开 `public/index.html`，或部署为静态站点
2. 点击右上角 ⚙️ 设置图标，填入 [DeepSeek API Key](https://platform.deepseek.com/api_keys)
3. 开始使用

### 方式二：本地后端开发

```bash
# 安装依赖
npm install

# 配置 API Key
cp .env.example .env
# 编辑 .env 填入 DEEPSEEK_API_KEY

# 启动服务
npm start

# 访问 http://localhost:3456
```

## 📁 项目结构

```
ColaTranslate/
├── public/
│   └── index.html      # 前端界面（翻译 + 代码命名）
├── server.js            # 本地开发后端（API 代理）
├── package.json
├── .env.example         # API Key 配置模板
└── README.md
```

## 🛠️ 技术栈

- **前端**：原生 HTML/CSS/JS，玻璃拟态 UI
- **AI 模型**：DeepSeek V4-Flash
- **后端**（可选）：Node.js + Express
- **部署**：支持静态站点直接部署

## 📄 License

MIT
