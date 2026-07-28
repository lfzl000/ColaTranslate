const { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { startServer, setShortcutCallback } = require('./server');

let mainWindow;
let tray = null;
let serverPort = 3456;
let isQuitting = false;
let userDataPath;

function getIcon(name) {
  return path.join(__dirname, 'extension', 'icons', name);
}

function getShortcutPath() {
  return path.join(userDataPath, '.shortcut.json');
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
    serverPort = await startServer(undefined, { userDataPath });
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
  mainWindow.setTitle('🐕 可乐翻译助手');

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// 全局快捷键
function registerShortcut(key) {
  const shortcut = key || loadDefaultShortcut();
  globalShortcut.unregisterAll();
  const ok = globalShortcut.register(shortcut, showWindow);
  if (ok) {
    console.log(`全局快捷键已注册: ${shortcut}`);
  } else {
    console.error(`快捷键注册失败: ${shortcut}（可能与其他应用冲突）`);
    const fallback = 'CommandOrControl+Shift+T';
    if (globalShortcut.register(fallback, showWindow)) {
      console.log(`回退到: ${fallback}`);
    }
  }
}

function loadDefaultShortcut() {
  try { return JSON.parse(fs.readFileSync(getShortcutPath(), 'utf8')).key; }
  catch { return 'CommandOrControl+Shift+T'; }
}

app.whenReady().then(() => {
  userDataPath = app.getPath('userData');
  createTray();
  setShortcutCallback(registerShortcut);
  createWindow().then(() => {
    registerShortcut(loadDefaultShortcut());
  });
});

app.on('before-quit', () => { isQuitting = true; });
app.on('will-quit', () => { globalShortcut.unregisterAll(); });

app.on('window-all-closed', () => { /* tray & dock keep alive */ });

app.on('activate', () => {
  if (mainWindow === null) createWindow().then(() => registerShortcut(loadDefaultShortcut()));
  else showWindow();
});
