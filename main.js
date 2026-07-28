const { app, BrowserWindow, Menu, Tray } = require('electron');
const path = require('path');
const { startServer } = require('./server');

let mainWindow;
let tray = null;
let serverPort = 3456;

async function createWindow() {
  // Start Express server
  try {
    serverPort = await startServer();
    console.log(`服务已启动: http://localhost:${serverPort}`);
  } catch (err) {
    console.error('服务启动失败:', err);
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 440,
    height: 700,
    minWidth: 360,
    minHeight: 500,
    title: '可乐翻译助手',
    icon: path.join(__dirname, 'extension', 'icons', 'icon128.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL(`http://localhost:${serverPort}`);
  mainWindow.setTitle('🐕 可乐翻译助手');

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
