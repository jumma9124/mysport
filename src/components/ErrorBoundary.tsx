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
        <div className="min-h-screen flex items-center justify-center bg-black p-5">
          <div className="bg-card rounded-card p-10 max-w-[500px] w-full text-center border border-red-500/50">
            <div className="text-5xl mb-4">
              &#x26A0;
            </div>
            <h2 className="text-white text-xl font-bold mb-3">
              오류가 발생했습니다
            </h2>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              데이터를 불러오는 중 문제가 발생했습니다.
              <br />
              다시 시도하거나 메인 페이지로 이동해주세요.
            </p>
            {this.state.error && (
              <p className="text-red-500/80 text-xs mb-6 px-3 py-2 bg-red-500/10 rounded-lg break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white cursor-pointer text-sm"
              >
                다시 시도
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-2.5 rounded-lg border-none bg-tab-active/50 text-white cursor-pointer text-sm"
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
