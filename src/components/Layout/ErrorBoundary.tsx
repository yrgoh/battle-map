import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0a0a1a',
          color: '#fff',
          fontFamily: 'Arial, sans-serif',
          padding: 20,
        }}>
          <h2 style={{ color: '#e74c3c' }}>Something went wrong</h2>
          <p style={{ color: '#888', maxWidth: 500, textAlign: 'center' }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 16,
              padding: '8px 20px',
              background: '#2ecc71',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
