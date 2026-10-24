// Main Meeting Screen
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '../store';
import { api } from '../electron-bridge';
import { VideoGrid } from './VideoGrid';
import { Toolbar } from './Toolbar';
import { Sidebar } from './Sidebar';
import { ParticipantsPanel } from './ParticipantsPanel';
import { ChatPanel } from './ChatPanel';
import { ScreenShareBanner } from './ScreenShareBanner';
import { ConnectionIndicator } from './ConnectionIndicator';

export function MeetingScreen() {
  const {
    currentUser,
    currentMeeting,
    localStream,
    screenStream,
    audioEnabled,
    videoEnabled,
    isScreenSharing,
    isRecording,
    activeTab,
    setActiveTab,
    showSettings,
    messages,
    isConnected,
    connectionError,
    participants,
  } = useAppStore();

  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<'participants' | 'chat'>('participants');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle audio: Space (when not in input)
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        useAppStore.getState().setAudioEnabled(!audioEnabled);
      }
      // Toggle video: V
      if (e.key === 'v' || e.key === 'V') {
        if (e.target === document.body) {
          e.preventDefault();
          useAppStore.getState().setVideoEnabled(!videoEnabled);
        }
      }
      // Toggle chat: H
      if (e.key === 'h' || e.key === 'H') {
        if (e.target === document.body) {
          setShowSidebar(true);
          setSidebarContent('chat');
        }
      }
      // Toggle participants: U
      if (e.key === 'u' || e.key === 'U') {
        if (e.target === document.body) {
          setShowSidebar(true);
          setSidebarContent('participants');
        }
      }
      // Fullscreen: F
      if (e.key === 'f' || e.key === 'F') {
        if (e.target === document.body) {
          setIsFullscreen(!isFullscreen);
        }
      }
      // Escape to close sidebar
      if (e.key === 'Escape') {
        setShowSidebar(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioEnabled, videoEnabled]);

  // Handle fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  if (!currentMeeting || !currentUser) return null;

  const allParticipants = currentMeeting.participants;

  return (
    <div className="h-screen w-screen flex flex-col bg-primary relative">
      {/* Screen Share Banner */}
      {isScreenSharing && (
        <ScreenShareBanner onStopShare={() => useAppStore.getState().setIsScreenSharing(false)} />
      )}

      {/* Connection Indicator */}
      <ConnectionIndicator isConnected={isConnected} error={connectionError} />

      {/* Main Video Area */}
      <main className="flex-1 flex relative overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 relative">
          <VideoGrid
            participants={allParticipants}
            currentUserId={currentUser.id}
            localStream={localStream}
            screenStream={screenStream}
            isScreenSharing={isScreenSharing}
          />
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <aside className="w-80 lg:w-96 bg-secondary border-l border-border-color flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-3 border-b border-border-color">
              <h2 className="font-semibold text-primary">
                {sidebarContent === 'participants' ? '참가자' : '채팅'}
              </h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="btn btn-icon btn-ghost p-1"
                aria-label="닫기"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {sidebarContent === 'participants' ? (
                <ParticipantsPanel
                  participants={allParticipants}
                  currentUserId={currentUser.id}
                  currentUserIsHost={currentUser.isHost}
                />
              ) : (
                <ChatPanel
                  messages={messages}
                  currentUserId={currentUser.id}
                  currentUserName={currentUser.name}
                />
              )}
            </div>
            <div className="flex border-t border-border-color p-2">
              <button
                onClick={() => { setSidebarContent('participants'); setActiveTab('participants'); }}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition ${
                  sidebarContent === 'participants'
                    ? 'bg-accent-primary text-white'
                    : 'text-secondary hover:text-primary hover:bg-tertiary'
                }`}
              >
                참가자 ({allParticipants.length})
              </button>
              <button
                onClick={() => { setSidebarContent('chat'); setActiveTab('chat'); }}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition ${
                  sidebarContent === 'chat'
                    ? 'bg-accent-primary text-white'
                    : 'text-secondary hover:text-primary hover:bg-tertiary'
                }`}
              >
                채팅 ({messages.length})
              </button>
            </div>
          </aside>
        )}
      </main>

      {/* Toolbar */}
      <Toolbar
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        isScreenSharing={isScreenSharing}
        isRecording={isRecording}
        isHost={currentUser.isHost}
        onToggleAudio={() => useAppStore.getState().setAudioEnabled(!audioEnabled)}
        onToggleVideo={() => useAppStore.getState().setVideoEnabled(!videoEnabled)}
        onToggleScreenShare={() => useAppStore.getState().setIsScreenSharing(!isScreenSharing)}
        onToggleRecording={() => useAppStore.getState().setIsRecording(!isRecording)}
        onShowParticipants={() => { setSidebarContent('participants'); setShowSidebar(true); }}
        onShowChat={() => { setSidebarContent('chat'); setShowSidebar(true); }}
        onLeaveMeeting={async () => {
          await api.leaveMeeting();
          useAppStore.getState().reset();
        }}
        onSettings={() => useAppStore.getState().setShowSettings(true)}
        onFullscreen={() => setIsFullscreen(!isFullscreen)}
        isFullscreen={isFullscreen}
      />
    </div>
  );
}

// Extract participants from meeting for convenience
function useParticipants() {
  return useAppStore(state => state.currentMeeting?.participants || []);
}