// Pre-Join Preview Screen
import React, { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store';
import { api } from '../electron-bridge';

export function PreJoinScreen({ onJoinComplete }: { onJoinComplete: () => void }) {
  const {
    currentUser,
    currentMeeting,
    localStream,
    audioEnabled,
    videoEnabled,
    setAudioEnabled,
    setVideoEnabled,
    selectedAudioInput,
    selectedVideoInput,
    audioInputDevices,
    videoInputDevices,
    setSelectedAudioInput,
    setSelectedVideoInput,
    setLocalStream,
    setIsJoining,
  } = useAppStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const devicesLoaded = useRef(false);

  // Initialize preview stream
  useEffect(() => {
    let mounted = true;
    let stream: MediaStream | null = null;

    const initPreview = async () => {
      try {
        const constraints = await api.getMediaConstraints();
        // Override with selected devices
        if (selectedAudioInput && selectedAudioInput !== 'default') {
          (constraints.audio as any).deviceId = { exact: selectedAudioInput };
        }
        if (selectedVideoInput && selectedVideoInput !== 'default') {
          (constraints.video as any).deviceId = { exact: selectedVideoInput };
        }

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (mounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          setLocalStream(stream);
          
          // Apply initial settings
          stream.getAudioTracks().forEach(track => track.enabled = audioEnabled);
          stream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
        }
      } catch (error) {
        console.error('Failed to start preview:', error);
      }
    };

    initPreview();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedAudioInput, selectedVideoInput, audioEnabled, videoEnabled, setLocalStream]);

  // Load devices
  useEffect(() => {
    if (devicesLoaded.current) return;
    devicesLoaded.current = true;

    const loadDevices = async () => {
      try {
        const devices = await api.getMediaDevices();
        useAppStore.getState().setMediaDevices(devices);
        
        // Set defaults
        if (devices.audioInputs.length > 0 && !selectedAudioInput) {
          setSelectedAudioInput(devices.audioInputs[0].deviceId);
        }
        if (devices.videoInputs.length > 0 && !selectedVideoInput) {
          setSelectedVideoInput(devices.videoInputs[0].deviceId);
        }
      } catch (error) {
        console.error('Failed to load devices:', error);
      }
    };

    loadDevices();
  }, [selectedAudioInput, selectedVideoInput, setSelectedAudioInput, setSelectedVideoInput]);

  const handleJoin = useCallback(() => {
    onJoinComplete();
    setIsJoining(false);
  }, [onJoinComplete, setIsJoining]);

  if (!currentUser) return null;

  return (
    <div className="h-screen w-screen flex flex-col bg-primary">
      {/* Top Bar */}
      <header className="flex items-center justify-between p-4 border-b border-border-color bg-secondary/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polygon points="21 15 16 10 21 5" />
            </svg>
          </div>
          <div>
            <h1 className="font-semibold text-primary">회의 참가</h1>
            <p className="text-xs text-muted">{currentMeeting?.name || currentMeeting?.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary">{currentUser?.name} (나)</span>
          <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center font-medium text-accent-primary">
            {currentUser?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Preview */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Video Preview */}
          <div className="relative aspect-video bg-tertiary rounded-xl overflow-hidden border border-border-color mb-6">
            {videoRef.current ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-secondary">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 animate-pulse">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                <p>카메라 준비 중...</p>
              </div>
            )}
            
            {/* Preview badge */}
            <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur text-xs text-secondary rounded badge">
              미리보기
            </div>

            {/* Mirror indicator */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur text-xs text-secondary rounded">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 12h-4M4 12h4M10 4v16M10 4l-4 4M10 20l-4-4" />
              </svg>
              <span>미러링</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-secondary rounded-lg border border-border-color">
            <div className="w-16 h-16 rounded-full bg-tertiary flex items-center justify-center font-bold text-xl text-accent-primary">
              {currentUser?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="text-center">
              <p className="font-semibold text-primary">{currentUser?.name}</p>
              <p className="text-sm text-muted">회의 참가자로 입장합니다</p>
            </div>
          </div>

          {/* Audio/Video Controls */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-secondary rounded-lg border border-border-color p-4">
              <label className="block text-sm font-medium text-secondary mb-3 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="19" y1="9" x2="19" y2="15" />
                  <line x1="23" y1="9" x2="23" y2="15" />
                </svg>
                마이크
              </label>
              <div className="flex items-center justify-between">
                <select
                  value={selectedAudioInput || 'default'}
                  onChange={(e) => setSelectedAudioInput(e.target.value)}
                  className="input flex-1 mr-2"
                >
                  <option value="default">기본 장치</option>
                  {audioInputDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `마이크 ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`btn btn-icon p-2 rounded-lg transition ${
                    audioEnabled ? 'btn-secondary' : 'btn-danger'
                  }`}
                  aria-label={audioEnabled ? '마이크 끄기' : '마이크 켜기'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {audioEnabled ? (
                      <>
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                        <line x1="8" y1="22" x2="16" y2="22" />
                      </>
                    ) : (
                      <>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="17" y1="17" x2="7" y2="7" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-secondary rounded-lg border border-border-color p-4">
              <label className="block text-sm font-medium text-secondary mb-3 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                카메라
              </label>
              <div className="flex items-center justify-between">
                <select
                  value={selectedVideoInput || 'default'}
                  onChange={(e) => setSelectedVideoInput(e.target.value)}
                  className="input flex-1 mr-2"
                >
                  <option value="default">기본 장치</option>
                  {videoInputDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `카메라 ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setVideoEnabled(!videoEnabled)}
                  className={`btn btn-icon p-2 rounded-lg transition ${
                    videoEnabled ? 'btn-secondary' : 'btn-danger'
                  }`}
                  aria-label={videoEnabled ? '카메라 끄기' : '카메라 켜기'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {videoEnabled ? (
                      <>
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </>
                    ) : (
                      <>
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        <line x1="1" y1="5" x2="23" y2="19" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Meeting ID Display */}
          <div className="bg-secondary rounded-lg border border-border-color p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">회의 ID</span>
              <div className="flex items-center gap-2">
                <code className="bg-tertiary px-3 py-1 rounded font-mono text-sm text-primary tracking-wider select-all">
                  {currentMeeting?.id}
                </code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(currentMeeting?.id || '')}
                  className="btn btn-icon btn-ghost"
                  aria-label="회의 ID 복사"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoin}
            className="btn btn-primary w-full py-4 text-lg font-semibold"
          >
            회의 참가
          </button>
        </div>
      </main>
    </div>
  );
}