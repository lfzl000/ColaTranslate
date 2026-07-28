const { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage, shell } = require('electron');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { startServer, setShortcutCallback } = require('./server');

let mainWindow;
let tray = null;
let serverPort = 3456;
let isQuitting = false;
let userDataPath;
let currentShortcut = null;
const apiToken = crypto.randomBytes(32).toString('hex');
const DEFAULT_SHORTCUT = 'CommandOrControl+Shift+T';

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

async function showWindow() {
  if (process.platform === 'darwin' && app.dock && !app.dock.isVisible()) {
    try { await app.dock.show(); }
    catch (err) { console.error('恢复 Dock 图标失败:', err.message); }
  }
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
}

async function createWindow() {
  try {
    serverPort = await startServer(undefined, { userDataPath, authToken: apiToken });
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

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders({ urls: ['<all_urls>'] }, (details, callback) => {
    const url = new URL(details.url);
    if (url.hostname === '127.0.0.1' && url.port === String(serverPort) && url.pathname.startsWith('/api/')) {
      details.requestHeaders['X-Cola-Token'] = apiToken;
    }
    callback({ requestHeaders: details.requestHeaders });
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.loadURL(`http://127.0.0.1:${serverPort}?electron=1`);
  mainWindow.setTitle('可乐翻译助手');

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
      if (process.platform === 'darwin' && app.dock) {
        app.dock.hide().catch((err) => console.error('隐藏 Dock 图标失败:', err.message));
      }
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

// 全局快捷键
function registerShortcut(key) {
  const shortcut = key || loadDefaultShortcut();
  if (shortcut === currentShortcut && globalShortcut.isRegistered(shortcut)) {
    return { ok: true, key: shortcut };
  }

  const previousShortcut = currentShortcut;
  if (previousShortcut) globalShortcut.unregister(previousShortcut);

  try {
    if (globalShortcut.register(shortcut, showWindow)) {
      currentShortcut = shortcut;
      console.log(`全局快捷键已注册: ${shortcut}`);
      return { ok: true, key: shortcut };
    }
  } catch (err) {
    console.error(`快捷键格式无效: ${shortcut}`, err.message);
  }

  if (previousShortcut && globalShortcut.register(previousShortcut, showWindow)) {
    currentShortcut = previousShortcut;
  } else {
    currentShortcut = null;
  }
  return { ok: false, error: `快捷键 ${shortcut} 无效或已被其他应用占用` };
}

function loadDefaultShortcut() {
  try { return JSON.parse(fs.readFileSync(getShortcutPath(), 'utf8')).key; }
  catch { return DEFAULT_SHORTCUT; }
}

function registerInitialShortcut() {
  const configured = loadDefaultShortcut();
  const result = registerShortcut(configured);
  if (!result.ok && configured !== DEFAULT_SHORTCUT) {
    const fallback = registerShortcut(DEFAULT_SHORTCUT);
    if (fallback.ok) console.log(`回退到: ${DEFAULT_SHORTCUT}`);
  }
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', showWindow);
  app.whenReady().then(() => {
    userDataPath = app.getPath('userData');
    if (process.platform === 'darwin' && app.dock) {
      app.dock.setIcon(getIcon('icon512.png'));
    }
    createTray();
    setShortcutCallback(registerShortcut);
    createWindow().then(() => {
      registerInitialShortcut();
    });
  });
}

app.on('before-quit', () => { isQuitting = true; });
app.on('will-quit', () => { globalShortcut.unregisterAll(); });

app.on('window-all-closed', () => { /* tray & dock keep alive */ });

app.on('activate', () => {
  if (mainWindow === null) createWindow().then(registerInitialShortcut);
  else showWindow();
});
