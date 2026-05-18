'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-surface border border-border rounded-xl p-8 text-center shadow-lg">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
