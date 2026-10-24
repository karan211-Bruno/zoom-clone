// Electron API Bridge - Type-safe wrapper for preload exposed APIs

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

interface PlatformInfo {
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
}

// Type-safe access to electronAPI
export const electronAPI = (window as any).electronAPI as ElectronAPI;
export const platform = (window as any).platform as PlatformInfo;

// Helper to check if running in Electron
export const isElectron = () => {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
};

// Mock API for browser development
export const mockElectronAPI: ElectronAPI = {
  getAppVersion: async () => '1.0.0-dev',
  getPlatform: async () => navigator.platform,
  joinMeeting: async (payload) => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1000));
    
    const meetingId = payload.meetingId || `meeting-${Date.now()}`;
    const userId = `user-${Date.now()}`;
    
    return {
      success: true,
      meeting: {
        id: meetingId,
        name: `Meeting ${meetingId.slice(0, 8)}`,
        hostId: userId,
        participants: [{
          id: userId,
          name: payload.userName,
          audioEnabled: payload.audioEnabled,
          videoEnabled: payload.videoEnabled,
          screenSharing: false,
          isHost: true,
          joinedAt: Date.now(),
        }],
        createdAt: Date.now(),
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowRecording: false,
          muteOnEntry: false,
          videoOnEntry: true,
        },
      },
      user: {
        id: userId,
        name: payload.userName,
        audioEnabled: payload.audioEnabled,
        videoEnabled: payload.videoEnabled,
        screenSharing: false,
        isHost: true,
        joinedAt: Date.now(),
      },
    };
  },
  leaveMeeting: async () => ({ success: true }),
  getMediaDevices: async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        audioInputs: devices.filter(d => d.kind === 'audioinput'),
        audioOutputs: devices.filter(d => d.kind === 'audiooutput'),
        videoInputs: devices.filter(d => d.kind === 'videoinput'),
      };
    } catch {
      return { audioInputs: [], audioOutputs: [], videoInputs: [] };
    }
  },
  getRTCConfig: async () => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
  }),
  getMediaConstraints: async () => ({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 2,
    },
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 30 },
      facingMode: 'user',
    },
  }),
  showSaveDialog: async () => ({ canceled: true, filePath: '' }),
  showOpenDialog: async () => ({ canceled: true, filePaths: [] }),
  onMenuAction: () => () => {},
};

// Use mock API when not in Electron
export const api = isElectron() ? electronAPI : mockElectronAPI;