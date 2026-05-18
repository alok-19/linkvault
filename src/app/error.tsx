'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-surface border border-border rounded-xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-2">
            {error.message || 'An unexpected error occurred.'}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mb-6 font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
