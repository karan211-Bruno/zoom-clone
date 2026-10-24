// Settings Modal
import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';
import { api } from '../electron-bridge';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const {
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoInput,
    audioInputDevices,
    audioOutputDevices,
    videoInputDevices,
    setSelectedAudioInput,
    setSelectedAudioOutput,
    setSelectedVideoInput,
    audioEnabled,
    videoEnabled,
    setAudioEnabled,
    setVideoEnabled,
  } = useAppStore();

  const [testStream, setTestStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeTab, setActiveTab] = useState<'audio' | 'video' | 'general'>('audio');
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on backdrop click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Test video preview
  useEffect(() => {
    let mounted = true;
    let stream: MediaStream | null = null;

    const startTestPreview = async () => {
      if (activeTab !== 'video') {
        if (testStream) {
          testStream.getTracks().forEach(t => t.stop());
          setTestStream(null);
        }
        return;
      }

      try {
        const constraints = await api.getMediaConstraints();
        if (selectedVideoInput && selectedVideoInput !== 'default') {
          (constraints.video as any).deviceId = { exact: selectedVideoInput };
        }
        // Audio off for preview
        constraints.audio = false;

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (mounted) {
          setTestStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.error('Preview error:', err);
      }
    };

    startTestPreview();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [selectedVideoInput, activeTab, testStream]);

  const handleAudioInputChange = async (deviceId: string) => {
    setSelectedAudioInput(deviceId);
    // Restart local stream with new device
    // This would be handled by the main app
  };

  const handleVideoInputChange = async (deviceId: string) => {
    setSelectedVideoInput(deviceId);
  };

  const handleAudioOutputChange = async (deviceId: string) => {
    setSelectedAudioOutput(deviceId);
    // In real app, use setSinkId on audio elements
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal-content w-full max-w-lg max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <h2 className="font-semibold text-primary">설정</h2>
          <button
            onClick={onClose}
            className="btn btn-icon btn-ghost p-1"
            aria-label="닫기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-color">
          {(['audio', 'video', 'general'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition ${
                activeTab === tab
                  ? 'border-accent-primary text-primary'
                  : 'border-transparent text-muted hover:text-secondary'
              }`}
            >
              {tab === 'audio' && '오디오'}
              {tab === 'video' && '비디오'}
              {tab === 'general' && '일반'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {activeTab === 'audio' && (
            <div className="space-y-6">
              {/* Microphone */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-3">
                  마이크
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedAudioInput || 'default'}
                    onChange={(e) => handleAudioInputChange(e.target.value)}
                    className="input flex-1"
                  >
                    <option value="default">시스템 기본 장치</option>
                    {audioInputDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `마이크 ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={`btn btn-icon p-2 rounded-lg ${
                      audioEnabled ? 'btn-secondary' : 'btn-danger'
                    }`}
                    aria-label={audioEnabled ? '마이크 끄기' : '마이크 켜기'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {audioEnabled ? (
                        <>
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
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
                <p className="text-xs text-muted mt-1">
                  회의 중에도 툴바에서 마이크를 켜고 끌 수 있습니다.
                </p>
              </div>

              {/* Speaker */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-3">
                  스피커
                </label>
                <select
                  value={selectedAudioOutput || 'default'}
                  onChange={(e) => handleAudioOutputChange(e.target.value)}
                  className="input w-full"
                >
                  <option value="default">시스템 기본 장치</option>
                  {audioOutputDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `스피커 ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted mt-1">
                  회의 소리 출력 장치를 선택합니다.
                </p>
              </div>

              {/* Test Section */}
              <div className="border-t border-border-color pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('audio')}
                  className="btn btn-secondary w-full"
                >
                  오디오 테스트
                </button>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-6">
              {/* Camera Preview */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-3">
                  카메라 미리보기
                </label>
                <div className="aspect-video bg-tertiary rounded-lg overflow-hidden border border-border-color relative">
                  {testStream && videoRef.current ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                      <p>카메라를 선택하면 미리보기가 표시됩니다</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Camera Selection */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-3">
                  카메라
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedVideoInput || 'default'}
                    onChange={(e) => handleVideoInputChange(e.target.value)}
                    className="input flex-1"
                  >
                    <option value="default">시스템 기본 장치</option>
                    {videoInputDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `카메라 ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setVideoEnabled(!videoEnabled)}
                    className={`btn btn-icon p-2 rounded-lg ${
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

              {/* Video Settings */}
              <div className="border-t border-border-color pt-4 space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-secondary">회의 참가 시 비디오 끄기</span>
                  <div className={`toggle ${!videoEnabled ? 'active' : ''}`} onClick={() => setVideoEnabled(!videoEnabled)} />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-secondary">내 비디오 미러링</span>
                  <div className="toggle active" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-secondary">HD 비디오 활성화</span>
                  <div className="toggle active" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-secondary">내 비디오에 내 이름 표시</span>
                  <div className="toggle active" />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-secondary mb-3">애플리케이션</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-secondary">시작 시 회의 참가 화면 표시</span>
                    <div className="toggle active" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-secondary">회의 종료 시 확인</span>
                    <div className="toggle active" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-secondary">알림 소리 재생</span>
                    <div className="toggle active" />
                  </label>
                </div>
              </div>

              <div className="border-t border-border-color pt-4">
                <h3 className="font-medium text-secondary mb-3">접근성</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-secondary">자막 항상 표시</span>
                    <div className="toggle" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-secondary">키보드 단축키 표시</span>
                    <div className="toggle active" />
                  </label>
                </div>
              </div>

              <div className="border-t border-border-color pt-4">
                <h3 className="font-medium text-secondary mb-3">정보</h3>
                <div className="text-sm text-muted space-y-1">
                  <p>ZoomClone v1.0.0</p>
                  <p>Electron + React + WebRTC</p>
                  <p className="mt-2">
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                      오픈소스 라이선스 보기
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-color flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}