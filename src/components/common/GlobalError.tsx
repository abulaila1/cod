import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white border-4 border-red-500 rounded-lg shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-red-900">
                  Application Error
                </h1>
                <p className="text-red-700">حدث خطأ في التطبيق</p>
              </div>
            </div>

            <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
              <h2 className="font-bold text-red-900 mb-2">Error Message:</h2>
              <p className="text-red-800 font-mono text-sm break-words">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>

            {this.state.error?.stack && (
              <details className="mb-6">
                <summary className="cursor-pointer font-bold text-red-900 mb-2">
                  Stack Trace (Click to expand)
                </summary>
                <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg text-xs overflow-auto max-h-64">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {this.state.errorInfo?.componentStack && (
              <details className="mb-6">
                <summary className="cursor-pointer font-bold text-red-900 mb-2">
                  Component Stack (Click to expand)
                </summary>
                <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg text-xs overflow-auto max-h-64">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 bg-zinc-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
              >
                Go Home
              </button>
            </div>

            <div className="mt-6 text-sm text-red-700 text-center">
              <p>If this error persists, please contact support.</p>
              <p className="mt-1">إذا استمر هذا الخطأ، يرجى التواصل مع الدعم.</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
