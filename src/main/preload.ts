// Preload script - Secure bridge between main and renderer
// Uses contextBridge to expose safe APIs

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Type definitions for DOM APIs (available in renderer context)
interface RTCIceServer { urls: string | string[]; username?: string; credential?: string; }
interface RTCConfiguration { iceServers?: RTCIceServer[]; iceCandidatePoolSize?: number; }
interface MediaTrackConstraints { [key: string]: any; }
interface MediaStreamConstraints { audio?: boolean | MediaTrackConstraints; video?: boolean | MediaTrackConstraints; }

// Type definitions for exposed APIs
interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  joinMeeting: (payload: {
    userName: string;
    meetingId: string;
    password?: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
  }) => Promise<{
    success: boolean;
    meeting?: any;
    user?: any;
    error?: { code: string; message: string };
  }>;
  leaveMeeting: () => Promise<{ success: boolean }>;
  getMediaDevices: () => Promise<{
    audioInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
  }>;
  getRTCConfig: () => Promise<RTCConfiguration>;
  getMediaConstraints: () => Promise<MediaStreamConstraints>;
  showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;
  showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
  onMenuAction: (channel: string, listener: () => void) => () => void;
}

interface MediaDeviceInfo {
  deviceId: string;
  kind: 'audioinput' | 'audiooutput' | 'videoinput';
  label: string;
  groupId: string;
}

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  joinMeeting: (payload) => ipcRenderer.invoke('join-meeting', payload),
  leaveMeeting: () => ipcRenderer.invoke('leave-meeting'),
  getMediaDevices: () => ipcRenderer.invoke('get-media-devices'),
  getRTCConfig: () => ipcRenderer.invoke('get-rtc-config'),
  getMediaConstraints: () => ipcRenderer.invoke('get-media-constraints'),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

  // Menu actions
  onMenuAction: (channel, listener) => {
    const handler = (_event: IpcRendererEvent) => listener();
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
} satisfies ElectronAPI);

// Expose platform info
contextBridge.exposeInMainWorld('platform', {
  isMac: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux',
});

// Security: Disable Node.js integration in renderer
// The renderer cannot access require, process, or Node.js APIs