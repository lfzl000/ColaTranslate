# 🐕 可乐翻译助手 (ColaTranslate)

基于大模型的翻译与代码命名工具，提供 Electron 桌面应用、Web 页面和 Chrome 侧边栏扩展，支持 DeepSeek、OpenAI 及兼容 OpenAI Chat Completions 的接口。

## ✨ 功能

### 🌐 AI 翻译

- 支持 **15 种语言**互译：中、英、日、韩、法、德、西、葡、俄、阿、泰、越、意、荷、波兰语
- 自动检测中英文并切换目标语言
- 支持普通响应和流式输出
- 提供自动、正式、口语、学术、开发者 5 种翻译风格
- `Ctrl/Cmd + Enter` 提交翻译，`Enter` 换行

### 💻 代码命名

- 根据中文短语生成 3～5 个候选命名及说明
- 单行输入生成详细方案，多行输入批量生成
- 支持 camelCase、PascalCase、snake_case、kebab-case
- 可筛选命名格式，点击结果直接复制

### 📄 Markdown 翻译

- 保留标题、列表、表格、链接和代码块等 Markdown 结构
- 代码块内容保持原样

### ⚙️ 模型与设置

- DeepSeek 和 OpenAI 兼容接口可独立保存 API Key、模型及 API Base
- 支持从接口获取可用模型列表，也可手动填写模型名称
- 提供亮色、深色、跟随系统 3 种主题
- 翻译与命名历史保留 7 天，最多保存 50 条

### 🖥️ 桌面应用

- 默认全局快捷键：`CommandOrControl + Shift + T`
- 可在设置中录制新的全局快捷键
- macOS 关闭窗口后隐藏 Dock 图标，仅保留顶部菜单栏入口
- 从菜单栏或全局快捷键唤起时恢复窗口和 Dock 图标
- 单实例运行，重复启动时聚焦已有窗口
- 快捷键只有注册成功后才会保存；冲突时保留原快捷键

## 🚀 快速开始

### Electron 桌面端

```bash
npm install
npm run app
```

应用启动后，点击右上角设置按钮，选择模型来源并填写 API Key。

### Web 版

```bash
npm install
npm start
```

浏览器访问 [http://127.0.0.1:3456](http://127.0.0.1:3456)。服务只监听本机回环地址，不对局域网开放。

如需由服务端环境变量提供默认 DeepSeek Key：

```bash
cp .env.example .env
# 编辑 .env，填写 DEEPSEEK_API_KEY
```

### Chrome 扩展

1. 打开 `chrome://extensions/`
2. 开启“开发者模式”
3. 点击“加载已解压的扩展程序”，选择 `extension/` 目录
4. 点击工具栏图标打开侧边栏
5. 在设置中填写 API Key 和模型配置

扩展会直接请求所配置的模型接口，不依赖本地 Node.js 服务。

## ⌨️ 快捷键

| 场景 | 快捷键 |
| --- | --- |
| 提交翻译 | `Ctrl/Cmd + Enter` |
| 生成代码命名 | `Ctrl/Cmd + Enter` |
| 唤起桌面应用 | 默认 `CommandOrControl + Shift + T` |
| 取消快捷键录制 | `Escape` |

录制全局快捷键时必须包含 `Command`、`Control` 或 `Alt`，不支持单独占用字母键。

## 🧪 测试

```bash
npm test
```

测试覆盖本地 API 会话鉴权、快捷键注册与持久化、API Base 校验，以及桌面端批量命名和 Markdown 翻译请求参数。

## 📦 macOS 打包

```bash
# 生成未封装的 .app
npm run build

# 生成 DMG 和 ZIP
npm run dist
```

产物默认位于 `dist/`。公开分发前需要配置 Developer ID Application 证书和 Apple 公证凭据；仅使用 Apple Development 证书生成的包可能触发其他设备的 Gatekeeper 提示。

## 🔒 本地安全边界

- 桌面应用的 Node.js 服务仅监听 `127.0.0.1`
- Electron 请求通过每次启动随机生成的会话令牌访问本地 API
- 上游模型请求设有超时，API Base 仅接受 HTTP/HTTPS 地址
- 模型返回的结构化字段在渲染前进行 HTML 和属性转义
- 日志只记录模型、字符数和耗时，不输出用户原文

API Key 和历史记录保存在对应运行环境的本地存储中，请避免在共享账户或不可信设备上保存敏感密钥。

## 📁 项目结构

```text
ColaTranslate/
├── main.js                 # Electron 主进程、托盘和全局快捷键
├── server.js               # 本地静态服务和模型 API 代理
├── public/
│   └── index.html          # Web/Electron 渲染页面
├── extension/
│   ├── manifest.json       # Chrome Manifest V3 配置
│   ├── background.js
│   ├── sidepanel.html
│   ├── sidepanel.js
│   └── icons/
├── test/
│   ├── frontend.test.js
│   └── server.test.js
├── package.json
├── .env.example
└── README.md
```

## 🛠️ 技术栈

- 前端：原生 HTML、CSS、JavaScript
- 桌面端：Electron
- 后端：Node.js、Express
- 浏览器扩展：Chrome Manifest V3 Side Panel
- 打包：electron-builder
- 模型协议：OpenAI Chat Completions 兼容接口

## 📄 License

MIT
