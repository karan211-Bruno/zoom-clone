// Main Electron process
// Handles: window management, native menus, system tray, auto-updates, signaling server lifecycle

import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, screen, shell, dialog } from 'electron';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  Meeting,
  SignalingMessage,
  SignalingMessageType,
  JoinPayload,
  RTC_CONFIGURATION,
  MEDIA_CONSTRAINTS,
} from '../shared/types';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PRELOAD_PATH = join(__dirname, 'preload.js');
const RENDERER_URL = isDev ? 'http://localhost:5173' : `file://${join(__dirname, '../renderer/index.html')}`;
const SIGNALING_SERVER_PATH = isDev
  ? join(__dirname, '../../src/signaling/server.ts')
  : join(process.resourcesPath, 'signaling/server.js');

let mainWindow: BrowserWindow | null = null;
let signalingProcess: ChildProcess | null = null;
let tray: Tray | null = null;
let currentMeetingId: string | null = null;
let currentUserId: string | null = null;

function createMainWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1400, width),
    height: Math.min(900, height),
    minWidth: 1000,
    minHeight: 650,
    x: (width - Math.min(1400, width)) / 2,
    y: (height - Math.min(900, height)) / 2,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: !isDev,
      allowRunningInsecureContent: isDev,
      spellcheck: true,
    },
    icon: isDev
      ? join(__dirname, '../../public/icon.png')
      : join(process.resourcesPath, 'icon.png'),
  });

  mainWindow.loadURL(RENDERER_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Create application menu
  createAppMenu();
}

function createAppMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: '편집',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: '보기',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: '창',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' },
      ],
    },
    {
      label: '회의',
      submenu: [
        {
          label: '새 회의',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu-new-meeting'),
        },
        {
          label: '회의 참가',
          accelerator: 'CmdOrCtrl+J',
          click: () => mainWindow?.webContents.send('menu-join-meeting'),
        },
        { type: 'separator' },
        {
          label: '오디오 설정...',
          click: () => mainWindow?.webContents.send('menu-audio-settings'),
        },
        {
          label: '비디오 설정...',
          click: () => mainWindow?.webContents.send('menu-video-settings'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createTray(): void {
  const iconPath = isDev
    ? join(__dirname, '../../public/tray-icon.png')
    : join(process.resourcesPath, 'tray-icon.png');

  if (existsSync(iconPath)) {
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '회의 열기',
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      { type: 'separator' },
      {
        label: '종료',
        click: () => {
          app.quit();
        },
      },
    ]);

    tray.setToolTip('ZoomClone');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      mainWindow?.show();
      mainWindow?.focus();
    });
  }
}

async function startSignalingServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = isDev ? ['watch', SIGNALING_SERVER_PATH] : [SIGNALING_SERVER_PATH];
    const command = isDev ? 'tsx' : 'node';

    signalingProcess = spawn(command, args, {
      env: { ...process.env, NODE_ENV: isDev ? 'development' : 'production' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    signalingProcess.stdout?.on('data', (data) => {
      console.log(`[Signaling] ${data.toString().trim()}`);
      if (data.toString().includes('Signaling server listening')) {
        resolve();
      }
    });

    signalingProcess.stderr?.on('data', (data) => {
      console.error(`[Signaling Error] ${data.toString().trim()}`);
    });

    signalingProcess.on('error', (err) => {
      console.error('Failed to start signaling server:', err);
      reject(err);
    });

    signalingProcess.on('exit', (code) => {
      console.log(`Signaling server exited with code ${code}`);
      signalingProcess = null;
    });

    // Timeout after 10 seconds
    setTimeout(() => reject(new Error('Signaling server startup timeout')), 10000);
  });
}

function stopSignalingServer(): void {
  if (signalingProcess) {
    signalingProcess.kill('SIGTERM');
    signalingProcess = null;
  }
}

// IPC Handlers
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('get-platform', () => process.platform);

ipcMain.handle('join-meeting', async (_event, payload: JoinPayload) => {
  currentMeetingId = payload.meetingId;
  currentUserId = uuidv4();

  // In a real app, this would connect to the signaling server via socket.io-client
  // For now, we simulate the response
  const user: User = {
    id: currentUserId,
    name: payload.userName,
    audioEnabled: payload.audioEnabled,
    videoEnabled: payload.videoEnabled,
    screenSharing: false,
    isHost: false,
    joinedAt: Date.now(),
  };

  const meeting: Meeting = {
    id: payload.meetingId,
    name: `Meeting ${payload.meetingId.slice(0, 8)}`,
    hostId: currentUserId,
    participants: [user],
    createdAt: Date.now(),
    settings: {
      allowScreenShare: true,
      allowChat: true,
      allowRecording: false,
      muteOnEntry: true,
      videoOnEntry: true,
    },
  };

  return { success: true, meeting, user };
});

ipcMain.handle('leave-meeting', async () => {
  currentMeetingId = null;
  currentUserId = null;
  return { success: true };
});

ipcMain.handle('get-media-devices', async () => {
  // This would normally use Electron's session to enumerate devices
  // For now, return mock data
  return {
    audioInputs: [],
    audioOutputs: [],
    videoInputs: [],
  };
});

ipcMain.handle('get-rtc-config', () => RTC_CONFIGURATION);

ipcMain.handle('get-media-constraints', () => MEDIA_CONSTRAINTS);

ipcMain.handle('show-save-dialog', async (_event, options: Electron.SaveDialogOptions) => {
  const result = await dialog.showSaveDialog(mainWindow!, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (_event, options: Electron.OpenDialogOptions) => {
  const result = await dialog.showOpenDialog(mainWindow!, options);
  return result;
});

// App lifecycle
app.whenReady().then(async () => {
  try {
    await startSignalingServer();
    createMainWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  } catch (error) {
    console.error('Failed to start app:', error);
    dialog.showErrorBox('시작 오류', `애플리케이션을 시작할 수 없습니다: ${error}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopSignalingServer();
});

// Security: Prevent new window creation
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

// Handle certificate errors in development
if (isDev) {
  app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
    event.preventDefault();
    callback(true);
  });
}