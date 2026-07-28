const { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { startServer } = require('./server');

let mainWindow;
let tray = null;
let serverPort = 3456;
let isQuitting = false;
let currentShortcut = 'CommandOrControl+Shift+T';

function getIcon(name) {
  return path.join(__dirname, 'extension', 'icons', name);
}

function createTray() {
  const icon = nativeImage.createFromPath(getIcon('icon16.png'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('可乐翻译助手');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示窗口', click: showWindow },
    { type: 'separator' },
    { label: '退出', click: () => { isQuitting = true; app.quit(); } }
  ]));
  tray.on('click', showWindow);
  tray.on('double-click', showWindow);
}

function showWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
}

async function createWindow() {
  try {
    serverPort = await startServer();
    console.log(`服务已启动: http://localhost:${serverPort}`);
  } catch (err) {
    console.error('服务启动失败:', err);
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 860,
    height: 640,
    minWidth: 720,
    minHeight: 520,
    title: '可乐翻译助手',
    icon: getIcon('icon512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL(`http://localhost:${serverPort}?electron=1`);
  mainWindow.setTitle('🐕 可乐翻译���手');

  // Cmd+W: 隐藏到托盘，不退出
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// 全局快捷键
function loadShortcutConfig() {
  const file = path.join(__dirname, '.shortcut.json');
  try { return JSON.parse(fs.readFileSync(file, 'utf8')).key; }
  catch { return 'CommandOrControl+Shift+T'; }
}

function registerShortcut() {
  globalShortcut.unregisterAll();
  currentShortcut = loadShortcutConfig();
  try {
    globalShortcut.register(currentShortcut, showWindow);
    console.log(`全局快捷键已注册: ${currentShortcut}`);
  } catch (err) {
    console.error(`全局快捷键注册失败 (${currentShortcut}):`, err.message);
    // 回退到默认
    currentShortcut = 'CommandOrControl+Shift+T';
    globalShortcut.register(currentShortcut, showWindow);
  }
}

app.whenReady().then(() => {
  createTray();
  createWindow();
  registerShortcut();

  // 监听快捷键配置变更
  const shortcutFile = path.join(__dirname, '.shortcut.json');
  fs.watchFile(shortcutFile, { interval: 1000 }, registerShortcut);
});

app.on('before-quit', () => { isQuitting = true; });
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  const shortcutFile = path.join(__dirname, '.shortcut.json');
  fs.unwatchFile(shortcutFile);
});

app.on('window-all-closed', () => { /* tray & dock keep alive */ });

app.on('activate', () => {
  if (mainWindow === null) createWindow();
  else showWindow();
});
