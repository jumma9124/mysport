import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
          padding: '20px',
        }}>
          <div style={{
            background: 'rgb(32, 34, 52)',
            borderRadius: '15px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.5)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              &#x26A0;
            </div>
            <h2 style={{
              color: '#fff',
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '12px',
            }}>
              오류가 발생했습니다
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px',
              marginBottom: '24px',
              lineHeight: '1.5',
            }}>
              데이터를 불러오는 중 문제가 발생했습니다.
              <br />
              다시 시도하거나 메인 페이지로 이동해주세요.
            </p>
            {this.state.error && (
              <p style={{
                color: 'rgba(239, 68, 68, 0.8)',
                fontSize: '12px',
                marginBottom: '24px',
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                wordBreak: 'break-all',
              }}>
                {this.state.error.message}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                다시 시도
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(102, 126, 234, 0.5)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                메인으로
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
