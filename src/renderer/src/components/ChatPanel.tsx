// Chat Panel
import React, { useRef, useEffect, useState } from 'react';

interface ChatPanelProps {
  messages: Array<{
    id: string;
    from: string;
    fromName: string;
    message: string;
    timestamp: number;
    isPrivate?: boolean;
  }>;
  currentUserId: string;
  currentUserName: string;
}

export function ChatPanel({
  messages,
  currentUserId,
  currentUserName,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendTo, setSendTo] = useState<'everyone' | string>('everyone');

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // In real app, this would send via signaling
    console.log('Sending message:', newMessage, 'to:', sendTo);
    setNewMessage('');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-secondary">
      {/* Chat Header */}
      <div className="p-3 border-b border-border-color">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-primary">채팅</h3>
          <button className="btn btn-icon btn-ghost p-1" aria-label="채팅 설정">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* Send To Selector */}
        <select
          value={sendTo}
          onChange={(e) => setSendTo(e.target.value)}
          className="input w-full text-sm py-2"
        >
          <option value="everyone">모든 참가자</option>
          {/* Private message options would be added here */}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted text-sm">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-50">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>메시지가 없습니다</p>
            <p className="text-xs mt-1">첫 메시지를 보내보세요</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.from === currentUserId ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar for other users */}
              {msg.from !== currentUserId && (
                <div className="avatar avatar-sm flex-shrink-0 bg-tertiary">
                  {msg.fromName.charAt(0).toUpperCase()}
                </div>
              )}

              <div
                className={`max-w-[70%] ${
                  msg.from === currentUserId ? 'text-right' : 'text-left'
                }`}
              >
                {msg.from !== currentUserId && (
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs font-medium text-secondary">{msg.fromName}</span>
                    {msg.isPrivate && (
                      <span className="badge badge-yellow text-xs">비공개</span>
                    )}
                    <span className="text-xs text-muted">{formatTime(msg.timestamp)}</span>
                  </div>
                )}

                <div
                  className={`inline-block px-3 py-2 rounded-2xl ${
                    msg.from === currentUserId
                      ? 'bg-accent-primary text-white rounded-tr-none'
                      : 'bg-tertiary text-primary rounded-tl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>

                {msg.from === currentUserId && (
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <span className="text-xs text-muted">{formatTime(msg.timestamp)}</span>
                  </div>
                )}
              </div>

              {/* Avatar for current user */}
              {msg.from === currentUserId && (
                <div className="avatar avatar-sm flex-shrink-0 bg-accent-primary">
                  {currentUserName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-border-color">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={sendTo === 'everyone' ? '모든 참가자에게 메시지 보내기...' : `비공개 메시지...`}
            className="input flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            aria-label="채팅 메시지 입력"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="btn btn-primary px-4"
            aria-label="메시지 전송"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}