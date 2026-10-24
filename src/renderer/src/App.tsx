// Main App Component
import React, { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from './store';
import { electronAPI, platform } from './electron-bridge';
import { LoginScreen } from './components/LoginScreen';
import { MeetingScreen } from './components/MeetingScreen';
import { SettingsModal } from './components/SettingsModal';
import { PreJoinScreen } from './components/PreJoinScreen';

export function App() {
  const {
    currentUser,
    currentMeeting,
    isJoining,
    showSettings,
    activeTab,
    setActiveTab,
    setShowSettings,
    reset,
    localStream,
    audioEnabled,
    videoEnabled,
    isScreenSharing,
    isConnected,
    connectionError,
    setConnectionError,
    setIsConnected,
    setCurrentUser,
    setCurrentMeeting,
    setLocalStream,
    setIsJoining,
    setAudioEnabled,
    setVideoEnabled,
    setIsScreenSharing,
  } = useAppStore();

  const mediaInitialized = useRef(false);

  // Initialize media devices on mount
  useEffect(() => {
    const initMediaDevices = async () => {
      try {
        const devices = await electronAPI.getMediaDevices();
        useAppStore.getState().setMediaDevices(devices);
      } catch (error) {
        console.error('Failed to get media devices:', error);
      }
    };
    initMediaDevices();

    // Listen for menu actions
    const cleanupNewMeeting = electronAPI.onMenuAction('menu-new-meeting', () => {
      if (!currentMeeting) {
        setShowSettings(false);
        // Trigger new meeting flow
      }
    });
    const cleanupJoinMeeting = electronAPI.onMenuAction('menu-join-meeting', () => {
      if (!currentMeeting) {
        setShowSettings(false);
        // Trigger join meeting flow
      }
    });

    return () => {
      cleanupNewMeeting();
      cleanupJoinMeeting();
    };
  }, [currentMeeting, setShowSettings]);

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    if (mediaInitialized.current) return;
    mediaInitialized.current = true;

    try {
      const constraints = await electronAPI.getMediaConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      // Apply initial audio/video settings
      stream.getAudioTracks().forEach(track => track.enabled = audioEnabled);
      stream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
    } catch (error) {
      console.error('Failed to initialize local stream:', error);
      setConnectionError('카메라/마이크 접근 권한이 필요합니다.');
    }
  }, [audioEnabled, videoEnabled, setLocalStream, setConnectionError]);

  // Handle pre-join screen
  if (!currentUser && !currentMeeting && !isJoining) {
    return <LoginScreen onJoin={initializeLocalStream} />;
  }

  // Handle pre-join preview
  if (currentUser && !currentMeeting && isJoining) {
    return <PreJoinScreen onJoinComplete={initializeLocalStream} />;
  }

  // Main meeting screen
  if (currentMeeting) {
    return (
      <div className="h-screen w-screen flex flex-col bg-primary">
        <MeetingScreen />
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}
      </div>
    );
  }

  return null;
}

// Electron API bridge types
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

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    platform: {
      isMac: boolean;
      isWindows: boolean;
      isLinux: boolean;
    };
  }
}