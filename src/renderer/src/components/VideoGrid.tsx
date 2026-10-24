// Video Grid Component
import React, { useRef, useEffect, useCallback } from 'react';
import type { User } from '@shared/types';
import { ParticipantVideo } from './ParticipantVideo';

interface VideoGridProps {
  participants: User[];
  currentUserId: string;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isScreenSharing: boolean;
}

export function VideoGrid({
  participants,
  currentUserId,
  localStream,
  screenStream,
  isScreenSharing,
}: VideoGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Sort participants: current user first, then host, then others
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    return a.name.localeCompare(b.name);
  });

  // Determine grid layout class
  const getGridClass = (count: number) => {
    if (count <= 1) return 'video-grid single';
    if (count === 2) return 'video-grid two';
    if (count === 3) return 'video-grid three';
    if (count === 4) return 'video-grid four';
    if (count <= 6) return 'video-grid six';
    return 'video-grid';
  };

  const visibleParticipants = sortedParticipants.filter(p => 
    p.videoEnabled || p.screenSharing || p.id === currentUserId
  );

  // If screen sharing, show screen share prominently
  const screenSharer = participants.find(p => p.screenSharing && p.id !== currentUserId);

  return (
    <div
      ref={gridRef}
      className={`${getGridClass(visibleParticipants.length)} h-full p-4 gap-3 overflow-auto`}
      role="region"
      aria-label="비디오 그리드"
    >
      {/* Screen Share View (if someone else is sharing) */}
      {screenSharer && screenStream && (
        <ParticipantVideo
          key={`screen-${screenSharer.id}`}
          user={screenSharer}
          stream={screenStream}
          isLocal={false}
          isScreenShare={true}
          isLarge={true}
        />
      )}

      {/* Local User (always first if video enabled) */}
      {localStream && (
        <ParticipantVideo
          key={`local-${currentUserId}`}
          user={participants.find(p => p.id === currentUserId)!}
          stream={localStream}
          isLocal={true}
          isScreenShare={isScreenSharing}
        />
      )}

      {/* Other Participants */}
      {sortedParticipants
        .filter(p => 
          p.id !== currentUserId && 
          p.id !== screenSharer?.id &&
          (p.videoEnabled || p.screenSharing)
        )
        .map(participant => (
          <ParticipantVideo
            key={participant.id}
            user={participant}
            stream={null} // Remote streams would be attached via WebRTC
            isLocal={false}
            isScreenShare={participant.screenSharing}
          />
        ))}

      {/* Empty State for participants without video */}
      {sortedParticipants
        .filter(p => 
          p.id !== currentUserId && 
          p.id !== screenSharer?.id &&
          !p.videoEnabled && 
          !p.screenSharing
        )
        .map(participant => (
          <ParticipantVideo
            key={`avatar-${participant.id}`}
            user={participant}
            stream={null}
            isLocal={false}
            isScreenShare={false}
          />
        ))}

      {/* Empty Grid Placeholder */}
      {visibleParticipants.length === 0 && !localStream && (
        <div className="col-span-full flex flex-col items-center justify-center h-full text-secondary">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-50">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <p className="text-lg">비디오가 켜진 참가자가 없습니다</p>
          <p className="text-sm mt-1">카메라를 켜거나 참가자를 초대하세요</p>
        </div>
      )}
    </div>
  );
}