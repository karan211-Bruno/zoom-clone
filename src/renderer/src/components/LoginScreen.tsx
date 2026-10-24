// Login / Join Meeting Screen
import React, { useState, useCallback } from 'react';
import { useAppStore } from '../store';
import { api } from '../electron-bridge';
import { v4 as uuidv4 } from 'uuid';

export function LoginScreen({ onJoin }: { onJoin: () => void }) {
  const [userName, setUserName] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [password, setPassword] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'join' | 'new'>('join');
  const setCurrentUser = useAppStore(s => s.setCurrentUser);
  const setCurrentMeeting = useAppStore(s => s.setCurrentMeeting);
  const setIsJoining = useAppStore(s => s.setIsJoining);
  const setConnectionError = useAppStore(s => s.setConnectionError);

  const handleJoinMeeting = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !meetingId.trim()) {
      setError('이름과 회의 ID를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.joinMeeting({
        userName: userName.trim(),
        meetingId: meetingId.trim(),
        password: password.trim() || undefined,
        audioEnabled,
        videoEnabled,
      });

      if (result.success && result.meeting && result.user) {
        setCurrentUser(result.user);
        setCurrentMeeting(result.meeting);
        setIsJoining(true);
        onJoin();
      } else {
        setError(result.error?.message || '회의 참가에 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
      console.error('Join error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userName, meetingId, password, audioEnabled, videoEnabled, setCurrentUser, setCurrentMeeting, setIsJoining, onJoin]);

  const handleNewMeeting = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newMeetingId = uuidv4().slice(0, 10).toUpperCase();
      const result = await api.joinMeeting({
        userName: userName.trim(),
        meetingId: newMeetingId,
        audioEnabled,
        videoEnabled,
      });

      if (result.success && result.meeting && result.user) {
        setCurrentUser(result.user);
        setCurrentMeeting(result.meeting);
        setIsJoining(true);
        onJoin();
      } else {
        setError(result.error?.message || '회의 생성에 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
      console.error('New meeting error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userName, audioEnabled, videoEnabled, setCurrentUser, setCurrentMeeting, setIsJoining, onJoin]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent-primary mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polygon points="21 15 16 10 21 5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-primary">ZoomClone</h1>
          <p className="text-secondary mt-1">화상 회의 플랫폼</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-secondary rounded-lg p-1 mb-6" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'join'}
            onClick={() => { setActiveTab('join'); setError(null); }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              activeTab === 'join'
                ? 'bg-accent-primary text-white shadow'
                : 'text-secondary hover:text-primary'
            }`}
          >
            회의 참가
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'new'}
            onClick={() => { setActiveTab('new'); setError(null); }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              activeTab === 'new'
                ? 'bg-accent-primary text-white shadow'
                : 'text-secondary hover:text-primary'
            }`}
          >
            새 회의
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm animate-slide-up" role="alert">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={activeTab === 'join' ? handleJoinMeeting : handleNewMeeting} className="space-y-4">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-secondary mb-1.5">
              내 이름
            </label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="표시될 이름"
              className="input w-full"
              autoComplete="name"
              required
              autoFocus
            />
          </div>

          {activeTab === 'join' && (
            <div>
              <label htmlFor="meetingId" className="block text-sm font-medium text-secondary mb-1.5">
                회의 ID
              </label>
              <input
                id="meetingId"
                type="text"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value.toUpperCase())}
                placeholder="회의 ID 또는 개인 링크"
                className="input w-full text-center tracking-widest"
                autoComplete="off"
                required
                maxLength={12}
              />
            </div>
          )}

          {activeTab === 'join' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary mb-1.5">
                회의 비밀번호 (선택사항)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="input w-full"
                autoComplete="current-password"
              />
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={(e) => setAudioEnabled(e.target.checked)}
                className="w-4 h-4 accent-accent-primary rounded border-border-color bg-secondary"
              />
              <span className="text-sm text-secondary">오디오 켜기</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={videoEnabled}
                onChange={(e) => setVideoEnabled(e.target.checked)}
                className="w-4 h-4 accent-accent-primary rounded border-border-color bg-secondary"
              />
              <span className="text-sm text-secondary">비디오 켜기</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || !userName.trim() || (activeTab === 'join' && !meetingId.trim())}
            className="btn btn-primary w-full py-3 text-lg mt-2"
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                {activeTab === 'join' ? '참가 중...' : '회의 만들기...'}
              </>
            ) : (
              activeTab === 'join' ? '회의 참가' : '새 회의 시작'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted">
          <p>ZoomClone v1.0.0 &mdash; Electron + React + WebRTC</p>
          <p className="mt-1">Windows & macOS 크로스 플랫폼 지원</p>
        </div>
      </div>
    </div>
  );
}