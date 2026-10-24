// Meeting Toolbar
import React, { useRef, useState, useEffect } from 'react';

interface ToolbarProps {
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isHost: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onShowParticipants: () => void;
  onShowChat: () => void;
  onLeaveMeeting: () => void;
  onSettings: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
}

export function Toolbar({
  audioEnabled,
  videoEnabled,
  isScreenSharing,
  isRecording,
  isHost,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onShowParticipants,
  onShowChat,
  onLeaveMeeting,
  onSettings,
  onFullscreen,
  isFullscreen,
}: ToolbarProps) {
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showVideoMenu, setShowVideoMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const audioMenuRef = useRef<HTMLDivElement>(null);
  const videoMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowAudioMenu(false);
        setShowVideoMenu(false);
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menu: 'audio' | 'video' | 'more') => {
    setShowAudioMenu(menu === 'audio' ? !showAudioMenu : false);
    setShowVideoMenu(menu === 'video' ? !showVideoMenu : false);
    setShowMoreMenu(menu === 'more' ? !showMoreMenu : false);
  };

  return (
    <footer
      ref={toolbarRef}
      className="bg-secondary/95 backdrop-blur border-t border-border-color px-4 py-3"
      role="toolbar"
      aria-label="회의 컨트롤"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Audio/Video Controls */}
        <div className="flex items-center gap-2">
          {/* Mute/Unmute */}
          <div className="relative">
            <button
              onClick={onToggleAudio}
              onMouseDown={(e) => e.preventDefault()}
              className={`btn btn-icon p-2 rounded-lg transition ${
                audioEnabled ? 'btn-secondary' : 'btn-danger'
              }`}
              aria-label={audioEnabled ? '마이크 끄기 (Space)' : '마이크 켜기 (Space)'}
              aria-pressed={audioEnabled}
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
            {showAudioMenu && (
              <div
                ref={audioMenuRef}
                className="dropdown-menu bottom-full mb-2 left-1/2 -translate-x-1/2 min-w-[200px]"
                role="menu"
              >
                <div className="p-2 border-b border-border-color">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={audioEnabled}
                      onChange={onToggleAudio}
                      className="w-4 h-4 accent-accent-primary"
                    />
                    <span className="text-sm">마이크 켜기/끄기</span>
                  </label>
                </div>
                <div className="p-2">
                  <p className="text-xs text-muted mb-2">마이크 선택</p>
                  <select className="input w-full text-xs" disabled>
                    <option>기본 마이크</option>
                  </select>
                </div>
                <div className="p-2 border-t border-border-color">
                  <button
                    onClick={() => toggleMenu('audio')}
                    className="btn btn-secondary w-full text-sm py-2"
                  >
                    오디오 설정...
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Start/Stop Video */}
          <div className="relative">
            <button
              onClick={onToggleVideo}
              className={`btn btn-icon p-2 rounded-lg transition ${
                videoEnabled ? 'btn-secondary' : 'btn-danger'
              }`}
              aria-label={videoEnabled ? '비디오 끄기 (V)' : '비디오 켜기 (V)'}
              aria-pressed={videoEnabled}
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
            {showVideoMenu && (
              <div
                ref={videoMenuRef}
                className="dropdown-menu bottom-full mb-2 left-1/2 -translate-x-1/2 min-w-[200px]"
                role="menu"
              >
                <div className="p-2 border-b border-border-color">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={videoEnabled}
                      onChange={onToggleVideo}
                      className="w-4 h-4 accent-accent-primary"
                    />
                    <span className="text-sm">비디오 켜기/끄기</span>
                  </label>
                </div>
                <div className="p-2">
                  <p className="text-xs text-muted mb-2">카메라 선택</p>
                  <select className="input w-full text-xs" disabled>
                    <option>기본 카메라</option>
                  </select>
                </div>
                <div className="p-2 border-t border-border-color">
                  <button
                    onClick={() => toggleMenu('video')}
                    className="btn btn-secondary w-full text-sm py-2"
                  >
                    비디오 설정...
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Actions */}
        <div className="flex items-center gap-2">
          {/* Screen Share */}
          <button
            onClick={onToggleScreenShare}
            className={`btn btn-icon p-2 rounded-lg transition ${
              isScreenSharing ? 'bg-accent-primary text-white' : 'btn-secondary'
            }`}
            aria-label={isScreenSharing ? '화면 공유 중단' : '화면 공유'}
            aria-pressed={isScreenSharing}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </button>

          {/* Record */}
          <button
            onClick={onToggleRecording}
            className={`btn btn-icon p-2 rounded-lg transition ${
              isRecording ? 'bg-red-600/20 text-red-400 animate-pulse' : 'btn-secondary'
            }`}
            aria-label={isRecording ? '녹화 중단' : '녹화 시작'}
            aria-pressed={isRecording}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="8" />
            </svg>
          </button>

          {/* Participants */}
          <button
            onClick={onShowParticipants}
            className="btn btn-secondary px-3 py-2 gap-2"
            aria-label="참가자 패널 열기 (U)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>참가자</span>
          </button>

          {/* Chat */}
          <button
            onClick={onShowChat}
            className="btn btn-secondary px-3 py-2 gap-2"
            aria-label="채팅 패널 열기 (H)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>채팅</span>
          </button>

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('more')}
              className="btn btn-icon btn-secondary p-2"
              aria-label="더 보기"
              aria-expanded={showMoreMenu}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </button>
            {showMoreMenu && (
              <div
                ref={moreMenuRef}
                className="dropdown-menu bottom-full mb-2 right-0 min-w-[180px]"
                role="menu"
              >
                <button
                  onClick={onSettings}
                  className="dropdown-item"
                  role="menuitem"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  설정
                </button>
                <div className="dropdown-divider" />
                <button
                  onClick={onFullscreen}
                  className="dropdown-item"
                  role="menuitem"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {isFullscreen ? (
                      <>
                        <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
                      </>
                    ) : (
                      <>
                        <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
                      </>
                    )}
                  </svg>
                  {isFullscreen ? '전체 화면 종료' : '전체 화면'}
                </button>
                <button
                  onClick={onLeaveMeeting}
                  className="dropdown-item danger"
                  role="menuitem"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  회의 나가기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Leave Meeting */}
        <div className="flex items-center gap-2">
          <button
            onClick={onLeaveMeeting}
            className="btn btn-danger px-4 py-2 gap-2"
            aria-label="회의 나가기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>나가기</span>
          </button>
        </div>
      </div>
    </footer>
  );
}