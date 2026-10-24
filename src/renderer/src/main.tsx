// React entry point
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

// Error boundary for graceful error handling
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: '#1a1a2e', color: '#eaeaea',
          fontFamily: 'Inter, sans-serif', padding: '2rem', textAlign: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#e94560' }}>
              오류가 발생했습니다
            </h1>
            <p style={{ marginBottom: '2rem', opacity: 0.8 }}>
              {this.state.error?.message || '알 수 없는 오류'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem', background: '#e94560', color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer'
              }}
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);