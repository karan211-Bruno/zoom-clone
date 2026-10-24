// Participants Panel
import React from 'react';
import type { User } from '@shared/types';

interface ParticipantsPanelProps {
  participants: User[];
  currentUserId: string;
  currentUserIsHost: boolean;
}

export function ParticipantsPanel({
  participants,
  currentUserId,
  currentUserIsHost,
}: ParticipantsPanelProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Sort: host first, then current user, then others
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-3 border-b border-border-color">
        <h3 className="font-semibold text-primary">참가자 ({participants.length})</h3>
      </div>

      <ul className="flex-1 overflow-y-auto divide-y divide-border-color" role="list">
        {sortedParticipants.map(participant => (
          <li
            key={participant.id}
            className={`flex items-center gap-3 p-3 hover:bg-tertiary/50 transition ${
              participant.id === currentUserId ? 'bg-accent-primary/10' : ''
            }`}
          >
            <div
              className={`avatar avatar-sm ${
                participant.screenSharing ? 'ring-2 ring-green-500' : ''
              }`}
            >
              {participant.screenSharing ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
              ) : (
                getInitials(participant.name)
              )}
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary truncate flex items-center gap-1">
                  {participant.name}
                  {participant.id === currentUserId && (
                    <span className="badge bg-primary/80 text-primary text-xs">나</span>
                  )}
                  {participant.isHost && (
                    <span className="badge badge-host text-xs">호스트</span>
                  )}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                  {!participant.audioEnabled && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="17" y1="17" x2="7" y2="7" />
                    </svg>
                  )}
                  {!participant.videoEnabled && !participant.screenSharing && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      <line x1="1" y1="5" x2="23" y2="19" />
                    </svg>
                  )}
                  {participant.screenSharing && (
                    <span className="badge badge-speaking text-xs">화면 공유</span>
                  )}
                </div>
              </div>

              {/* Host controls */}
              {currentUserIsHost && participant.id !== currentUserId && (
                <div className="flex items-center gap-1">
                  <button
                    className={`btn btn-icon p-1 rounded ${
                      participant.audioEnabled ? 'btn-secondary' : 'btn-danger'
                    }`}
                    aria-label={participant.audioEnabled ? '음소거' : '음소거 해제'}
                    title={participant.audioEnabled ? '음소거' : '음소거 해제'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {participant.audioEnabled ? (
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
                  <button
                    className="btn btn-icon p-1 rounded btn-secondary"
                    aria-label="더 보기"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {participants.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-muted">
          <p>참가자가 없습니다</p>
        </div>
      )}

      <div className="p-3 border-t border-border-color">
        <button className="btn btn-secondary w-full text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          초대
        </button>
      </div>
    </div>
  );
}