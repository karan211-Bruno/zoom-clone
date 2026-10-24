// Connection Indicator
import React from 'react';

interface ConnectionIndicatorProps {
  isConnected: boolean;
  error: string | null;
}

export function ConnectionIndicator({ isConnected, error }: ConnectionIndicatorProps) {
  if (!error && isConnected) return null;

  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg shadow-lg animate-slide-up"
      style={{
        background: error ? 'rgba(233, 69, 96, 0.95)' : 'rgba(74, 222, 128, 0.95)',
        color: 'white',
      }}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2">
        {error ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-medium">연결 중...</span>
          </>
        )}
      </div>
    </div>
  );
}