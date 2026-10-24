// Screen Share Banner
import React from 'react';

interface ScreenShareBannerProps {
  onStopShare: () => void;
}

export function ScreenShareBanner({ onStopShare }: ScreenShareBannerProps) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-2 flex items-center justify-between shadow-lg animate-slide-up"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
        <span className="font-medium">화면을 공유하고 있습니다</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onStopShare}
          className="btn btn-danger px-4 py-2 text-sm font-medium flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M21 12H3" />
            <path d="M12 21V3" />
          </svg>
          공유 중단
        </button>
      </div>
    </div>
  );
}