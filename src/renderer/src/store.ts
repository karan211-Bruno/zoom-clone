// Zustand store for app state management
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { User, Meeting, MeetingSettings } from '@shared/types';

interface AppState {
  // User state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateCurrentUser: (updates: Partial<User>) => void;

  // Meeting state
  currentMeeting: Meeting | null;
  setCurrentMeeting: (meeting: Meeting | null) => void;
  updateMeetingSettings: (settings: Partial<MeetingSettings>) => void;
  addParticipant: (user: User) => void;
  removeParticipant: (userId: string) => void;
  updateParticipant: (userId: string, updates: Partial<User>) => void;

  // UI state
  isJoining: boolean;
  setIsJoining: (value: boolean) => void;
  showSettings: boolean;
  setShowSettings: (value: boolean) => void;
  activeTab: 'video' | 'chat' | 'participants' | 'settings';
  setActiveTab: (tab: AppState['activeTab']) => void;

  // Media state
  localStream: MediaStream | null;
  setLocalStream: (stream: MediaStream | null) => void;
  screenStream: MediaStream | null;
  setScreenStream: (stream: MediaStream | null) => void;
  audioEnabled: boolean;
  setAudioEnabled: (value: boolean) => void;
  videoEnabled: boolean;
  setVideoEnabled: (value: boolean) => void;
  isScreenSharing: boolean;
  setIsScreenSharing: (value: boolean) => void;

  // Devices
  audioInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  videoInputDevices: MediaDeviceInfo[];
  setMediaDevices: (devices: {
    audioInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
  }) => void;
  selectedAudioInput: string;
  setSelectedAudioInput: (deviceId: string) => void;
  selectedAudioOutput: string;
  setSelectedAudioOutput: (deviceId: string) => void;
  selectedVideoInput: string;
  setSelectedVideoInput: (deviceId: string) => void;

  // Chat
  messages: Array<{ id: string; from: string; fromName: string; message: string; timestamp: number; isPrivate?: boolean }>;
  addMessage: (message: AppState['messages'][0]) => void;
  clearMessages: () => void;

  // Connection
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
  connectionError: string | null;
  setConnectionError: (error: string | null) => void;

  // Recording
  isRecording: boolean;
  setIsRecording: (value: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  currentUser: null,
  currentMeeting: null,
  isJoining: false,
  showSettings: false,
  activeTab: 'video' as const,
  localStream: null,
  screenStream: null,
  audioEnabled: true,
  videoEnabled: true,
  isScreenSharing: false,
  audioInputDevices: [],
  audioOutputDevices: [],
  videoInputDevices: [],
  selectedAudioInput: '',
  selectedAudioOutput: '',
  selectedVideoInput: '',
  messages: [],
  isConnected: false,
  connectionError: null,
  isRecording: false,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setCurrentUser: (user) => set({ currentUser: user }),
        updateCurrentUser: (updates) =>
          set((state) => ({
            currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null,
          })),

        setCurrentMeeting: (meeting) => set({ currentMeeting: meeting }),
        updateMeetingSettings: (settings) =>
          set((state) => ({
            currentMeeting: state.currentMeeting
              ? { ...state.currentMeeting, settings: { ...state.currentMeeting.settings, ...settings } }
              : null,
          })),
        addParticipant: (user) =>
          set((state) => ({
            currentMeeting: state.currentMeeting
              ? { ...state.currentMeeting, participants: [...state.currentMeeting.participants, user] }
              : null,
          })),
        removeParticipant: (userId) =>
          set((state) => ({
            currentMeeting: state.currentMeeting
              ? {
                  ...state.currentMeeting,
                  participants: state.currentMeeting.participants.filter((p) => p.id !== userId),
                }
              : null,
          })),
        updateParticipant: (userId, updates) =>
          set((state) => ({
            currentMeeting: state.currentMeeting
              ? {
                  ...state.currentMeeting,
                  participants: state.currentMeeting.participants.map((p) =>
                    p.id === userId ? { ...p, ...updates } : p
                  ),
                }
              : null,
          })),

        setIsJoining: (value) => set({ isJoining: value }),
        setShowSettings: (value) => set({ showSettings: value }),
        setActiveTab: (tab) => set({ activeTab: tab }),

        setLocalStream: (stream) => set({ localStream: stream }),
        setScreenStream: (stream) => set({ screenStream: stream }),
        setAudioEnabled: (value) => {
          set({ audioEnabled: value });
          get().currentUser && get().updateCurrentUser({ audioEnabled: value });
        },
        setVideoEnabled: (value) => {
          set({ videoEnabled: value });
          get().currentUser && get().updateCurrentUser({ videoEnabled: value });
        },
        setIsScreenSharing: (value) => set({ isScreenSharing: value }),

        setMediaDevices: (devices) =>
          set({
            audioInputDevices: devices.audioInputs,
            audioOutputDevices: devices.audioOutputs,
            videoInputDevices: devices.videoInputs,
          }),
        setSelectedAudioInput: (deviceId) => set({ selectedAudioInput: deviceId }),
        setSelectedAudioOutput: (deviceId) => set({ selectedAudioOutput: deviceId }),
        setSelectedVideoInput: (deviceId) => set({ selectedVideoInput: deviceId }),

        addMessage: (message) =>
          set((state) => ({ messages: [...state.messages, message] })),
        clearMessages: () => set({ messages: [] }),

        setIsConnected: (value) => set({ isConnected: value }),
        setConnectionError: (error) => set({ connectionError: error }),

        setIsRecording: (value) => set({ isRecording: value }),

        reset: () => set(initialState),
      }),
      {
        name: 'zoom-clone-store',
        partialize: (state) => ({
          selectedAudioInput: state.selectedAudioInput,
          selectedAudioOutput: state.selectedAudioOutput,
          selectedVideoInput: state.selectedVideoInput,
          audioEnabled: state.audioEnabled,
          videoEnabled: state.videoEnabled,
        }),
      }
    ),
    { name: 'ZoomClone' }
  )
);