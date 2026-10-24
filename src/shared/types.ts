// Shared types between main, renderer, and signaling

// Type references for DOM APIs (available in browser/renderer context)
type RTCSessionDescriptionInit = { type: RTCSdpType; sdp?: string };
type RTCIceCandidateInit = { candidate?: string; sdpMid?: string | null; sdpMLineIndex?: number | null; usernameFragment?: string | null };
type RTCConfiguration = { iceServers?: RTCIceServer[]; iceCandidatePoolSize?: number; iceTransportPolicy?: RTCIceTransportPolicy; bundlePolicy?: RTCBundlePolicy; rtcpMuxPolicy?: RTCRtcpMuxPolicy; peerIdentity?: string; certificates?: RTCCertificate[] };
type MediaStreamConstraints = { audio?: boolean | MediaTrackConstraints; video?: boolean | MediaTrackConstraints; };
type MediaTrackConstraints = { [key: string]: any };
type RTCIceServer = { urls: string | string[]; username?: string; credential?: string; credentialType?: 'password' | 'oauth' };
type RTCSdpType = 'offer' | 'answer' | 'pranswer' | 'rollback';
type RTCIceTransportPolicy = 'relay' | 'all';
type RTCBundlePolicy = 'balanced' | 'max-compat' | 'max-bundle';
type RTCRtcpMuxPolicy = 'require' | 'negotiate';
type RTCCertificate = any;

export interface User {
  id: string;
  name: string;
  avatar?: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  isHost: boolean;
  joinedAt: number;
}

export interface Meeting {
  id: string;
  name: string;
  hostId: string;
  participants: User[];
  createdAt: number;
  settings: MeetingSettings;
}

export interface MeetingSettings {
  allowScreenShare: boolean;
  allowChat: boolean;
  allowRecording: boolean;
  muteOnEntry: boolean;
  videoOnEntry: boolean;
  password?: string;
}

export interface SignalingMessage {
  type: SignalingMessageType;
  payload: unknown;
  from: string;
  to?: string;
  meetingId: string;
  timestamp: number;
}

export type SignalingMessageType =
  | 'join'
  | 'leave'
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'user-joined'
  | 'user-left'
  | 'user-updated'
  | 'meeting-state'
  | 'chat'
  | 'screen-share-start'
  | 'screen-share-stop'
  | 'recording-start'
  | 'recording-stop'
  | 'kick-user'
  | 'mute-user'
  | 'error';

export interface JoinPayload {
  userName: string;
  meetingId: string;
  password?: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

export interface OfferPayload {
  sdp: RTCSessionDescriptionInit;
  to: string;
}

export interface AnswerPayload {
  sdp: RTCSessionDescriptionInit;
  to: string;
}

export interface IceCandidatePayload {
  candidate: RTCIceCandidateInit;
  to: string;
}

export interface UserJoinedPayload {
  user: User;
}

export interface UserLeftPayload {
  userId: string;
}

export interface UserUpdatedPayload {
  userId: string;
  updates: Partial<User>;
}

export interface MeetingStatePayload {
  meeting: Meeting;
  currentUser: User;
}

export interface ChatPayload {
  message: string;
  to?: string; // undefined = broadcast
}

export interface ErrorPayload {
  code: string;
  message: string;
}

// WebRTC configuration
export const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Add TURN servers for production
    // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' },
  ],
  iceCandidatePoolSize: 10,
};

export const MEDIA_CONSTRAINTS: MediaStreamConstraints = {
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
};

export const SCREEN_SHARE_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
  },
};