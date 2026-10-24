// Participant Video Component
import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { User } from '@shared/types';

interface ParticipantVideoProps {
  user: User;
  stream: MediaStream | null;
  isLocal: boolean;
  isScreenShare: boolean;
  isLarge?: boolean;
}

export function ParticipantVideo({
  user,
  stream,
  isLocal,
  isScreenShare,
  isLarge = false,
}: ParticipantVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showName, setShowName] = useState(true);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Handle video metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // Auto-hide name after delay
  useEffect(() => {
    if (!isLocal && !isScreenShare) {
      const timer = setTimeout(() => setShowName(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isLocal, isScreenShare]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isSpeaking = user.audioEnabled && !isScreenShare; // Simplified - would use audio level in real app

  return (
    <div
      ref={containerRef}
      className={`relative bg-tertiary rounded-xl overflow-hidden border border-border-color transition-all duration-200 ${
        isLarge ? 'col-span-full row-span-2' : ''
      } ${isHovered ? 'shadow-lg ring-2 ring-accent-primary/50' : ''} ${
        isSpeaking ? 'ring-2 ring-green-500/50' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="group"
      aria-label={`${user.name}${isLocal ? ' (나)' : ''}${isScreenShare ? ' 화면 공유 중' : ''}`}
    >
      {/* Video or Avatar */}
      <div className="relative w-full h-full min-h-[200px]">
        {stream && !isScreenShare ? (
          <video
            ref={videoRef}
            autoPlay
            muted={isLocal}
            playsInline
            className="w-full h-full object-cover"
            onLoadedMetadata={handleLoadedMetadata}
            style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }} // Mirror local video
          />
        ) : isScreenShare && stream ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain bg-black"
            onLoadedMetadata={handleLoadedMetadata}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-tertiary">
            <div className={`avatar ${isLarge ? 'avatar-xl' : 'avatar-lg'} bg-gradient-to-br from-accent-primary to-accent-secondary`}>
              {getInitials(user.name)}
            </div>
            {!isLarge && (
              <div className="mt-2 text-center">
                <p className="font-medium text-primary">{user.name}</p>
                <p className="text-xs text-muted">
                  {isScreenShare ? '화면 공유 중' : '비디오 끔'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Speaking Indicator */}
        {isSpeaking && !isScreenShare && (
          <div className="absolute inset-0 border-2 border-green-500/50 rounded-xl animate-pulse pointer-events-none" />
        )}

        {/* Screen Share Badge */}
        {isScreenShare && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-green-600/90 text-white text-xs font-medium rounded-full">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            화면 공유
          </div>
        )}

        {/* Host Badge */}
        {user.isHost && !isScreenShare && (
          <div className="absolute top-2 right-2 badge badge-host">
            호스트
          </div>
        )}

        {/* You Badge */}
        {isLocal && !isScreenShare && (
          <div className="absolute top-2 right-2 badge bg-primary/80 text-primary">
            나
          </div>
        )}

        {/* Recording Indicator */}
        {/* Would be passed as prop in real implementation */}

        {/* Name Overlay */}
        {(showName || isHovered) && !isScreenShare && (
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-white truncate">
                {user.name} {isLocal && '(나)'}
              </span>
              <div className="flex items-center gap-1">
                {!user.audioEnabled && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="17" y1="17" x2="7" y2="7" />
                  </svg>
                )}
                {!user.videoEnabled && !isScreenShare && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    <line x1="1" y1="5" x2="23" y2="19" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hover Controls (for host) */}
      {isHovered && !isLocal && !isScreenShare && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 animate-fade-in pointer-events-none">
          {/* Host-only controls would go here */}
        </div>
      )}
    </div>
  );
}